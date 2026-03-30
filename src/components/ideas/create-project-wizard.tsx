"use client";

/**
 * CreateProjectWizard — 3-step modal wizard to scaffold a project from an idea.
 *
 * Follows the IdeaWizard pattern: custom inline dialog (not shadcn Dialog)
 * for jsdom testability. Pre-fills from idea data.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createProjectFromIdea } from "@/lib/actions/scaffold-actions";
import type { IdeaItem } from "@/lib/schemas/ideas";
import type { CreateProjectData } from "./create-project-types";
import { extractDescription } from "./create-project-types";
import { CreateProjectStepName } from "./create-project-step-name";
import { CreateProjectStepTemplate } from "./create-project-step-template";
import { CreateProjectStepReview } from "./create-project-step-review";

/** Client-safe slugify (mirrors @/lib/fs/discovery slugify without node: imports). */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface CreateProjectWizardProps {
  idea: IdeaItem;
  scanDirs: string[];
  onSuccess?: (slug: string) => void;
}

const STEPS = [
  { key: "name", label: "Name & Location" },
  { key: "template", label: "Template & Categories" },
  { key: "review", label: "Review" },
];

function initialData(idea: IdeaItem, scanDirs: string[]): CreateProjectData {
  return {
    projectName: idea.title,
    directoryName: slugify(idea.title),
    targetDir: scanDirs[0] ?? "",
    description: extractDescription(idea.body),
    templateId: "blank",
    categories: [],
    starterItems: [],
    stack: idea.stack ?? [],
    createSession: false,
  };
}

export function CreateProjectWizard({
  idea,
  scanDirs,
  onSuccess,
}: CreateProjectWizardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CreateProjectData>(() =>
    initialData(idea, scanDirs),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  // Hide button if idea already has a project or is complete
  if (idea.path || idea.status === "complete") {
    return null;
  }

  function handleUpdate(updates: Partial<CreateProjectData>) {
    setData((prev) => ({ ...prev, ...updates }));
  }

  function handleNext() {
    if (stepIndex === 0 && !data.projectName.trim()) return;
    if (!isLast) {
      setStepIndex((i) => i + 1);
    }
  }

  function handleBack() {
    if (!isFirst) {
      setStepIndex((i) => i - 1);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const result = await createProjectFromIdea({
      ideaId: idea.id,
      projectName: data.projectName.trim(),
      targetDir: data.targetDir,
      directoryName: data.directoryName.trim(),
      description: data.description.trim(),
      templateId: data.templateId,
      categories: data.categories,
      starterItems: data.starterItems,
      stack: data.stack,
      createSession: data.createSession,
    });

    setSubmitting(false);

    if (result.success) {
      handleClose();
      onSuccess?.(result.data.slug);
      router.push(`/project/${result.data.slug}/roadmap`);
    } else {
      setError(result.errors[0]?.message ?? "Failed to create project");
    }
  }

  function handleClose() {
    setData(initialData(idea, scanDirs));
    setStepIndex(0);
    setError(null);
    setOpen(false);
  }

  function renderStep() {
    switch (currentStep?.key) {
      case "name":
        return (
          <CreateProjectStepName
            data={data}
            scanDirs={scanDirs}
            onChange={handleUpdate}
          />
        );
      case "template":
        return (
          <CreateProjectStepTemplate data={data} onChange={handleUpdate} />
        );
      case "review":
        return <CreateProjectStepReview data={data} onChange={handleUpdate} />;
      default:
        return null;
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Create Project"
      >
        <FolderPlus className="mr-1 size-4" />
        Create Project
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="fixed inset-0 bg-black/10" onClick={handleClose} />
          <div className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-background p-6 ring-1 ring-foreground/10 shadow-lg">
            {/* Step indicator */}
            <div className="mb-4 text-sm text-muted-foreground">
              Step {stepIndex + 1} of {STEPS.length} &mdash;{" "}
              {currentStep?.label}
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto">{renderStep()}</div>

            {/* Error message */}
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            {/* Navigation buttons */}
            <div className="mt-4 flex justify-between">
              <div>
                {!isFirst && (
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                {isLast ? (
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Creating..." : "Create Project"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={stepIndex === 0 && !data.projectName.trim()}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
