"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptModal } from "@/components/prompt/prompt-modal";
import { generateTodayDirectionsPrompt } from "@/lib/actions/prompt-actions";

interface TodayDirectionsPromptButtonProps {
  variant?: "primary" | "ghost";
  label?: string;
}

export function TodayDirectionsPromptButton({
  variant = "primary",
  label,
}: TodayDirectionsPromptButtonProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");

  async function fetchPrompt() {
    setIsLoading(true);
    try {
      const result = await generateTodayDirectionsPrompt();
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

  const buttonLabel = label ?? "Generate Today's Directions";

  return (
    <>
      <Button
        variant={variant === "primary" ? "default" : "outline"}
        onClick={handleClick}
        aria-label="Generate Today's Directions prompt"
      >
        <Sparkles className="mr-1.5 size-4" />
        {buttonLabel}
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
