"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptModal } from "@/components/prompt/prompt-modal";
import { generateCrossProjectPrompt } from "@/lib/actions/prompt-actions";

/**
 * Cross-project prompt generation button for the dashboard home.
 *
 * Calls generateCrossProjectPrompt server action to pick the best
 * project and generate a context-rich prompt. Displays result in PromptModal.
 *
 * When no project needs work, shows the empty-state message in the modal
 * (not as an error).
 */
export function CrossProjectPromptButton() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");

  async function fetchPrompt() {
    setIsLoading(true);
    try {
      const result = await generateCrossProjectPrompt();
      if (result.success) {
        setPrompt(result.prompt);
      } else {
        // Empty state: show the message as prompt text (not as error)
        setPrompt(result.error);
      }
    } catch {
      setPrompt("Error: Failed to generate prompt");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClick() {
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
        variant="outline"
        onClick={handleClick}
        aria-label="Suggest Next Work"
      >
        <Sparkles className="mr-1 size-4" />
        Suggest Next Work
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
