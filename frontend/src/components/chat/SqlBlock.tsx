import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

interface SqlBlockProps {
  sql: string;
  defaultOpen?: boolean;
}

export function SqlBlock({ sql, defaultOpen = false }: SqlBlockProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-lg border border-border-dim overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-surface hover:bg-elevated transition-colors text-left cursor-pointer"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        )}
        <span
          className="text-[11px] uppercase tracking-wider text-gold/70 font-medium"
          style={{ fontFamily: "'Azeret Mono', monospace" }}
        >
          Generated SQL
        </span>
      </button>

      {open && (
        <div className="relative bg-[#13110e] animate-scale-in">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-elevated/50 hover:bg-elevated text-text-muted hover:text-text transition-all cursor-pointer"
            title="Copy SQL"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-sage" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <pre className="p-4 pr-10 overflow-x-auto text-[13px] leading-relaxed text-text-secondary">
            <code style={{ fontFamily: "'Azeret Mono', monospace" }}>{sql}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
