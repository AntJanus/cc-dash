"use client";

import { useState, useTransition } from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { archiveProject } from "@/lib/actions/archive-actions";

interface ArchiveButtonProps {
  slug: string;
  name: string;
}

/**
 * Archive button for project cards.
 *
 * Shows a confirmation dialog before archiving. Uses stopPropagation
 * to prevent parent Link navigation when placed inside ProjectCard.
 */
export function ArchiveButton({ slug, name }: ArchiveButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleTriggerClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
  }

  function handleConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    startTransition(async () => {
      await archiveProject(slug);
      setOpen(false);
    });
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleTriggerClick}
          aria-label={`Archive ${name}`}
        >
          <Archive className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Archive project?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{name}</strong> will be hidden from the dashboard. You can
            restore it from Settings at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Archiving..." : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
