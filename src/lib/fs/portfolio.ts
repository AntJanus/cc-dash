/**
 * Read/write operations for .cc-dash/portfolio.json files.
 *
 * Each scan directory can have a portfolio file at <scan_dir>/.cc-dash/portfolio.json
 * that stores project ordering and status metadata.
 */

import { readFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { atomicWriteFile } from "./atomic-write";
import {
  PortfolioFileSchema,
  type PortfolioFile,
} from "@/lib/schemas/portfolio";

/** Get the portfolio.json path for a scan directory. */
export function portfolioPath(scanDir: string): string {
  return join(scanDir, ".cc-dash", "portfolio.json");
}

/**
 * Load portfolio metadata for a scan directory.
 * Returns a default empty portfolio if the file doesn't exist or is invalid.
 */
export async function loadPortfolio(scanDir: string): Promise<PortfolioFile> {
  const filePath = portfolioPath(scanDir);
  try {
    const raw = await readFile(filePath, "utf-8");
    const json = JSON.parse(raw);
    const result = PortfolioFileSchema.safeParse(json);
    if (result.success) return result.data;
  } catch {
    // File doesn't exist or parse error — return defaults
  }
  return { schema: "cc-dash/portfolio@1", projects: {} };
}

/**
 * Save portfolio metadata for a scan directory.
 * Creates the .cc-dash directory if it doesn't exist.
 */
export async function savePortfolio(
  scanDir: string,
  portfolio: PortfolioFile,
): Promise<void> {
  const filePath = portfolioPath(scanDir);
  await mkdir(dirname(filePath), { recursive: true });
  await atomicWriteFile(filePath, JSON.stringify(portfolio, null, 2) + "\n");
}

/**
 * Load and merge portfolio data from all scan directories.
 * Returns a flat map of slug -> entry, with the scan dir path tracked.
 */
export async function loadAllPortfolios(scanDirs: string[]): Promise<
  Map<
    string,
    {
      scanDir: string;
      status: string;
      order?: number;
      canvas?: { x: number; y: number };
      cadence: string | null;
      dormantUntil: string | null;
    }
  >
> {
  const merged = new Map<
    string,
    {
      scanDir: string;
      status: string;
      order?: number;
      canvas?: { x: number; y: number };
      cadence: string | null;
      dormantUntil: string | null;
    }
  >();

  await Promise.all(
    scanDirs.map(async (dir) => {
      const portfolio = await loadPortfolio(dir);
      for (const [slug, entry] of Object.entries(portfolio.projects)) {
        merged.set(slug, {
          scanDir: dir,
          status: entry.status,
          order: entry.order,
          canvas: entry.canvas,
          cadence: entry.cadence,
          dormantUntil: entry.dormant_until,
        });
      }
    }),
  );

  return merged;
}
