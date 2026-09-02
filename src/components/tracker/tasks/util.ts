import type { Task } from "@/lib/tasks.functions";

export function isoDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return isoDay(d);
}

export const SUBJECT_COLORS: Record<string, string> = {
  physics: "var(--ios-blue)",
  chemistry: "var(--ios-mint)",
  math: "var(--ios-indigo)",
  biology: "var(--ios-green)",
};

export const SUBJECT_LABELS: Record<string, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  math: "Math",
  biology: "Biology",
};

export function formatTime(t: string | null) {
  if (!t) return null;
  const [hStr, m] = t.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}

export type Bucket = "overdue" | "today" | "tomorrow" | "week" | "later" | "someday" | "completed";

export function bucketOf(task: Task, today = isoDay()): Bucket {
  if (task.completed_at) return "completed";
  if (!task.due_on) return "someday";
  if (task.due_on < today) return "overdue";
  if (task.due_on === today) return "today";
  if (task.due_on === addDays(1)) return "tomorrow";
  if (task.due_on <= addDays(7)) return "week";
  return "later";
}

export const BUCKET_LABELS: Record<Bucket, string> = {
  overdue: "Overdue",
  today: "Today",
  tomorrow: "Tomorrow",
  week: "This week",
  later: "Later",
  someday: "No date",
  completed: "Completed",
};

export const BUCKET_ORDER: Bucket[] = [
  "overdue",
  "today",
  "tomorrow",
  "week",
  "later",
  "someday",
  "completed",
];
