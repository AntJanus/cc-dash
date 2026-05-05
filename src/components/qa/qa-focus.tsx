"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  SkipForward,
  MessageCircleQuestion,
  ArrowLeft,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QaStatusBadge } from "@/components/qa/qa-status-badge";
import { QaNoteDialog } from "@/components/qa/qa-note-dialog";
import {
  approveQaItem,
  failQaItem,
  skipQaItem,
  markQaNeedsDecision,
} from "@/lib/actions/qa-actions";
import type { QaFile, QaItem } from "@/lib/schemas/qa";

interface QaFocusProps {
  qa: QaFile;
  slug: string;
  hasRoadmap: boolean;
  /** Item ID from the ?focus= query string. */
  initialFocusId: string;
}

type DialogMode = "fail" | "decision" | null;

function describeError(errors: { message: string }[] | undefined): string {
  if (!errors || errors.length === 0) return "Action failed.";
  return errors[0].message;
}

export function QaFocus({
  qa,
  slug,
  hasRoadmap,
  initialFocusId,
}: QaFocusProps) {
  const router = useRouter();
  const exitHref = `/project/${slug}/qa`;

  const initialIndex = useMemo(() => {
    const idx = qa.items.findIndex((item) => item.id === initialFocusId);
    return idx >= 0 ? idx : 0;
  }, [qa.items, initialFocusId]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const item: QaItem | undefined = qa.items[currentIndex];

  const advance = useCallback(() => {
    // Find next pending item starting from currentIndex + 1; wrap if needed
    const total = qa.items.length;
    for (let offset = 1; offset <= total; offset++) {
      const next = (currentIndex + offset) % total;
      if (qa.items[next].status === "pending") {
        setCurrentIndex(next);
        return;
      }
    }
    // No more pending items — stay put; the next refresh will show terminal state.
  }, [qa.items, currentIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < qa.items.length - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex, qa.items.length]);

  const handleApprove = useCallback(() => {
    if (!item || item.status !== "pending") return;
    setActionError(null);
    startTransition(async () => {
      const result = await approveQaItem(slug, item.id);
      if (!result.success) {
        setActionError(describeError(result.errors));
        return;
      }
      advance();
      router.refresh();
    });
  }, [item, slug, advance, router]);

  const handleSkip = useCallback(() => {
    if (!item || item.status !== "pending") return;
    setActionError(null);
    startTransition(async () => {
      const result = await skipQaItem(slug, item.id);
      if (!result.success) {
        setActionError(describeError(result.errors));
        return;
      }
      advance();
      router.refresh();
    });
  }, [item, slug, advance, router]);

  async function handleFailSubmit(note: string): Promise<string | null> {
    if (!item) return "No item selected.";
    const result = await failQaItem(slug, item.id, note);
    if (!result.success) return describeError(result.errors);
    advance();
    router.refresh();
    return null;
  }

  async function handleDecisionSubmit(note: string): Promise<string | null> {
    if (!item) return "No item selected.";
    const result = await markQaNeedsDecision(slug, item.id, note);
    if (!result.success) return describeError(result.errors);
    advance();
    router.refresh();
    return null;
  }

  // Keyboard shortcuts (only when no dialog is open)
  useEffect(() => {
    if (dialogMode !== null) return;

    function onKey(event: KeyboardEvent) {
      // Ignore when focus is in a typeable element
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      switch (event.key.toLowerCase()) {
        case "a":
          event.preventDefault();
          handleApprove();
          break;
        case "f":
          if (hasRoadmap) {
            event.preventDefault();
            setDialogMode("fail");
          }
          break;
        case "d":
          event.preventDefault();
          setDialogMode("decision");
          break;
        case "s":
          event.preventDefault();
          handleSkip();
          break;
        case "n":
        case "arrowright":
          event.preventDefault();
          goNext();
          break;
        case "p":
        case "arrowleft":
          event.preventDefault();
          goPrev();
          break;
        case "escape":
          event.preventDefault();
          router.push(exitHref);
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    dialogMode,
    handleApprove,
    handleSkip,
    goNext,
    goPrev,
    router,
    exitHref,
    hasRoadmap,
  ]);

  if (!item) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No QA items to focus on.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(exitHref)}
        >
          Back to list
        </Button>
      </div>
    );
  }

  const pendingCount = qa.items.filter(
    (qaItem) => qaItem.status === "pending",
  ).length;
  const reviewedCount = qa.items.length - pendingCount;
  const isPending = item.status === "pending";

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Focus mode
          </p>
          <h2 className="text-base font-semibold">
            Item {currentIndex + 1} of {qa.items.length}
          </h2>
          <p className="text-sm text-muted-foreground">
            {reviewedCount} reviewed · {pendingCount} pending
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(exitHref)}
          aria-label="Exit focus mode"
        >
          <XCircle className="mr-1 size-4" />
          Exit
        </Button>
      </header>

      <article className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <QaStatusBadge status={item.status} />
          <span className="text-xs text-muted-foreground">{item.id}</span>
        </div>
        <p className="text-xl leading-snug">{item.description}</p>
        {item.note && (
          <blockquote className="mt-4 border-l-2 border-muted-foreground/30 pl-4 text-base whitespace-pre-line text-muted-foreground">
            {item.note}
          </blockquote>
        )}
      </article>

      {isPending ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleApprove} disabled={pending}>
            <Check className="mr-1 size-4" />
            Approve <span className="ml-1 text-xs opacity-70">(a)</span>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDialogMode("fail")}
            disabled={pending || !hasRoadmap}
            title={
              hasRoadmap
                ? undefined
                : "Cannot fail without a ROADMAP.md to record the issue"
            }
          >
            <X className="mr-1 size-4" />
            Fail <span className="ml-1 text-xs opacity-70">(f)</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setDialogMode("decision")}
            disabled={pending}
          >
            <MessageCircleQuestion className="mr-1 size-4" />
            Decision <span className="ml-1 text-xs opacity-70">(d)</span>
          </Button>
          <Button variant="outline" onClick={handleSkip} disabled={pending}>
            <SkipForward className="mr-1 size-4" />
            Skip <span className="ml-1 text-xs opacity-70">(s)</span>
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This item is already {item.status}. Use Reset on the list view to
          re-open it, or move to the next item.
        </p>
      )}

      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="ghost" onClick={goPrev} disabled={currentIndex === 0}>
          <ArrowLeft className="mr-1 size-4" />
          Previous <span className="ml-1 text-xs opacity-70">(p)</span>
        </Button>
        <Button
          variant="ghost"
          onClick={goNext}
          disabled={currentIndex === qa.items.length - 1}
        >
          Next <span className="ml-1 text-xs opacity-70">(n)</span>
          <ArrowRight className="ml-1 size-4" />
        </Button>
      </div>

      {actionError && (
        <p className="text-sm text-red-700 dark:text-red-400">{actionError}</p>
      )}

      <QaNoteDialog
        open={dialogMode === "fail"}
        title="Fail this QA item"
        description="Failing files a roadmap issue in the QA Issues category and links it back from this QA item. The note becomes the issue body."
        submitLabel="Fail and file issue"
        submitVariant="destructive"
        onSubmit={handleFailSubmit}
        onClose={() => setDialogMode(null)}
      />
      <QaNoteDialog
        open={dialogMode === "decision"}
        title="Mark as needs-decision"
        description="Use when an item is blocked on a design conversation rather than execution. The note explains what needs to be discussed."
        submitLabel="Mark needs-decision"
        onSubmit={handleDecisionSubmit}
        onClose={() => setDialogMode(null)}
      />
    </div>
  );
}
