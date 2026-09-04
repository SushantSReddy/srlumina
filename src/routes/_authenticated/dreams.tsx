import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MeshBackground } from "@/components/tracker/MeshBackground";
import { BottomNav } from "@/components/tracker/BottomNav";

export const Route = createFileRoute("/_authenticated/dreams")({
  component: DreamBoard,
  head: () => ({
    meta: [
      { title: "Dream Board — SOLVE" },
      {
        name: "description",
        content:
          "Your personal vision board. Pin photos of your dream college and goals to stay motivated every day.",
      },
    ],
  }),
});

type DreamImage = {
  id: string;
  image_path: string;
  caption: string | null;
  created_at: string;
  url?: string;
};

const BUCKET = "dream-images";

async function fetchDreams(): Promise<DreamImage[]> {
  const { data, error } = await (supabase.from as any)("dream_images")
    .select("id, image_path, caption, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as DreamImage[];
  if (rows.length === 0) return rows;
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(rows.map((r) => r.image_path), 60 * 60);
  if (signErr) throw signErr;
  const urlByPath = new Map(
    (signed ?? []).map((s: any) => [s.path, s.signedUrl as string]),
  );
  return rows.map((r) => ({ ...r, url: urlByPath.get(r.image_path) }));
}

function DreamBoard() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const dreamsQ = useQuery({ queryKey: ["dreams"], queryFn: fetchDreams });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const caption = window.prompt("Add a caption (optional)")?.trim() || null;
      const { error: insErr } = await (supabase.from as any)(
        "dream_images",
      ).insert({ user_id: user.id, image_path: path, caption });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      toast.success("Added to your dream board");
      qc.invalidateQueries({ queryKey: ["dreams"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't upload image"),
  });

  const deleteMut = useMutation({
    mutationFn: async (img: DreamImage) => {
      const { error: delErr } = await (supabase.from as any)("dream_images")
        .delete()
        .eq("id", img.id);
      if (delErr) throw delErr;
      await supabase.storage.from(BUCKET).remove([img.image_path]);
    },
    onSuccess: () => {
      toast.success("Removed");
      setConfirmId(null);
      qc.invalidateQueries({ queryKey: ["dreams"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't remove image"),
  });

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadMut.mutate(file);
    e.target.value = "";
  }

  const images = dreamsQ.data ?? [];

  return (
    <div className="min-h-dvh pb-28 relative">
      <MeshBackground />

      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            to="/home"
            className="h-9 w-9 rounded-full glass flex items-center justify-center tap active:tap-active"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-[17px] font-semibold tracking-tight">
              Dream Board
            </h1>
            <p className="text-[11px] text-muted-foreground">
              See it. Chase it. Crack it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadMut.isPending}
            className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-1.5 tap active:tap-active disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4" />
            {uploadMut.isPending ? "Adding…" : "Add"}
          </button>
        </div>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPickFile}
      />

      <main className="max-w-2xl mx-auto px-4 pt-5">
        {dreamsQ.isLoading ? (
          <div className="columns-2 gap-3 space-y-3">
            {[160, 220, 130, 190].map((h, i) => (
              <div
                key={i}
                className="glass rounded-2xl animate-pulse break-inside-avoid"
                style={{ height: h }}
              />
            ))}
          </div>
        ) : images.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full glass rounded-3xl py-16 flex flex-col items-center gap-3 tap active:tap-active text-center px-6"
          >
            <span className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </span>
            <span className="text-[15px] font-semibold">
              Pin your first dream
            </span>
            <span className="text-[13px] text-muted-foreground max-w-xs">
              Add a photo of your dream college, rank, or goal — something that
              reminds you why you grind every day.
            </span>
          </button>
        ) : (
          <div className="columns-2 gap-3 space-y-3">
            {images.map((img, i) => (
              <figure
                key={img.id}
                className="relative break-inside-avoid glass rounded-2xl overflow-hidden spring-in group"
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.caption ?? "Dream board image"}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-40 animate-pulse bg-muted" />
                )}
                {img.caption && (
                  <figcaption className="px-3 py-2 text-[12px] font-medium text-foreground/90">
                    {img.caption}
                  </figcaption>
                )}
                <button
                  type="button"
                  aria-label="Delete image"
                  onClick={() => setConfirmId(img.id)}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition tap"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {confirmId === img.id && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4">
                    <p className="text-white text-[13px] font-medium text-center">
                      Remove this dream?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => deleteMut.mutate(img)}
                        disabled={deleteMut.isPending}
                        className="px-4 py-1.5 rounded-full bg-red-500 text-white text-[12px] font-semibold tap disabled:opacity-50"
                      >
                        {deleteMut.isPending ? "Removing…" : "Remove"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="px-4 py-1.5 rounded-full bg-white/15 text-white text-[12px] font-semibold tap"
                      >
                        Keep
                      </button>
                    </div>
                  </div>
                )}
              </figure>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
