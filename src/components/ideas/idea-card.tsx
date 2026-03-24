"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IdeaStatusBadge } from "@/components/ideas/idea-status-badge";
import type { IdeaItem } from "@/lib/schemas/ideas";

interface IdeaCardProps {
  idea: IdeaItem;
}

/** Extract first non-empty line of body, truncated to 120 chars */
function getTeaser(body: string): string {
  const lines = body.split("\n");
  const firstLine = lines.find((line) => line.trim().length > 0);
  if (!firstLine) return "";
  const trimmed = firstLine.trim();
  if (trimmed.length <= 120) return trimmed;
  return trimmed.slice(0, 120) + "...";
}

const IDEA_ACCENT_COLORS: Record<string, string> = {
  "not-started": "border-l-[var(--status-inactive)]",
  started: "border-l-[var(--status-complete)]",
  complete: "border-l-[var(--status-active)]",
};

export function IdeaCard({ idea }: IdeaCardProps) {
  return (
    <Link href={`/ideas/${idea.id}`} className="block">
      <Card
        className={`border-l-[3px] rounded-l-lg ${IDEA_ACCENT_COLORS[idea.status] ?? ""} interactive-card`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{idea.title}</CardTitle>
            <IdeaStatusBadge status={idea.status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {idea.stack && idea.stack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {idea.stack.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-primary/8 px-2 py-0.5 text-sm text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {getTeaser(idea.body) && (
            <p className="line-clamp-3 text-base text-muted-foreground">
              {getTeaser(idea.body)}
            </p>
          )}

          {idea.path && (
            <p className="text-sm text-muted-foreground">{idea.path}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
