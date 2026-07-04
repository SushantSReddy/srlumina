// Small, curated set — kept short so it reads well on a card.
export const QUOTES: { text: string; author: string }[] = [
  { text: "Small steps every day add up to big results.", author: "Unknown" },
  { text: "Discipline is choosing what you want most over what you want now.", author: "Abraham Lincoln" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Practice isn't the thing you do once you're good. It's the thing that makes you good.", author: "Malcolm Gladwell" },
  { text: "Motivation gets you going. Discipline keeps you growing.", author: "John C. Maxwell" },
  { text: "A river cuts through rock, not because of its power, but its persistence.", author: "James N. Watkins" },
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "One question at a time. One day at a time.", author: "Reps" },
  { text: "Slow is smooth. Smooth is fast.", author: "Navy SEALs" },
  { text: "You are what you repeatedly do.", author: "Will Durant" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "The best way out is always through.", author: "Robert Frost" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Every accomplishment starts with the decision to try.", author: "John F. Kennedy" },
  { text: "Ordinary people think merely of spending time. Great people think of using it.", author: "Arthur Schopenhauer" },
  { text: "The gap between where you are and where you want to be is action.", author: "Unknown" },
  { text: "Effort is the currency of results.", author: "Unknown" },
  { text: "It's not about perfect. It's about effort.", author: "Jillian Michaels" },
  { text: "You'll never regret the questions you solved today.", author: "Reps" },
  { text: "Consistency is what transforms average into excellence.", author: "Unknown" },
  { text: "Trust the process. Show up anyway.", author: "Unknown" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
  { text: "The pain of discipline is far less than the pain of regret.", author: "Sarah Bombell" },
  { text: "Doubt kills more dreams than failure ever will.", author: "Suzy Kassem" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
];

export function getDailyQuote(date: Date = new Date()) {
  // Deterministic per calendar day.
  const key = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const idx = Math.floor(key / 86_400_000) % QUOTES.length;
  return QUOTES[idx];
}
