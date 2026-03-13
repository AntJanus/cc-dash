import { ChevronUp, ChevronDown } from "lucide-react";

interface ReorderButtonsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function ReorderButtons({
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: ReorderButtonsProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-label="Move up"
        disabled={isFirst}
        onClick={onMoveUp}
        className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Move down"
        disabled={isLast}
        onClick={onMoveDown}
        className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}
