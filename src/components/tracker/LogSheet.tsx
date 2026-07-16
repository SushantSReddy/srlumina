import { useEffect, useState } from "react";
import { Delete, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { addCustomSource, addChapter, listChapters, listSources, logQuestions, type ExamLevel } from "@/lib/tracker.functions";

export type SubjectMeta = {
  id: "physics" | "chemistry" | "math" | "biology";
  label: string;
  color: string; // CSS var reference
};

export function LogSheet({
  open, onClose, subject, stream,
}: {
  open: boolean;
  onClose: () => void;
  subject: SubjectMeta | null;
  stream: "jee" | "neet" | null;
}) {
  const qc = useQueryClient();
  const listSourcesFn = useServerFn(listSources);
  const addSourceFn = useServerFn(addCustomSource);
  const logFn = useServerFn(logQuestions);

  const [value, setValue] = useState("");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [level, setLevel] = useState<ExamLevel | null>(null);
  const [newSource, setNewSource] = useState("");
  const [addingSource, setAddingSource] = useState(false);

  const sourcesQ = useQuery({
    queryKey: ["sources"],
    queryFn: () => listSourcesFn(),
    enabled: open,
  });

  useEffect(() => {
    if (open) { setValue(""); setLevel(null); setSourceId(null); setAddingSource(false); setNewSource(""); }
  }, [open, subject?.id]);

  useEffect(() => {
    if (open && sourcesQ.data && !sourceId && sourcesQ.data[0]) setSourceId(sourcesQ.data[0].id);
  }, [open, sourcesQ.data, sourceId]);

  const addMut = useMutation({
    mutationFn: (name: string) => addSourceFn({ data: { name } }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["sources"] });
      if (row) setSourceId(row.id);
      setNewSource(""); setAddingSource(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't add source"),
  });

  const saveMut = useMutation({
    mutationFn: () => logFn({
      data: {
        subject: subject!.id,
        count: parseInt(value, 10),
        source_id: sourceId,
        exam_level: level,
      },
    }),
    onSuccess: () => {
      if ("vibrate" in navigator) navigator.vibrate?.(15);
      toast.success(`+${value} ${subject!.label}`);
      qc.invalidateQueries({ queryKey: ["today"] });
      qc.invalidateQueries({ queryKey: ["streak"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  if (!open || !subject) return null;

  const levels: { id: ExamLevel; label: string }[] = stream === "jee"
    ? [{ id: "main", label: "Main" }, { id: "advanced", label: "Advanced" }]
    : [{ id: "section_a", label: "Section A" }, { id: "section_b", label: "Section B" }];

  function keyPress(k: string) {
    if ("vibrate" in navigator) navigator.vibrate?.(6);
    if (k === "del") setValue((v) => v.slice(0, -1));
    else if (k === "0" && value === "") return;
    else setValue((v) => (v.length >= 4 ? v : v + k));
  }

  const canSave = parseInt(value || "0", 10) > 0 && !saveMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button" aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div
        className="relative w-full max-w-md glass-strong liquid rounded-t-[28px] p-5 pb-[max(env(safe-area-inset-bottom),16px)]"
        style={{ animation: "sheetIn 420ms cubic-bezier(0.2,0.9,0.2,1.1)" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: subject.color }} />
            <h2 className="text-lg font-bold">{subject.label}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Log questions solved just now</p>

        <div className="text-center py-4">
          <div className="text-6xl font-bold tabular-nums tracking-tight" style={{ color: subject.color }}>
            {value || "0"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">questions</div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {["1","2","3","4","5","6","7","8","9"].map((n) => (
            <button key={n} type="button" onClick={() => keyPress(n)}
              className="glass rounded-2xl py-4 text-2xl font-medium tap active:tap-active">{n}</button>
          ))}
          <button type="button" onClick={() => setValue("")}
            className="rounded-2xl py-4 text-sm font-medium text-muted-foreground tap active:tap-active">Clear</button>
          <button type="button" onClick={() => keyPress("0")}
            className="glass rounded-2xl py-4 text-2xl font-medium tap active:tap-active">0</button>
          <button type="button" onClick={() => keyPress("del")}
            className="rounded-2xl py-4 flex items-center justify-center text-muted-foreground tap active:tap-active">
            <Delete className="h-6 w-6" />
          </button>
        </div>

        {/* Source */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</label>
          <div className="mt-2 -mx-5 overflow-x-auto scrollbar-none">
            <div className="flex gap-2 px-5 pb-1">
              {sourcesQ.data?.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSourceId(s.id)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm border tap active:tap-active ${
                    sourceId === s.id
                      ? "bg-[var(--ios-blue)] text-white border-transparent"
                      : "bg-surface border-border text-foreground"
                  }`}
                >{s.name}</button>
              ))}
              {addingSource ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus value={newSource} onChange={(e) => setNewSource(e.target.value)}
                    placeholder="Source name" maxLength={40}
                    className="rounded-full bg-surface border border-border px-3 py-1.5 text-sm w-32"
                  />
                  <button
                    type="button" disabled={!newSource.trim() || addMut.isPending}
                    onClick={() => addMut.mutate(newSource.trim())}
                    className="text-[var(--ios-blue)] text-sm font-semibold px-1"
                  >Add</button>
                </div>
              ) : (
                <button
                  type="button" onClick={() => setAddingSource(true)}
                  className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm border border-dashed border-border text-muted-foreground flex items-center gap-1"
                ><Plus className="h-3.5 w-3.5" />Custom</button>
              )}
            </div>
          </div>
        </div>

        {/* Exam level */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Level</label>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {levels.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLevel(level === l.id ? null : l.id)}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  level === l.id ? "bg-surface shadow-sm" : "text-muted-foreground"
                }`}
              >{l.label}</button>
            ))}
          </div>
        </div>

        <button
          type="button" disabled={!canSave}
          onClick={() => saveMut.mutate()}
          className="w-full rounded-2xl py-4 text-base font-semibold text-white tap active:tap-active disabled:opacity-40"
          style={{ background: subject.color }}
        >
          {saveMut.isPending ? "Saving…" : `Log ${value || 0} question${value === "1" ? "" : "s"}`}
        </button>
      </div>
      <style>{`@keyframes sheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
