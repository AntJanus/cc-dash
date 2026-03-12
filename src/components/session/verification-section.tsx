"use client";

import { Badge } from "@/components/ui/badge";
import type { UnknownSection } from "@/lib/fs/types";
import { cn } from "@/lib/utils";

interface VerificationSectionProps {
  verificationSections: UnknownSection[];
}

interface VerificationBlock {
  heading: string;
  content: string;
  color: "green" | "yellow" | "red";
}

function classifyHeading(heading: string): "green" | "yellow" | "red" {
  const lower = heading.toLowerCase();
  if (lower.includes("successfully verified") || lower.includes("pass")) {
    return "green";
  }
  if (lower.includes("minor issues") || lower.includes("partial")) {
    return "yellow";
  }
  if (
    lower.includes("blocking issues") ||
    lower.includes("fail") ||
    lower.includes("block")
  ) {
    return "red";
  }
  // Default to yellow for unrecognized headings
  return "yellow";
}

const borderColorMap: Record<string, string> = {
  green: "border-l-green-500",
  yellow: "border-l-yellow-500",
  red: "border-l-red-500",
};

const badgeColorMap: Record<string, string> = {
  green: "bg-green-600 text-white",
  yellow: "bg-yellow-500 text-white",
  red: "bg-red-600 text-white",
};

function parseVerificationBlocks(
  sections: UnknownSection[],
): VerificationBlock[] {
  const blocks: VerificationBlock[] = [];

  for (const section of sections) {
    // Split raw text on ### headings
    const parts = section.raw.split(/^### /m).filter(Boolean);

    for (const part of parts) {
      const newlineIndex = part.indexOf("\n");
      const heading =
        newlineIndex >= 0 ? part.slice(0, newlineIndex).trim() : part.trim();
      const content =
        newlineIndex >= 0 ? part.slice(newlineIndex + 1).trim() : "";
      const color = classifyHeading(heading);
      blocks.push({ heading, content, color });
    }
  }

  return blocks;
}

export function VerificationSection({
  verificationSections,
}: VerificationSectionProps) {
  if (verificationSections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No verification results</p>
    );
  }

  const blocks = parseVerificationBlocks(verificationSections);

  if (blocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No verification results</p>
    );
  }

  const greenCount = blocks.filter((b) => b.color === "green").length;
  const yellowCount = blocks.filter((b) => b.color === "yellow").length;
  const redCount = blocks.filter((b) => b.color === "red").length;

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex items-center gap-2">
        {greenCount > 0 && (
          <Badge className={badgeColorMap.green}>{greenCount} pass</Badge>
        )}
        {yellowCount > 0 && (
          <Badge className={badgeColorMap.yellow}>{yellowCount} partial</Badge>
        )}
        {redCount > 0 && (
          <Badge className={badgeColorMap.red}>{redCount} fail</Badge>
        )}
      </div>

      {/* Verification blocks */}
      {blocks.map((block, index) => (
        <div
          key={index}
          data-testid="verification-block"
          className={cn(
            "rounded-md border border-l-4 p-3",
            borderColorMap[block.color],
          )}
        >
          <h4 className="mb-1 text-sm font-medium">{block.heading}</h4>
          <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
            {block.content}
          </pre>
        </div>
      ))}
    </div>
  );
}
