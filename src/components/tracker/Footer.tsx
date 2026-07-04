import { Github, Youtube, Send, Globe } from "lucide-react";

const SOCIALS = [
  { href: "https://github.com/SushantSReddy", label: "GitHub", Icon: Github },
  { href: "https://youtube.com/@sushantsangapude", label: "YouTube", Icon: Youtube },
  { href: "https://t.me/sushantsreddy", label: "Telegram", Icon: Send },
  { href: "https://sushantsangapude.lovable.app/", label: "Portfolio", Icon: Globe },
];

export function Footer({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`w-full flex flex-col items-center gap-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-6 ${className}`}
    >
      <div className="flex items-center gap-2">
        {SOCIALS.map(({ href, label, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="glass rounded-full h-9 w-9 flex items-center justify-center tap active:tap-active text-foreground/70 hover:text-foreground transition-colors"
          >
            <Icon className="h-4 w-4" strokeWidth={2.2} />
          </a>
        ))}
      </div>
      <p className="text-[11px] tracking-wide text-muted-foreground/80">
        Designed by{" "}
        <a
          href="https://sushantsangapude.lovable.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
          Sushant Sangapude
        </a>
      </p>
    </footer>
  );
}
