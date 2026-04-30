import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Cozy sticky-note palette — six low-saturation hues that read against
 * both parchment and dark moss backgrounds. Each entry sets background,
 * text color, and a faint matching border. */
const CATEGORY_COLORS = [
  "bg-[var(--note-sage)] text-[var(--ink-strong)] border-[var(--accent-moss)]/30",
  "bg-[var(--note-butter)] text-[var(--ink-strong)] border-[var(--accent-gold)]/30",
  "bg-[var(--note-blush)] text-[var(--ink-strong)] border-[var(--accent-clay)]/30",
  "bg-[var(--note-apricot)] text-[var(--ink-strong)] border-[var(--accent-clay)]/30",
  "bg-[var(--note-lavender)] text-[var(--ink-strong)] border-[var(--accent-plum)]/30",
  "bg-[var(--note-mist)] text-[var(--ink-strong)] border-[var(--accent-sky)]/30",
];

/** Simple hash for deterministic color assignment */
function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

interface CategoryBadgeProps {
  slug: string;
  title: string;
  className?: string;
}

export function CategoryBadge({ slug, title, className }: CategoryBadgeProps) {
  const colorIdx = hashSlug(slug) % CATEGORY_COLORS.length;
  return (
    <Badge
      variant="outline"
      className={cn(CATEGORY_COLORS[colorIdx], "border", className)}
    >
      {title}
    </Badge>
  );
}
