// Static, original content for the Topper's Mindset section.
// Client-safe: no server imports.

export type Principle = {
  key: string;
  title: string;
  meaning: string;
  average: string;
  topper: string;
  example: string;
  today: string;
  challenge: string;
};

export const PRINCIPLES: Principle[] = [
  {
    key: "consistency",
    title: "Consistency Over Intensity",
    meaning: "A steady daily rhythm beats occasional heroic sessions. Your brain consolidates learning through repeated, spaced exposure — not through one long night.",
    average: "Studies 8 hours on Sunday after skipping four days, then wonders why nothing stuck.",
    topper: "Studies a fixed, sustainable amount every single day — including days they don't feel like it — and treats the streak itself as the achievement.",
    example: "40 focused questions a day for 300 days beats 300 questions in one weekend burst, and leaves you fresh enough to keep going.",
    today: "Decide one non-negotiable minimum (for example, 20 questions or 1 revision topic) that you complete even on your worst day.",
    challenge: "Log questions in SR Lumina every day for the next 7 days without a gap.",
  },
  {
    key: "understanding",
    title: "Understanding Over Memorisation",
    meaning: "Exam questions are designed so that memorised patterns break down. If you understand why a formula works, you can rebuild it and apply it in unfamiliar wording.",
    average: "Memorises the formula sheet and panics when the question flips the unknown to a quantity they never solved for directly.",
    topper: "Asks 'where does this come from and when does it fail?' until they can derive the result and predict how the examiner will twist it.",
    example: "Instead of memorising the lens formula blindly, derive it once, then solve a case where the object distance is the unknown — memorisation alone can't do that.",
    today: "Pick one formula you use daily and write a three-line derivation of it from first principles.",
    challenge: "For your next 5 new concepts, explain each out loud in under 60 seconds without notes.",
  },
  {
    key: "accuracy",
    title: "Accuracy Before Speed",
    meaning: "Speed is a by-product of accuracy, not a substitute for it. A wrong answer done fast teaches you nothing; a right answer done slowly builds a method you can later trust at speed.",
    average: "Rushes practice sets to 'finish the syllabus' and then repeats the same slips in every mock.",
    topper: "Practises slowly and perfectly first, tracks the error rate, and only then pushes the clock.",
    example: "Solve 10 integrals with 100% correctness and full working; time yourself only in the second round — your speed will already have improved.",
    today: "In your next practice set, count how many questions you got right on the first attempt — make that number the goal, not the count attempted.",
    challenge: "Do one 15-question set where the rule is: any careless slip means you redo the whole set.",
  },
  {
    key: "mistakes",
    title: "Mistakes Are Learning Opportunities",
    meaning: "Every error points at an exact, fixable gap. Students who log and review their mistakes turn every wrong answer into a lesson; students who hide them pay for the same lesson again in the exam.",
    average: "Checks the correct answer, says 'got it', and moves on — then loses marks to the same trap in the real exam.",
    topper: "Keeps a mistake notebook, labels each error by type, and retests themselves on it until the error rate drops.",
    example: "After a mock, spending 30 minutes on the 12 wrong answers is worth more than the 3 hours spent attempting the paper.",
    today: "When you get a question wrong today, write one line: what exactly went wrong, in your own words.",
    challenge: "Add 5 mistakes to your Mistake Notebook this week and revisit them before the next test.",
  },
  {
    key: "deepwork",
    title: "Deep Work Over Distractions",
    meaning: "Attention is the scarcest resource in preparation. Two focused hours beat four fragmented ones, because every interruption costs extra time to rebuild context.",
    average: "Studies 'for 5 hours' while the phone is face-up, and finishes with 90 minutes of real work.",
    topper: "Protects blocks of single-task study with the phone away, one goal per block, and a real break afterwards.",
    example: "A phone-free 45-minute block with one target chapter, then a 10-minute walk — repeated, outperforms an entire distracted evening.",
    today: "Put your phone in another room for one 45-minute study block and notice how much more you finish.",
    challenge: "Complete 3 phone-free deep-work blocks a day for the next 5 days.",
  },
  {
    key: "revision",
    title: "Revision Is the Key to Retention",
    meaning: "Forgetting is normal; re-reading is weak revision. Recalling material from memory — same-day and spaced — is what moves knowledge into the exam hall.",
    average: "Reads notes again the night before the test and finds that half of it evaporates under pressure.",
    topper: "Revises the same day, then at increasing gaps, using active recall: blank paper, questions, and explaining aloud.",
    example: "Revise today's class tonight from memory, then again after 3 days and after a week — three short recalls, not three re-reads.",
    today: "Tonight, close your notes and write down everything you remember from today's weakest topic — then check what you missed.",
    challenge: "Revise one older chapter from memory this week, then re-test yourself on 10 questions from it.",
  },
  {
    key: "progress",
    title: "Progress Over Comparison",
    meaning: "Other students' scores are noise you can't control. The only useful benchmark is your own error rate, revision coverage and consistency, measured week over week.",
    average: "Compares ranks with friends daily, feels demotivated, and studies worse — a self-reinforcing loop.",
    topper: "Tracks their own trend: fewer repeats of old mistakes, more chapters solid, higher mock accuracy than last month.",
    example: "Your rank may swing in any mock, but if your silly mistakes fell from 8 to 3, you are objectively improving.",
    today: "Write down one thing you do better this month than last month — that is your real scoreboard.",
    challenge: "Compare yourself only to last week's data for 14 days: accuracy, revision, consistency.",
  },
  {
    key: "discipline",
    title: "Discipline Over Temporary Motivation",
    meaning: "Motivation is weather; discipline is climate. Systems — fixed times, prepared desks, planned targets — carry you through the days when the feeling is gone.",
    average: "Waits to 'feel like studying'; on low-energy days, does nothing at all.",
    topper: "Shows up at the planned time regardless of mood, and lowers the bar instead of skipping it when energy is low.",
    example: "On a terrible day, a topper still does their 20-question minimum — the streak survives, and tomorrow is easier.",
    today: "Set a fixed start time for tomorrow's first study block and honour it no matter how you feel.",
    challenge: "For 7 days, start your first block within 5 minutes of the planned time — mood is irrelevant.",
  },
];

export type Comparison = {
  category: string;
  situation: string;
  common: string;
  topper: string;
};

// Comparison of a common approach with a high-performance approach.
// Tone rule: never insult the student — these are learnable skills, not judgements.
export const COMPARISONS: Comparison[] = [
  {
    category: "Handling difficult questions",
    situation: "A question looks unfamiliar after 30 seconds of reading.",
    common: "Skips immediately, or keeps staring without a plan until time runs out.",
    topper: "Reads twice, names the concept, breaks the question into known parts; attempts what's solvable and returns with fresh eyes later.",
  },
  {
    category: "Dealing with low mock-test scores",
    situation: "A mock score comes back much lower than expected.",
    common: "Feels crushed, avoids looking at the paper, and jumps straight into new chapters.",
    topper: "Treats the paper as data: sorts every error by type, fixes the top two causes, and measures the next mock against them.",
  },
  {
    category: "Managing backlogs",
    situation: "Several chapters are behind schedule.",
    common: "Avoids thinking about them, then tries to 'cover everything' in one panicked weekend.",
    topper: "Lists the backlog, ranks it by exam weight, and schedules small daily chunks so it shrinks visibly every week.",
  },
  {
    category: "Revision habits",
    situation: "Old chapters start feeling foggy.",
    common: "Re-reads notes passively the night before a test and hopes it sticks.",
    topper: "Uses spaced active recall — same day, day 3, day 7 — testing from a blank page instead of re-reading.",
  },
  {
    category: "Managing distractions",
    situation: "The phone and social feeds keep pulling attention away.",
    common: "Keeps the phone nearby 'just in case', losing focus in small invisible leaks.",
    topper: "Designs the environment: phone in another room, one target per block, fixed break times.",
  },
  {
    category: "Approaching weak subjects",
    situation: "One subject consistently drains marks and confidence.",
    common: "Avoids it to protect the mood, so the gap only widens.",
    topper: "Allocates the best energy of the day to the weakest subject and rebuilds it from fundamentals, in small wins.",
  },
  {
    category: "Handling silly mistakes",
    situation: "Known concepts keep losing marks to small slips.",
    common: "Dismisses them as bad luck or 'carelessness' and moves on.",
    topper: "Treats each slip as a process bug: slowing down at final steps, writing units, re-reading what was actually asked.",
  },
  {
    category: "Time management",
    situation: "The paper ends before the questions do.",
    common: "Goes in order, gets stuck early, and rushes the last section blindly.",
    topper: "Scans the paper first, banks easy marks, time-boxes each question, and knows when to move on.",
  },
  {
    category: "Competition and rank",
    situation: "Friends and online toppers seem far ahead.",
    common: "Measures daily worth against other people's highlight reels.",
    topper: "Uses the board only for direction, and tracks their own week-over-week accuracy and coverage.",
  },
  {
    category: "Exam pressure",
    situation: "Heart racing, blank mind in the exam hall.",
    common: "Fights the panic, re-reads the same line five times, wastes the first 15 minutes.",
    topper: "Trained response: slow breath, start with a known question, and let early momentum restore rhythm.",
  },
];

export type WorkedStage = { title: string; body: string };

// Original sample problem with a staged solution (no copying from any source).
export const WORKED_PROBLEM = {
  subject: "Physics · Kinematics",
  prompt:
    "Ball A is projected vertically upward from the ground with speed 30 m/s. At the same instant, ball B is projected vertically upward from a platform 40 m above the ground with speed 10 m/s. Taking g = 10 m/s² and ignoring air resistance, find the height above the ground at which the two balls pass each other.",
  stages: [
    {
      title: "1 · Understand the question",
      body: "Two objects move at the same time under gravity alone. 'Pass each other' means their heights above the ground are equal at some instant. One origin (the ground), one clock (the shared launch moment) — that's the whole setup.",
    },
    {
      title: "2 · Identify the concept",
      body: "One-dimensional motion with constant acceleration (free fall). Each ball's height is a function of time: initial position plus initial velocity times t, minus ½gt².",
    },
    {
      title: "3 · Develop the approach",
      body: "Write both height functions against the same clock: hA(t) = 30t − 5t², hB(t) = 40 + 10t − 5t². Passing means hA(t) = hB(t) — one equation, one unknown.",
    },
    {
      title: "4 · Solve step by step",
      body: "Set them equal: 30t − 5t² = 40 + 10t − 5t². The quadratic terms cancel — so 20t = 40, giving t = 2 s. Substitute back: hA(2) = 60 − 20 = 40 m. Check it makes sense: ball B hasn't landed (it returns to the platform after 2 s of up-and-down? No — it is still moving at that height), and ball A is mid-flight. The two balls pass each other 40 m above the ground.",
    },
    {
      title: "5 · Common mistakes",
      body: "Using different clocks for the two balls; flipping the sign of g midway; forgetting ball B's 40 m head start; or assuming they must meet at the midpoint of their paths. Every one of these comes from skipping step 1.",
    },
    {
      title: "6 · Key takeaway",
      body: "Before computing anything, translate the words into equations that share one origin and one clock. Most 'hard' kinematics questions collapse into algebra the moment the setup is written honestly.",
    },
  ],
};

export type MistakeCategory = { key: string; title: string; description: string; fix: string };

export const MISTAKE_CATEGORIES: MistakeCategory[] = [
  {
    key: "conceptual",
    title: "Conceptual mistakes",
    description: "The idea itself was incomplete — a formula applied outside its conditions, a law misremembered, a definition blurred.",
    fix: "Rebuild the concept from its derivation, then re-solve a simpler question with the same idea.",
  },
  {
    key: "calculation",
    title: "Calculation mistakes",
    description: "The plan was right but the arithmetic slipped — a sign, a carried digit, a dropped unit.",
    fix: "Slow down at the last two steps, write intermediate values, and sanity-check magnitude and units.",
  },
  {
    key: "misread",
    title: "Question-reading mistakes",
    description: "Solved a different question than the one asked — missed 'not', wrong quantity, wrong body, wrong graph axis.",
    fix: "Underline the asked quantity and the given data before touching the pen; re-read at the halfway point.",
  },
  {
    key: "time",
    title: "Time-management mistakes",
    description: "Right method, wrong budget — burned ten minutes on one question and lost three easy ones at the end.",
    fix: "Time-box every question, mark and leave when the box expires, and return only after banking the easy marks.",
  },
];

export type OsItem = { key: string; label: string; hint: string };

export const DAILY_OS_ITEMS: OsItem[] = [
  { key: "targets", label: "Set today's learning targets", hint: "Name chapters and question counts before you start." },
  { key: "class_attention", label: "Full attention in class", hint: "One class, phone away, notes in your own words." },
  { key: "same_day_revision", label: "Same-day revision", hint: "Recall today's topics tonight from a blank page." },
  { key: "practice", label: "Question-solving practice", hint: "Log your questions in SR Lumina — accuracy first." },
  { key: "backlog", label: "Backlog time (even 20 minutes)", hint: "One small chunk daily keeps the pile from growing." },
  { key: "breaks", label: "Real breaks and recovery", hint: "Walk, stretch, look away from screens — recovery is training." },
  { key: "sleep", label: "Consistent sleep", hint: "Same sleep window daily; memory consolidates overnight." },
  { key: "weekly_review", label: "Weekly performance analysis", hint: "Once a week: review accuracy, revision and backlog trend." },
];

export type ChallengeDay = { day: number; title: string; task: string; guidance: string };

export const CHALLENGE_DAYS: ChallengeDay[] = [
  {
    day: 1,
    title: "Name your biggest weakness",
    task: "Write down the single academic weakness that costs you the most marks.",
    guidance: "Be specific: not 'physics', but 'sign errors in rotational dynamics' or 'organic reaction mechanisms'. Specific weaknesses can be attacked; vague ones can't.",
  },
  {
    day: 2,
    title: "Practise focused problem-solving",
    task: "One deep session on that weakness — quality over quantity.",
    guidance: "Use the Think-Like-a-Topper steps: understand, name the concept, plan, then solve. Fifteen well-solved questions beat fifty rushed ones.",
  },
  {
    day: 3,
    title: "Analyse your previous mistakes",
    task: "Pick three recent errors and label each with its category.",
    guidance: "Add them to your Mistake Notebook. The category (concept / calculation / reading / time) tells you the fix.",
  },
  {
    day: 4,
    title: "Revise an older chapter",
    task: "Active-recall revision of one chapter you haven't touched in weeks.",
    guidance: "Blank page first, notes second. Then solve 10 questions from it to confirm the recall is real.",
  },
  {
    day: 5,
    title: "Attack your weakest subject",
    task: "Solve questions from the subject you avoid the most.",
    guidance: "Start with medium difficulty to build momentum, and log every question in SR Lumina.",
  },
  {
    day: 6,
    title: "Take a timed practice session",
    task: "One timed set — PYQs or a self-made test — under exam rules.",
    guidance: "No pauses, no notes. The goal is realistic pressure, not the score.",
  },
  {
    day: 7,
    title: "Review and plan",
    task: "Review the week and write your improvement plan.",
    guidance: "What improved? What slipped? Choose two measurable targets for next week — and start a fresh 7-day cycle if you want.",
  },
];

export type Dimension = { key: string; label: string };

export const DIMENSIONS: Dimension[] = [
  { key: "consistency", label: "Consistency" },
  { key: "focus", label: "Focus" },
  { key: "problem_solving", label: "Problem-solving approach" },
  { key: "revision", label: "Revision discipline" },
  { key: "mistake_analysis", label: "Mistake analysis" },
  { key: "time_management", label: "Time management" },
  { key: "confidence", label: "Self-confidence" },
  { key: "backlog", label: "Backlog management" },
];

export type AssessmentQuestion = { dimension: string; text: string; reverse?: boolean };

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { dimension: "consistency", text: "I complete a fixed daily study minimum, including days I don't feel like it." },
  { dimension: "focus", text: "During study blocks, my phone is away and I stay on one task." },
  { dimension: "problem_solving", text: "When stuck on a question, I first name the concept before trying formulas." },
  { dimension: "revision", text: "I revise each topic the same day and again at increasing gaps." },
  { dimension: "mistake_analysis", text: "After tests and practice, I analyse every error and note why it happened." },
  { dimension: "time_management", text: "In timed tests, I plan minutes per section and stick to the plan." },
  { dimension: "confidence", text: "I trust my preparation in the exam hall instead of second-guessing answers." },
  { dimension: "backlog", text: "I clear backlogs within about a week instead of letting them pile up." },
  { dimension: "consistency", text: "My daily question count is steady rather than in big bursts and gaps." },
  { dimension: "mistake_analysis", text: "I keep repeating the same mistakes because I have no system to track them.", reverse: true },
];

export const LIKERT_OPTIONS = ["Never", "Rarely", "Sometimes", "Often", "Always"];

export type AssessmentReport = {
  score: number;
  strongest: string[];
  improve: string[];
  actions: string[];
  target: string;
};

const DIMENSION_ACTIONS: Record<string, string> = {
  consistency: "Set a small non-negotiable daily minimum (e.g. 20 questions) and protect it for two weeks.",
  focus: "Run three phone-free 45-minute deep-work blocks a day for one week.",
  problem_solving: "For the next week, before every question, say the concept's name out loud before solving.",
  revision: "Add same-day recall plus a day-3 re-test for every new topic this week.",
  mistake_analysis: "Add every error from your next two practice sets to your Mistake Notebook with a category.",
  time_management: "In your next timed set, assign minutes per question and stop when the box expires.",
  confidence: "Start each session with three questions you know you can solve to rebuild momentum.",
  backlog: "List your backlog, rank it by exam weight, and clear one small chunk daily.",
};

// Deterministic report computed from the 10 answers (1–5 each).
export function buildAssessmentReport(answers: number[]): { score: number; report: AssessmentReport } {
  const perDim = new Map<string, number[]>();
  ASSESSMENT_QUESTIONS.forEach((q, i) => {
    const raw = answers[i] ?? 3;
    const value = q.reverse ? 6 - raw : raw;
    const list = perDim.get(q.dimension) ?? [];
    list.push(value);
    perDim.set(q.dimension, list);
  });
  const avg = (dim: string) => {
    const list = perDim.get(dim) ?? [3];
    return list.reduce((a, b) => a + b, 0) / list.length;
  };
  const ranked = DIMENSIONS.map((d) => ({ key: d.key, label: d.label, avg: avg(d.key) })).sort((a, b) => b.avg - a.avg);
  const effectiveSum = ASSESSMENT_QUESTIONS.reduce((sum, q, i) => {
    const raw = answers[i] ?? 3;
    return sum + (q.reverse ? 6 - raw : raw);
  }, 0);
  const score = Math.round((effectiveSum / (ASSESSMENT_QUESTIONS.length * 5)) * 100);
  const labelOf = (key: string) => DIMENSIONS.find((d) => d.key === key)?.label ?? key;
  const strongest = ranked.filter((d) => d.avg >= 4).map((d) => d.label).slice(0, 3);
  const improve = ranked.filter((d) => d.avg < 3.5).map((d) => d.label).slice(0, 3);
  const weakestKeys = ranked.slice(-3).map((d) => d.key);
  const actions = weakestKeys.map((k) => DIMENSION_ACTIONS[k]);
  const target = `Bring "${ranked[ranked.length - 1].label}" up one level within two weeks, then re-take this assessment.`;
  return {
    score,
    report: {
      score,
      strongest: strongest.length ? strongest : [ranked[0].label],
      improve,
      actions,
      target,
    },
  };
}

// Original daily mindset quotes, rotated by day of year.
export const MINDSET_QUOTES: string[] = [
  "Toppers are not made in the exam hall. They are made in the small hours of every ordinary day.",
  "A mistake you can name is a lesson. A mistake you hide is a bill waiting to arrive.",
  "You don't rise to the level of your motivation. You fall to the level of your systems.",
  "Speed is earned by accuracy, not wished into existence.",
  "The syllabus doesn't care how you feel today. Your system decides whether it moves anyway.",
  "Understanding a concept once deeply beats memorising it ten times shallowly.",
  "Revision is not repetition. It is recall — from a blank page.",
  "Compare yourself to who you were last week. That's the only fair contest.",
  "Discipline is choosing your future self over your current mood.",
  "Every question you avoid today is a question that will find you in the exam.",
  "Focus is a skill. Practise it like one.",
  "Consistency turns ability into results — quietly, without applause.",
];

export function dailyMindsetQuote(date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return MINDSET_QUOTES[dayOfYear % MINDSET_QUOTES.length];
}
