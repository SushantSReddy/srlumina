import logoAsset from "@/assets/app-logo.png.asset.json";

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <div
      className="relative rounded-[28%] overflow-hidden pop-in bg-black"
      style={{
        width: size,
        height: size,
        boxShadow:
          "0 10px 30px -10px color-mix(in oklab, var(--ios-indigo) 55%, transparent), inset 0 1px 0 color-mix(in oklab, white 25%, transparent)",
      }}
      aria-label="SOLVE logo"
    >
      <img
        src={logoAsset.url}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
