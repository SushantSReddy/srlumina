export function Footer({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`w-full text-center text-[11px] tracking-wide text-muted-foreground/80 pb-[max(env(safe-area-inset-bottom),12px)] pt-4 ${className}`}
    >
      Designed by{" "}
      <span className="font-medium text-foreground/80">Sushant Sangapude</span>
    </footer>
  );
}
