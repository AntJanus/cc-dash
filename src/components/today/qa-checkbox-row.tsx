"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { approveQaFromDirections } from "@/lib/actions/today-actions";

interface QaCheckboxRowProps {
  qaId: string;
  slug: string;
  description: string;
  checked: boolean;
  projectName?: string;
}

export function QaCheckboxRow({
  qaId,
  slug,
  description,
  checked: initialChecked,
  projectName,
}: QaCheckboxRowProps) {
  const [checked, setChecked] = useState(initialChecked);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    if (checked || pending) return;
    setError(null);
    setChecked(true);
    startTransition(async () => {
      const result = await approveQaFromDirections(slug, qaId);
      if (!result.success) {
        setChecked(false);
        const reason = result.errors[0]?.message ?? "Failed to approve QA item";
        setError(reason);
      }
    });
  }

  const label = projectName ? `${projectName} — ${description}` : description;

  return (
    <li className="flex items-start gap-2.5">
      <button
        type="button"
        onClick={handleApprove}
        disabled={checked || pending}
        aria-pressed={checked}
        aria-label={`Approve QA item: ${description}`}
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors"
        style={{
          background: checked
            ? "var(--accent-emerald)"
            : "var(--bg-card, transparent)",
          borderColor: checked
            ? "var(--accent-emerald)"
            : "var(--border-light)",
          color: "var(--bg-card, white)",
          cursor: checked || pending ? "default" : "pointer",
        }}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : checked ? (
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        ) : null}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm leading-snug"
          style={{
            color: checked ? "var(--text-muted)" : "var(--text-primary)",
            textDecoration: checked ? "line-through" : "none",
          }}
        >
          {label}
        </p>
        <Link
          href={`/project/${slug}/qa`}
          className="text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          Open {slug} QA
        </Link>
        {error ? (
          <p className="text-sm mt-1" style={{ color: "var(--accent-red)" }}>
            {error}
          </p>
        ) : null}
      </div>
    </li>
  );
}
