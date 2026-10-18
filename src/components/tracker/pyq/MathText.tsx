import { useMemo } from "react";
import katex from "katex";
import "katex/contrib/mhchem";
import "katex/dist/katex.min.css";

/** Only KaTeX-generated markup is rendered; question prose is always escaped by React. */
export function MathText({ text }: { text: string }) {
  const pieces = useMemo(() => text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g).map((piece) => {
    const display = piece.startsWith("$$") || piece.startsWith("\\[");
    const math = display || piece.startsWith("$") || piece.startsWith("\\(");
    if (!math) return { text: piece };
    const value = piece.slice(display || piece.startsWith("\\(") ? 2 : 1, display || piece.startsWith("\\(") ? -2 : -1);
    return { html: katex.renderToString(value, { displayMode: display, throwOnError: false, trust: false, strict: "ignore" }) };
  }), [text]);
  return <div className="whitespace-pre-wrap break-words leading-relaxed [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex]:text-[1.05em]">{pieces.map((piece, i) => "html" in piece ? <span key={i} dangerouslySetInnerHTML={{ __html: piece.html ?? "" }} /> : <span key={i}>{piece.text}</span>)}</div>;
}