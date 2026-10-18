"""Real authenticated PYQ regression checks. Uses a dedicated test guest, never production student progress."""
import asyncio, json, os, uuid
from playwright.async_api import async_playwright
QUESTION='16e2506c-2d37-42a5-a04d-536779aef676'
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  context=await browser.new_context(viewport={"width":1280,"height":1800}, timezone_id='Asia/Kolkata',storage_state='/tmp/browser/pyq/guest_state.json')
  page=await context.new_page()
  await page.goto('http://localhost:8080/pyq',wait_until='networkidle')
  async def call(name,args):
   return await page.evaluate('''async ([name,args])=>{const {supabase}=await import('/src/integrations/supabase/client.ts'); const r=await supabase.rpc(name,args);return {data:r.data,error:r.error?.message}}''',[name,args])
  async def rows(table,cols):
   return await page.evaluate('''async ([t,c])=>{const {supabase}=await import('/src/integrations/supabase/client.ts');let r=await supabase.from(t).select(c); return {data:r.data,error:r.error?.message}}''',[table,cols])
  before=await rows('question_logs','count'); total=sum(r['count'] for r in before['data'])
  assert total==1, total
  assert not (await rows('pyq_answer_keys','*'))['data'], 'Private keys exposed'
  own=await rows('pyq_attempts','user_id'); assert len({a['user_id'] for a in own['data']})==1
  s=await call('start_pyq_session',{'_exam':'jee_advanced'});assert not s['error'],s
  solution=await call('pyq_solution',{'_question':QUESTION});assert solution['data']['answer']=='96'
  assert sum(r['count'] for r in (await rows('question_logs','count'))['data'])==total
  payload={'_request':str(uuid.uuid4()),'_session':s['data'],'_question':QUESTION,'_answer':'96'}
  count_before=len((await rows('pyq_attempts','id'))['data'])
  a,b=await asyncio.gather(call('submit_pyq_attempt',payload),call('submit_pyq_attempt',payload))
  assert a==b,(a,b)
  assert a['data']['correct'] is True and a['data']['counted'] is False
  assert len((await rows('pyq_attempts','id'))['data'])==count_before+1
  payload['_request']=str(uuid.uuid4());payload['_answer']='95'
  bad=await call('submit_pyq_attempt',payload);assert bad['data']['correct'] is False
  assert sum(r['count'] for r in (await rows('question_logs','count'))['data'])==1
  assert (await rows('pyq_collections','incorrect,bookmarked'))['data'][0]['incorrect'] is True
  await page.get_by_role('button',name='JEE Advanced',exact=True).click()
  await page.get_by_role('button',name='Start practice',exact=True).click()
  await page.get_by_label('Your answer').fill('96')
  await page.wait_for_timeout(1000)
  url=page.url
  await page.reload(wait_until='networkidle');await page.get_by_label('Your answer').wait_for()
  assert await page.get_by_label('Your answer').input_value()=='96'
  await context.set_offline(True)
  await page.get_by_role('button',name='Check answer',exact=True).click()
  await page.get_by_text('Your submission is saved on this device and waiting to sync.',exact=True).wait_for()
  await context.set_offline(False)
  await page.get_by_role('heading',name='Correct answer',exact=True).wait_for()
  await page.get_by_text('Already counted today. This attempt is saved separately.',exact=True).wait_for()
  await page.screenshot(path='/tmp/browser/pyq/verified.png')
  await page.goto('http://localhost:8080/home',wait_until='networkidle')
  await page.get_by_text('1 of 50 today · 49 to go',exact=True).wait_for()
  await page.goto('http://localhost:8080/analytics',wait_until='networkidle')
  await page.get_by_role('button',name='Lifetime',exact=True).click();await page.wait_for_timeout(1500)
  assert 'TOTAL\n1' in await page.locator('body').inner_text()
  await page.goto('http://localhost:8080/tasks',wait_until='networkidle')
  assert await page.get_by_role('heading',name='Tasks',exact=True).count()==1
  await context.set_viewport_size({'width':390,'height':844})
  await page.goto(url,wait_until='networkidle');await page.get_by_label('Your answer').wait_for()
  assert await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
  await page.screenshot(path='/tmp/browser/pyq/mobile.png')
  print('PASS: protected keys, user isolation, solution adds zero, concurrent duplicate adds one attempt, retry adds zero progress, incorrect collection, resumed draft, offline sync, Home 1, lifetime analytics 1, Tasks, mobile no overflow.')
  await browser.close()
asyncio.run(main())
