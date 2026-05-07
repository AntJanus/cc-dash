"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyableCommandLineProps {
  command: string;
}

export function CopyableCommandLine({ command }: CopyableCommandLineProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(command).catch(() => {
      // Silently swallow — clipboard can be denied in test/sandbox envs.
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group flex items-start gap-2">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy command"}
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-opacity opacity-60 hover:opacity-100"
        style={{ color: "var(--text-muted)" }}
      >
        {copied ? (
          <Check
            className="h-3.5 w-3.5"
            style={{ color: "var(--accent-emerald)" }}
          />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <span className="flex-1 break-all">{command}</span>
    </div>
  );
}
