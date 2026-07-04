import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { getDailyQuote } from "@/lib/quotes";

export function DailyQuote() {
  // Compute on mount to avoid SSR/CSR drift across timezones.
  const [q, setQ] = useState<{ text: string; author: string } | null>(null);
  useEffect(() => setQ(getDailyQuote()), []);
  if (!q) return null;

  return (
    <div className="glass rounded-3xl px-5 py-4 flex gap-3 items-start spring-in">
      <Quote className="h-4 w-4 text-[var(--ios-blue)] shrink-0 mt-1" strokeWidth={2.4} />
      <div className="min-w-0">
        <p className="text-sm leading-snug text-foreground">{q.text}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">— {q.author}</p>
      </div>
    </div>
  );
}
