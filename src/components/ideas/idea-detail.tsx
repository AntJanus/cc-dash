"use client";

import Link from "next/link";
import { IdeaStatusBadge } from "@/components/ideas/idea-status-badge";
import type { IdeaItem } from "@/lib/schemas/ideas";

interface IdeaDetailProps {
  idea: IdeaItem;
}

interface BodySection {
  heading: string | null;
  content: string;
}

/** Split body at #### headings into sections */
function parseBodySections(body: string): BodySection[] {
  const lines = body.split("\n");
  const sections: BodySection[] = [];
  let currentHeading: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#### ")) {
      // Flush previous section
      if (currentLines.length > 0 || currentHeading !== null) {
        sections.push({
          heading: currentHeading,
          content: currentLines.join("\n").trim(),
        });
      }
      currentHeading = line.replace(/^#### /, "").trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Flush last section
  if (currentLines.length > 0 || currentHeading !== null) {
    sections.push({
      heading: currentHeading,
      content: currentLines.join("\n").trim(),
    });
  }

  return sections;
}

/** Render a content block: paragraphs and list items */
function renderContent(content: string) {
  if (!content) return null;

  // Split on double newlines for paragraph-level blocks
  const blocks = content.split(/\n\n+/).filter((b) => b.trim());

  return blocks.map((block, blockIdx) => {
    const lines = block.split("\n");
    // Check if this block is a list (all non-empty lines start with "- ")
    const nonEmptyLines = lines.filter((l) => l.trim());
    const isList =
      nonEmptyLines.length > 0 &&
      nonEmptyLines.every((l) => l.trimStart().startsWith("- "));

    if (isList) {
      return (
        <ul key={blockIdx} className="list-disc space-y-1 pl-5 text-base">
          {nonEmptyLines.map((line, lineIdx) => (
            <li key={lineIdx}>{line.replace(/^\s*- /, "")}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={blockIdx} className="text-base">
        {block.trim()}
      </p>
    );
  });
}

export function IdeaDetail({ idea }: IdeaDetailProps) {
  const sections = parseBodySections(idea.body);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">{idea.title}</h1>
        <div className="flex items-center gap-3">
          <IdeaStatusBadge status={idea.status} />
          {idea.stack && idea.stack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {idea.stack.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted px-2 py-0.5 text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {idea.path && (
          <p className="text-base text-muted-foreground">
            Project:{" "}
            <Link href={`/project/${idea.path}`} className="underline">
              {idea.path}
            </Link>
          </p>
        )}
      </div>

      {/* Body sections */}
      <div className="space-y-4">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            {section.heading && (
              <h4 className="font-semibold">{section.heading}</h4>
            )}
            {renderContent(section.content)}
          </div>
        ))}
      </div>
    </div>
  );
}
