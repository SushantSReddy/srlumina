export function Logo({ size = 56 }: { size?: number }) {
  return (
    <div
      className="relative rounded-[28%] flex items-center justify-center overflow-hidden pop-in"
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(135deg, var(--ios-blue) 0%, var(--ios-indigo) 100%)",
        boxShadow:
          "0 10px 30px -10px color-mix(in oklab, var(--ios-indigo) 55%, transparent), inset 0 1px 0 color-mix(in oklab, white 45%, transparent)",
      }}
      aria-label="SR logo"
    >
      <span
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 80% at 30% 0%, color-mix(in oklab, white 55%, transparent) 0%, transparent 55%)",
        }}
      />
      <span
        className="relative font-bold text-white tracking-tight"
        style={{ fontSize: size * 0.42, letterSpacing: "-0.04em" }}
      >
        SR
      </span>
    </div>
  );
}
