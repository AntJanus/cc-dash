/**
 * Deterministic visual helpers for the corkboard look on home grid cards.
 *
 * Slug-stable so a card always tilts the same direction across renders.
 */

const TILT_DEGREES = [-1, 0, 1, 0, -0.6, 0.6] as const;
const PIN_COLORS = [
  "var(--accent-clay)",
  "var(--accent-gold)",
  "var(--accent-moss)",
  "var(--accent-plum)",
  "var(--accent-sky)",
] as const;

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function tiltFromSlug(slug: string): number {
  return TILT_DEGREES[hashSlug(slug) % TILT_DEGREES.length]!;
}

export function pinColorFromSlug(slug: string): string {
  // Offset the hash so tilt and pin color don't lock-step.
  return PIN_COLORS[(hashSlug(slug) + 3) % PIN_COLORS.length]!;
}

export function pinPositionFromSlug(slug: string): "left" | "center" | "right" {
  const positions: Array<"left" | "center" | "right"> = [
    "left",
    "center",
    "right",
  ];
  return positions[(hashSlug(slug) + 1) % positions.length]!;
}
