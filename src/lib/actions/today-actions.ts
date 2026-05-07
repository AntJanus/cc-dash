"use server";

/**
 * Server actions for the /today screen.
 *
 * Today's Directions ties two state surfaces together:
 *   1. Each project's canonical QA.md (the source of truth for status)
 *   2. The portfolio-level TODAYS_DIRECTIONS.md scratchpad whose checkboxes
 *      mirror today's planned QA passes.
 *
 * `approveQaFromDirections` keeps both in sync by calling the existing
 * approveQaItem action and then patching the matching checkbox in the
 * directions file.
 */

import { readFile } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { approveQaItem } from "@/lib/actions/qa-actions";
import { atomicWriteFile } from "@/lib/fs/atomic-write";
import { expandTilde } from "@/lib/fs/discovery";
import { DEFAULT_TODAY_DIRECTIONS_PATH } from "@/lib/projects/get-today-directions";
import type { Result } from "@/lib/schemas/shared";

interface ApproveOptions {
  pathOverride?: string;
}

/** Lines whose checkbox state we may rewrite. */
const QA_REF_RE_TEMPLATE = (qaId: string) =>
  new RegExp(
    `^(\\s*[-*]\\s+)\\[([ xX])\\](\\s+<!--\\s*ref:${escapeRegex(qaId)}\\s+slug:[^\\s-]+(?:[a-z0-9-_]+)?\\s*-->.*)$`,
  );

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAlreadyTerminalError(result: { errors: { field: string }[] }) {
  return result.errors.some((error) => error.field === "status");
}

/**
 * Approve a QA item and reflect the change in the portfolio-level
 * TODAYS_DIRECTIONS.md checkbox referencing it.
 *
 * Behaviour:
 *  - QA action succeeds: rewrite directions checkbox to [x] and revalidate.
 *  - QA action fails because the item is no longer pending (already passed,
 *    failed, etc.): treat as idempotent success and still rewrite the box.
 *  - QA action fails for any other reason: propagate the failure and skip
 *    the directions rewrite.
 *  - Directions file missing or qaId not present: succeed silently with no
 *    rewrite -- canonical state is what matters.
 */
export async function approveQaFromDirections(
  slug: string,
  qaId: string,
  options: ApproveOptions = {},
): Promise<Result<void>> {
  const qaResult = await approveQaItem(slug, qaId);

  if (!qaResult.success && !isAlreadyTerminalError(qaResult)) {
    return qaResult;
  }

  const filePath = expandTilde(
    options.pathOverride ?? DEFAULT_TODAY_DIRECTIONS_PATH,
  );

  let raw: string | null = null;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    raw = null;
  }

  if (raw !== null) {
    const updated = rewriteCheckbox(raw, qaId);
    if (updated !== null) {
      await atomicWriteFile(filePath, updated);
    }
  }

  revalidatePath("/today");
  revalidatePath("/qa");
  revalidatePath(`/project/${slug}/qa`);

  return { success: true, data: undefined };
}

/**
 * Rewrite the first matching checkbox line for `qaId` to `[x]`.
 * Returns null if the line was already `[x]` or no matching line exists.
 */
function rewriteCheckbox(content: string, qaId: string): string | null {
  const re = QA_REF_RE_TEMPLATE(qaId);
  const lines = content.split(/\r?\n/);
  let mutated = false;

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(re);
    if (!match) continue;
    const [, prefix, checkChar, suffix] = match;
    if (checkChar === "x" || checkChar === "X") {
      // Already done; nothing to write.
      return null;
    }
    lines[index] = `${prefix}[x]${suffix}`;
    mutated = true;
    break;
  }

  return mutated ? lines.join("\n") : null;
}
