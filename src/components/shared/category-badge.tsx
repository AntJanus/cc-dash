import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
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
      variant="secondary"
      className={cn(CATEGORY_COLORS[colorIdx], className)}
    >
      {title}
    </Badge>
  );
}
