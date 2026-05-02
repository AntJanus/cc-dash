import type { NextAction } from "@/lib/projects/get-next-action";

interface NextActionLineProps {
  action: NextAction;
  /** "boxed" wraps in a dashed-border container (used on project cards). */
  variant?: "boxed" | "inline";
}

export function NextActionLine({
  action,
  variant = "inline",
}: NextActionLineProps) {
  const content = (
    <p
      className="text-sm leading-snug truncate"
      style={{ color: "var(--text-secondary)" }}
    >
      <span
        className="font-semibold mr-1.5"
        style={{ color: "var(--text-muted)" }}
      >
        Next:
      </span>
      {action.name}
    </p>
  );

  if (variant === "boxed") {
    return (
      <div
        className="rounded-md px-2.5 py-1.5"
        style={{
          background: "var(--bg-subtle, var(--bg-card))",
          border: "1px dashed var(--border-light)",
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
