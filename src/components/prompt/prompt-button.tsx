"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptModal } from "@/components/prompt/prompt-modal";
import { generateProjectPrompt } from "@/lib/actions/prompt-actions";

interface PromptButtonProps {
  slug: string;
}

/**
 * Per-project prompt generation button.
 *
 * Triggers generateProjectPrompt server action and displays result
 * in a PromptModal. Uses stopPropagation to prevent parent Link navigation
 * when placed inside ProjectCard.
 */
export function PromptButton({ slug }: PromptButtonProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");

  async function fetchPrompt() {
    setIsLoading(true);
    try {
      const result = await generateProjectPrompt(slug);
      if (result.success) {
        setPrompt(result.prompt);
      } else {
        setPrompt(`Error: ${result.error}`);
      }
    } catch {
      setPrompt("Error: Failed to generate prompt");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
    fetchPrompt();
  }

  function handleCopy() {
    navigator.clipboard.writeText(prompt).catch(() => {
      // Silently fail
    });
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy"), 2000);
  }

  function handleRegenerate() {
    fetchPrompt();
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleClick}
        aria-label="Generate prompt"
      >
        <Sparkles className="size-4" />
      </Button>
      <PromptModal
        open={open}
        onClose={handleClose}
        prompt={prompt}
        isLoading={isLoading}
        onRegenerate={handleRegenerate}
        onCopy={handleCopy}
        copyLabel={copyLabel}
      />
    </>
  );
}
