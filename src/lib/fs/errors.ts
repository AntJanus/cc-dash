/**
 * Typed filesystem error handling for cc-dash.
 *
 * Maps Node.js filesystem errors (ENOENT, EACCES, etc.) into typed FileError
 * objects so the UI can show meaningful messages (file not found vs. permission
 * denied vs. locked).
 */

/**
 * Discriminated error codes for filesystem operations.
 * PARSE_ERROR is included for parser-level failures (not just fs errors).
 */
export type FileErrorCode =
  | "NOT_FOUND"
  | "PERMISSION"
  | "BUSY"
  | "PARSE_ERROR"
  | "UNKNOWN";

/**
 * Structured filesystem error with typed code, human message, file path, and optional cause.
 */
export interface FileError {
  code: FileErrorCode;
  message: string;
  path: string;
  cause?: Error;
}

/**
 * Type guard for Node.js errno exceptions.
 * Returns true only for Error instances that have a .code string property.
 */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

/**
 * Maps an unknown error into a typed FileError.
 *
 * For Node.js errno exceptions, maps known codes:
 * - ENOENT -> NOT_FOUND
 * - EACCES, EPERM -> PERMISSION
 * - EBUSY -> BUSY
 * - anything else -> UNKNOWN
 *
 * For non-Error values, creates UNKNOWN with String(error) as message.
 */
export function mapFileError(error: unknown, path: string): FileError {
  if (isNodeError(error)) {
    const code = mapErrnoCode(error.code);
    return {
      code,
      message: error.message,
      path,
      cause: error,
    };
  }

  if (error instanceof Error) {
    return {
      code: "UNKNOWN",
      message: error.message,
      path,
      cause: error,
    };
  }

  return {
    code: "UNKNOWN",
    message: String(error),
    path,
  };
}

/**
 * Maps a Node.js errno code string to a FileErrorCode.
 */
function mapErrnoCode(code: string | undefined): FileErrorCode {
  switch (code) {
    case "ENOENT":
      return "NOT_FOUND";
    case "EACCES":
    case "EPERM":
      return "PERMISSION";
    case "EBUSY":
      return "BUSY";
    default:
      return "UNKNOWN";
  }
}
