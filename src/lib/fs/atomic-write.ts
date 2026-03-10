/**
 * Atomic file write: write to .tmp then rename.
 *
 * Ensures file writes never leave partial content. After atomicWriteFile
 * returns, the target file contains either the old content (if it existed)
 * or the new content -- never truncated/partial data.
 *
 * Strategy: write to a unique .tmp file in the same directory, then rename.
 * rename() is atomic on POSIX filesystems within the same mount.
 */

import { writeFile, rename, unlink } from "node:fs/promises";

/**
 * Atomically write content to a file path.
 *
 * 1. Write content to a temporary file (same directory as target)
 * 2. Rename temp file to target path (atomic on POSIX)
 * 3. On failure, best-effort cleanup of temp file
 *
 * @param filePath - Target file path
 * @param content - String content to write
 * @throws Re-throws the original error after cleanup attempt
 */
export async function atomicWriteFile(
  filePath: string,
  content: string,
): Promise<void> {
  const tmpPath = `${filePath}.tmp.${Date.now().toString(36)}`;

  try {
    await writeFile(tmpPath, content, "utf-8");
    await rename(tmpPath, filePath);
  } catch (error) {
    // Best-effort cleanup of temp file
    try {
      await unlink(tmpPath);
    } catch {
      // Ignore cleanup errors (tmp file may not exist if writeFile failed)
    }
    throw error;
  }
}
