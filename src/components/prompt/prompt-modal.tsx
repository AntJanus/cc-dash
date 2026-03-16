"use client";

import { Loader2, RefreshCw, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PromptModalProps {
  open: boolean;
  onClose: () => void;
  prompt: string;
  isLoading: boolean;
  onRegenerate: () => void;
  onCopy: () => void;
  copyLabel: string;
}

/**
 * Modal dialog for displaying generated prompts.
 *
 * Uses custom inline dialog pattern (not shadcn Dialog, no portals)
 * for jsdom testability. Follows DeleteItemDialog pattern.
 */
export function PromptModal({
  open,
  onClose,
  prompt,
  isLoading,
  onRegenerate,
  onCopy,
  copyLabel,
}: PromptModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        data-testid="prompt-modal-overlay"
        className="fixed inset-0 bg-black/10"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-2xl rounded-xl bg-background p-4 ring-1 ring-foreground/10 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium">Generated Prompt</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span>Generating prompt...</span>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
            {prompt}
          </pre>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onRegenerate}
            disabled={isLoading}
            aria-label="Regenerate"
          >
            <RefreshCw className="mr-1 size-4" />
            Regenerate
          </Button>
          <Button onClick={onCopy} disabled={isLoading} aria-label={copyLabel}>
            {copyLabel === "Copied!" ? (
              <Check className="mr-1 size-4" />
            ) : (
              <Copy className="mr-1 size-4" />
            )}
            {copyLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
