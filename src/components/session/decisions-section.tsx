"use client";

interface DecisionsSectionProps {
  decisions: string[];
}

export function DecisionsSection({ decisions }: DecisionsSectionProps) {
  if (decisions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No decisions recorded</p>
    );
  }

  return (
    <ul className="list-disc space-y-1 pl-5">
      {decisions.map((decision, index) => (
        <li key={index} className="text-sm">
          {decision}
        </li>
      ))}
    </ul>
  );
}
