/**
 * High-level file write wrappers for ROADMAP.md and SESSION_PROGRESS.md.
 *
 * Each wrapper:
 * 1. Auto-sets last_updated to current ISO timestamp (FILE-02)
 * 2. Serializes data via the existing serializer
 * 3. Writes atomically via atomicWriteFile (FILE-01)
 * 4. Returns Result<void> with typed errors on failure (FILE-03)
 */

import { atomicWriteFile } from "./atomic-write";
import { serializeRoadmap, serializeSession } from "./serializer";
import { mapFileError } from "./errors";
import type { Result, ValidationError } from "@/lib/schemas/shared";
import type { RoadmapFile } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";
import type { RoadmapParseResult, SessionParseResult } from "./types";

/**
 * Convert a FileError into a ValidationError for the Result pattern.
 * Uses "file" as the field name since the error relates to file operations.
 */
function fileErrorToValidationError(
  code: string,
  message: string,
  path: string,
): ValidationError {
  return {
    field: "file",
    message: `${code}: ${message} (${path})`,
    received: path,
  };
}

/**
 * Write a ROADMAP.md file with auto-updated last_updated timestamp.
 *
 * @param filePath - Target file path
 * @param data - Validated roadmap data
 * @param preserved - Preserved content from parsing (preamble, unknown sections, trailing)
 * @returns Result<void> with success or typed error
 */
export async function writeRoadmapFile(
  filePath: string,
  data: RoadmapFile,
  preserved: Partial<RoadmapParseResult>,
): Promise<Result<void>> {
  try {
    // Auto-set last_updated to current ISO timestamp
    const updated = { ...data, last_updated: new Date().toISOString() };

    // Serialize with preserved content for round-trip fidelity
    const markdown = serializeRoadmap({ ...updated, ...preserved });

    // Write atomically
    await atomicWriteFile(filePath, markdown);

    return { success: true, data: undefined };
  } catch (error) {
    const fileError = mapFileError(error, filePath);
    return {
      success: false,
      errors: [
        fileErrorToValidationError(
          fileError.code,
          fileError.message,
          fileError.path,
        ),
      ],
    };
  }
}

/**
 * Write a SESSION_PROGRESS.md file with auto-updated last_updated timestamp.
 *
 * @param filePath - Target file path
 * @param data - Validated session data
 * @param preserved - Preserved content from parsing (preamble, unknown sections, trailing)
 * @returns Result<void> with success or typed error
 */
export async function writeSessionFile(
  filePath: string,
  data: SessionFile,
  preserved: Partial<SessionParseResult>,
): Promise<Result<void>> {
  try {
    // Auto-set last_updated to current ISO timestamp
    const updated = { ...data, last_updated: new Date().toISOString() };

    // Serialize with preserved content for round-trip fidelity
    const markdown = serializeSession({ ...updated, ...preserved });

    // Write atomically
    await atomicWriteFile(filePath, markdown);

    return { success: true, data: undefined };
  } catch (error) {
    const fileError = mapFileError(error, filePath);
    return {
      success: false,
      errors: [
        fileErrorToValidationError(
          fileError.code,
          fileError.message,
          fileError.path,
        ),
      ],
    };
  }
}
