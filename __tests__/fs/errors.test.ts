/**
 * Tests for filesystem error types and mapping.
 * Verifies FILE-03: typed errors distinguishing NOT_FOUND, PERMISSION, BUSY, PARSE_ERROR, UNKNOWN.
 */

import { describe, it, expect } from "vitest";
import { mapFileError, isNodeError, type FileError } from "@/lib/fs/errors";

describe("isNodeError", () => {
  it("returns true for Error objects with a .code property", () => {
    const err = Object.assign(new Error("not found"), { code: "ENOENT" });
    expect(isNodeError(err)).toBe(true);
  });

  it("returns false for plain Error objects without .code", () => {
    const err = new Error("plain error");
    expect(isNodeError(err)).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isNodeError("string")).toBe(false);
    expect(isNodeError(42)).toBe(false);
    expect(isNodeError(null)).toBe(false);
    expect(isNodeError(undefined)).toBe(false);
    expect(isNodeError({ code: "ENOENT" })).toBe(false);
  });
});

describe("mapFileError", () => {
  const testPath = "/some/test/file.md";

  it("maps ENOENT to NOT_FOUND", () => {
    const err = Object.assign(new Error("no such file"), { code: "ENOENT" });
    const result: FileError = mapFileError(err, testPath);
    expect(result.code).toBe("NOT_FOUND");
    expect(result.path).toBe(testPath);
    expect(result.message).toBe("no such file");
    expect(result.cause).toBe(err);
  });

  it("maps EACCES to PERMISSION", () => {
    const err = Object.assign(new Error("permission denied"), {
      code: "EACCES",
    });
    const result = mapFileError(err, testPath);
    expect(result.code).toBe("PERMISSION");
    expect(result.path).toBe(testPath);
    expect(result.cause).toBe(err);
  });

  it("maps EPERM to PERMISSION", () => {
    const err = Object.assign(new Error("operation not permitted"), {
      code: "EPERM",
    });
    const result = mapFileError(err, testPath);
    expect(result.code).toBe("PERMISSION");
    expect(result.path).toBe(testPath);
    expect(result.cause).toBe(err);
  });

  it("maps EBUSY to BUSY", () => {
    const err = Object.assign(new Error("resource busy"), { code: "EBUSY" });
    const result = mapFileError(err, testPath);
    expect(result.code).toBe("BUSY");
    expect(result.path).toBe(testPath);
    expect(result.cause).toBe(err);
  });

  it("maps unknown error codes to UNKNOWN", () => {
    const err = Object.assign(new Error("something else"), {
      code: "EINVAL",
    });
    const result = mapFileError(err, testPath);
    expect(result.code).toBe("UNKNOWN");
    expect(result.path).toBe(testPath);
    expect(result.cause).toBe(err);
  });

  it("maps non-Error values to UNKNOWN with String(error) message", () => {
    const result = mapFileError("string error", testPath);
    expect(result.code).toBe("UNKNOWN");
    expect(result.path).toBe(testPath);
    expect(result.message).toBe("string error");
    expect(result.cause).toBeUndefined();
  });

  it("maps null to UNKNOWN", () => {
    const result = mapFileError(null, testPath);
    expect(result.code).toBe("UNKNOWN");
    expect(result.message).toBe("null");
  });

  it("maps number to UNKNOWN", () => {
    const result = mapFileError(42, testPath);
    expect(result.code).toBe("UNKNOWN");
    expect(result.message).toBe("42");
  });
});
