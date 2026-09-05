import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, GraduationCap, ImagePlus, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getProfile,
  searchCollegeImages,
  setDreamCollege,
} from "@/lib/tracker.functions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function useDream() {
  const getProfileFn = useServerFn(getProfile);
  return useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
}

function DreamSheet({
  open,
  onOpenChange,
  initialName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialName: string;
}) {
  const qc = useQueryClient();
  const searchFn = useServerFn(searchCollegeImages);
  const saveFn = useServerFn(setDreamCollege);

  const [name, setName] = useState(initialName);
  const [options, setOptions] = useState<{ url: string; title: string }[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/dream-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("dream-images")
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;
      const { data: signed, error: signErr } = await supabase.storage
        .from("dream-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr || !signed?.signedUrl) throw signErr ?? new Error("URL failed");
      return signed.signedUrl;
    },
    onSuccess: (url) => {
      setPicked(url);
      setOptions((prev) => [{ url, title: "Your photo" }, ...prev]);
      toast.success("Photo added");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Upload failed"),
  });

  const search = useMutation({
    mutationFn: (n: string) => searchFn({ data: { name: n } }),
    onSuccess: (rows) => {
      setOptions(rows);
      setPicked(rows[0]?.url ?? null);
      if (rows.length === 0) toast.info("No photos found — you can still save the name");
    },
    onError: () => toast.error("Couldn't load photos"),
  });

  const save = useMutation({
    mutationFn: () => saveFn({ data: { name: name.trim(), image_url: picked } }),
    onSuccess: () => {
      toast.success("Dream saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="px-0">
          <SheetTitle>Your dream college</SheetTitle>
        </SheetHeader>

        <div className="flex gap-2 pt-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. IIT Bombay"
            autoFocus
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!name.trim() || search.isPending}
            onClick={() => search.mutate(name.trim())}
          >
            {search.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Find photos"
            )}
          </Button>
        </div>

        {options.length > 0 && (
          <>
            <p className="pt-4 pb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              Pick a photo
            </p>
            <div className="grid grid-cols-2 gap-2">
              {options.map((o) => (
                <button
                  key={o.url}
                  type="button"
                  onClick={() => setPicked(o.url)}
                  className={`relative rounded-2xl overflow-hidden border-2 tap active:tap-active ${
                    picked === o.url ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img
                    src={o.url}
                    alt={o.title}
                    loading="lazy"
                    className="w-full h-28 object-cover"
                  />
                  {picked === o.url && (
                    <span className="absolute top-1.5 right-1.5 rounded-full bg-primary text-primary-foreground p-1">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="pt-5 pb-2 flex gap-2">
          <Button
            type="button"
            className="flex-1"
            disabled={!name.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function useDreamSheet(name: string | null) {
  const [open, setOpen] = useState(false);
  const node = open ? (
    <DreamSheet open={open} onOpenChange={setOpen} initialName={name ?? ""} />
  ) : null;
  return { open: () => setOpen(true), node };
}

export function DreamCollegeBanner() {
  const profileQ = useDream();
  const name = profileQ.data?.dream_college ?? null;
  const sheet = useDreamSheet(name);

  return (
    <>
      <button
        type="button"
        onClick={sheet.open}
        className="w-full glass rounded-2xl px-4 py-2.5 flex items-center gap-2.5 tap active:tap-active text-left"
      >
        <GraduationCap className="h-4 w-4 text-primary shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
            Dream
          </span>
          <span className="block text-sm font-semibold truncate">
            {name ?? "Tap to set your dream college"}
          </span>
        </span>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>
      {sheet.node}
    </>
  );
}

export function DreamCollegeShowcase() {
  const profileQ = useDream();
  const name = profileQ.data?.dream_college ?? null;
  const img = profileQ.data?.dream_image_url ?? null;
  const sheet = useDreamSheet(name);

  if (!name) return null;

  return (
    <>
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
            onClick={sheet.open}
            className="text-[12px] font-semibold text-primary tap active:tap-active"
          >
            Change
          </button>
        </figcaption>
      </figure>
      {sheet.node}
    </>
  );
}
