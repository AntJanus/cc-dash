"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  SkipForward,
  MessageCircleQuestion,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QaNoteDialog } from "@/components/qa/qa-note-dialog";
import {
  approveQaItem,
  failQaItem,
  skipQaItem,
  markQaNeedsDecision,
  resetQaItem,
} from "@/lib/actions/qa-actions";
import type { QaItem } from "@/lib/schemas/qa";

interface QaActionsRowProps {
  slug: string;
  itemId: string;
  status: QaItem["status"];
  /** When false, Fail is disabled with a tooltip — needs a roadmap to file an issue. */
  hasRoadmap: boolean;
}

type DialogMode = "fail" | "decision" | null;

function describeError(errors: { message: string }[] | undefined): string {
  if (!errors || errors.length === 0) return "Action failed.";
  return errors[0].message;
}

export function QaActionsRow({
  slug,
  itemId,
  status,
  hasRoadmap,
}: QaActionsRowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isPending = status === "pending";

  function refresh() {
    router.refresh();
  }

  async function handleApprove() {
    setActionError(null);
    startTransition(async () => {
      const result = await approveQaItem(slug, itemId);
      if (!result.success) {
        setActionError(describeError(result.errors));
        return;
      }
      refresh();
    });
  }

  async function handleSkip() {
    setActionError(null);
    startTransition(async () => {
      const result = await skipQaItem(slug, itemId);
      if (!result.success) {
        setActionError(describeError(result.errors));
        return;
      }
      refresh();
    });
  }

  async function handleReset() {
    setActionError(null);
    startTransition(async () => {
      const result = await resetQaItem(slug, itemId);
      if (!result.success) {
        setActionError(describeError(result.errors));
        return;
      }
      refresh();
    });
  }

  async function handleFailSubmit(note: string): Promise<string | null> {
    const result = await failQaItem(slug, itemId, note);
    if (!result.success) {
      return describeError(result.errors);
    }
    refresh();
    return null;
  }

  async function handleDecisionSubmit(note: string): Promise<string | null> {
    const result = await markQaNeedsDecision(slug, itemId, note);
    if (!result.success) {
      return describeError(result.errors);
    }
    refresh();
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        {isPending ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleApprove}
              disabled={pending}
              aria-label="Approve"
            >
              <Check className="mr-1 size-4 text-green-600" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDialogMode("fail")}
              disabled={pending || !hasRoadmap}
              aria-label="Fail"
              title={
                hasRoadmap
                  ? undefined
                  : "Cannot fail without a ROADMAP.md to record the issue"
              }
            >
              <X className="mr-1 size-4 text-red-600" />
              Fail
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDialogMode("decision")}
              disabled={pending}
              aria-label="Needs decision"
            >
              <MessageCircleQuestion className="mr-1 size-4 text-amber-600" />
              Decision
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSkip}
              disabled={pending}
              aria-label="Skip"
            >
              <SkipForward className="mr-1 size-4 text-muted-foreground" />
              Skip
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            disabled={pending}
            aria-label="Reset to pending"
          >
            <Undo2 className="mr-1 size-4 text-muted-foreground" />
            Reset
          </Button>
        )}
      </div>
      {actionError && (
        <p className="text-xs text-red-700 dark:text-red-400">{actionError}</p>
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
