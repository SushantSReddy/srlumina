"""Exercise imported exam content with a dedicated disposable guest session.

Set PYQ_TEST_STORAGE to a fresh guest storage file outside the project.
Screenshots and credentials stay under /tmp/browser/pyq-content.
"""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 1800},
            storage_state=os.environ["PYQ_TEST_STORAGE"],
        )
        page = await context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))

        async def total():
            return await page.evaluate("""async () => {
                const {supabase} = await import('/src/integrations/supabase/client.ts');
                const {data,error} = await supabase.from('question_logs').select('count');
                if(error) throw new Error(error.message);
                return data.reduce((sum,row)=>sum+row.count,0);
            }""")

        for label in ["JEE Main", "JEE Advanced", "NEET"]:
            await page.goto("http://localhost:8080/pyq", wait_until="networkidle")
            await page.get_by_role("button", name=label, exact=True).click()
            start = page.get_by_role("button", name="Start practice", exact=True)
            await start.wait_for()
            await page.wait_for_function("""() => {
                const b = [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Start practice');
                return b && !b.disabled;
            }""")
            before = await total()
            await start.click()
            await page.get_by_role("button", name="View solution", exact=True).click()
            answer_line = page.get_by_text("Answer:", exact=False)
            await answer_line.wait_for()
            answer = (await answer_line.inner_text()).removeprefix("Answer: ").strip()
            assert await total() == before, "Solution viewing added progress"
            await page.get_by_role("button", name="Reattempt", exact=True).click()

            async def enter_answer():
                number = page.get_by_label("Your answer", exact=True)
                if await number.count():
                    await number.fill(answer)
                else:
                    for option in answer.split(", "):
                        await page.get_by_role("checkbox", name=f"Option {option}", exact=True).check()

            await enter_answer()
            await page.get_by_role("button", name="Check answer", exact=True).click()
            await page.get_by_role("heading", name="Correct answer", exact=True).wait_for()
            assert await total() == before + 1, "First submitted question should count exactly once"
            await page.get_by_role("button", name="Reattempt", exact=True).click()
            await enter_answer()
            await page.get_by_role("button", name="Check answer", exact=True).click()
            await page.get_by_role("heading", name="Correct answer", exact=True).wait_for()
            await page.get_by_text("Already counted today. This attempt is saved separately.", exact=True).wait_for()
            assert await total() == before + 1, "Same-day retry inflated progress"
            assert await page.locator(".katex-error").count() == 0, "Broken mathematical notation"
            screenshot = Path("/tmp/browser/pyq-content") / f"{label.replace(' ', '-').lower()}.png"
            await page.screenshot(path=str(screenshot))
            print(f"PASS {label}: imported question, correct answer, solution zero credit, duplicate-safe credit")
        assert not errors, errors
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())