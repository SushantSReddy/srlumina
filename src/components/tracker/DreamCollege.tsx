import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GraduationCap, Pencil } from "lucide-react";
import { toast } from "sonner";
import { getProfile, setDreamCollege } from "@/lib/tracker.functions";

function useDream() {
  const getProfileFn = useServerFn(getProfile);
  return useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
}

function useSetDream() {
  const qc = useQueryClient();
  const fn = useServerFn(setDreamCollege);
  return useMutation({
    mutationFn: (name: string) => fn({ data: { name } }),
    onSuccess: () => {
      toast.success("Dream saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });
}

function askName(current?: string | null) {
  const v = window.prompt(
    "What's your dream college / goal?",
    current ?? "",
  );
  return v?.trim() || null;
}

export function DreamCollegeBanner() {
  const profileQ = useDream();
  const mut = useSetDream();
  const name = profileQ.data?.dream_college ?? null;

  function edit() {
    const v = askName(name);
    if (v) mut.mutate(v);
  }

  return (
    <button
      type="button"
      onClick={edit}
      disabled={mut.isPending}
      className="w-full glass rounded-2xl px-4 py-2.5 flex items-center gap-2.5 tap active:tap-active text-left"
    >
      <GraduationCap className="h-4 w-4 text-primary shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
          Dream
        </span>
        <span className="block text-sm font-semibold truncate">
          {mut.isPending ? "Saving…" : (name ?? "Tap to set your dream college")}
        </span>
      </span>
      <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </button>
  );
}

export function DreamCollegeShowcase() {
  const profileQ = useDream();
  const mut = useSetDream();
  const name = profileQ.data?.dream_college ?? null;
  const img = profileQ.data?.dream_image_url ?? null;

  if (!name) return null;

  return (
    <figure className="glass rounded-3xl overflow-hidden spring-in">
      {img ? (
        <img
          src={img}
          alt={name}
          loading="lazy"
          className="w-full h-52 object-cover"
        />
      ) : (
        <div className="w-full h-40 flex items-center justify-center bg-primary/10">
          <GraduationCap className="h-10 w-10 text-primary" />
        </div>
      )}
      <figcaption className="px-4 py-3 flex items-center gap-3">
        <span className="flex-1 min-w-0">
          <span className="block text-[11px] text-muted-foreground">
            Where you're headed
          </span>
          <span className="block text-[15px] font-semibold truncate">{name}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            const v = askName(name);
            if (v) mut.mutate(v);
          }}
          className="text-[12px] font-semibold text-primary tap active:tap-active"
        >
          Change
        </button>
      </figcaption>
    </figure>
  );
}
