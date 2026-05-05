import Link from "next/link";
import { QaStatusBadge } from "@/components/qa/qa-status-badge";
import type { QaItem } from "@/lib/schemas/qa";

interface QaItemRowProps {
  item: QaItem;
  /** Project slug — used for the roadmap-issue back-link. */
  slug: string;
  /** Optional right-aligned action area (Approve / Fail / Skip / Decision). */
  actions?: React.ReactNode;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function QaItemRow({ item, slug, actions }: QaItemRowProps) {
  return (
    <li className="rounded-md border bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <QaStatusBadge status={item.status} />
            {item.at && (
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(item.at)}
              </span>
            )}
            {item.roadmapRef && (
              <Link
                href={`/project/${slug}/roadmap`}
                className="text-xs font-medium text-primary hover:underline"
              >
                {item.roadmapRef}
              </Link>
            )}
          </div>
          <p className="text-sm leading-relaxed">{item.description}</p>
          {item.note && (
            <blockquote className="border-l-2 border-muted-foreground/30 pl-3 text-sm whitespace-pre-line text-muted-foreground">
              {item.note}
            </blockquote>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </li>
  );
}
