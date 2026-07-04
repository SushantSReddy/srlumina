// Canonical exam date helpers (client-safe).
// Uses fixed representative dates: JEE Main Session 1 ≈ Jan 24, NEET UG ≈ May 3.

export type Stream = "jee" | "neet";

export function getExamDate(stream: Stream, year: number): Date {
  if (stream === "jee") return new Date(Date.UTC(year, 0, 24));
  return new Date(Date.UTC(year, 4, 3));
}

export function getExamLabel(stream: Stream): string {
  return stream === "jee" ? "JEE Main" : "NEET UG";
}

export function daysUntil(date: Date, from: Date = new Date()): number {
  const ms =
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
    Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function formatExamDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function classLabel(cl: string | null | undefined): string {
  switch (cl) {
    case "class_9": return "Class 9";
    case "class_10": return "Class 10";
    case "class_11": return "Class 11";
    case "class_12": return "Class 12";
    case "dropper": return "Dropper";
    default: return "";
  }
}

export const CLASS_OPTIONS = [
  { id: "class_9", label: "Class 9" },
  { id: "class_10", label: "Class 10" },
  { id: "class_11", label: "Class 11" },
  { id: "class_12", label: "Class 12" },
  { id: "dropper", label: "Dropper" },
] as const;

export type ClassLevel = (typeof CLASS_OPTIONS)[number]["id"];
