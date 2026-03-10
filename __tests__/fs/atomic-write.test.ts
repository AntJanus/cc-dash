/**
 * Tests for atomic file write operations.
 * Verifies FILE-01: writes never leave partial content (atomic: old content or new content, never truncated).
 *
 * Uses real temp directories (NOT mocks) to test actual filesystem atomicity.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { atomicWriteFile } from "@/lib/fs/atomic-write";

describe("atomicWriteFile", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "atomic-write-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("writes content to a new file", async () => {
    const filePath = join(tempDir, "new-file.md");
    const content = "---\nschema: cc-dash/roadmap@1\n---\n# Roadmap\n";

    await atomicWriteFile(filePath, content);

    const result = await readFile(filePath, "utf-8");
    expect(result).toBe(content);
  });

  it("overwrites an existing file with new content", async () => {
    const filePath = join(tempDir, "existing.md");
    await writeFile(filePath, "old content", "utf-8");

    const newContent = "new content";
    await atomicWriteFile(filePath, newContent);

    const result = await readFile(filePath, "utf-8");
    expect(result).toBe(newContent);
  });

  it("leaves no .tmp file after successful write", async () => {
    const filePath = join(tempDir, "clean.md");
    await atomicWriteFile(filePath, "some content");

    const files = await readdir(tempDir);
    const tmpFiles = files.filter((f) => f.includes(".tmp."));
    expect(tmpFiles).toHaveLength(0);
  });

  it("throws when writing to a non-existent directory", async () => {
    const filePath = join(tempDir, "nonexistent", "sub", "file.md");

    await expect(atomicWriteFile(filePath, "content")).rejects.toThrow();
  });
});
