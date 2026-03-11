"use client";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: YEAR },
  { unit: "month", seconds: MONTH },
  { unit: "week", seconds: WEEK },
  { unit: "day", seconds: DAY },
  { unit: "hour", seconds: HOUR },
  { unit: "minute", seconds: MINUTE },
];

/**
 * Format an ISO date string as a relative time string (e.g., "2 days ago").
 * Uses Intl.RelativeTimeFormat for locale-aware formatting.
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const { unit, seconds } of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      const value = Math.round(diffSeconds / seconds);
      return rtf.format(value, unit);
    }
  }

  return "just now";
}

interface RelativeTimeProps {
  iso: string;
  className?: string;
}

/** Renders a <time> element with relative time text */
export function RelativeTime({ iso, className }: RelativeTimeProps) {
  return (
    <time dateTime={iso} className={className} data-testid="relative-time">
      {formatRelativeTime(iso)}
    </time>
  );
}
