import { z } from "zod";
import { validate, type Result } from "./shared";

// --- ID patterns ---

const TASK_ID_REGEX = /^t_[a-z0-9]{5}$/;
const FAILED_ATTEMPT_ID_REGEX = /^f_[a-z0-9]{5}$/;
const SESSION_ID_REGEX = /^s_\d{4}-\d{2}-\d{2}_.+$/;
const ROADMAP_ID_REGEX = /^r_[a-z0-9]{5}$/;

// --- Status enum ---

/**
 * Session statuses: in-progress <-> paused, in-progress -> completed, in-progress -> blocked -> in-progress
 */
export const SessionStatus = z.enum([
  "in-progress",
  "paused",
  "completed",
  "blocked",
]);

// --- Frontmatter schema ---

/**
 * YAML frontmatter for SESSION_PROGRESS.md v2 files.
 */
export const SessionFrontmatterSchema = z.object({
  schema: z.literal("cc-dash/session@1"),
  project: z.string(),
  session_id: z.string().regex(SESSION_ID_REGEX, {
    error: "Session ID must match s_YYYY-MM-DD_topic format",
  }),
  roadmap_ref: z
    .string()
    .regex(ROADMAP_ID_REGEX, {
      error: "Roadmap ref must match r_ + 5 lowercase alphanumeric chars",
    })
    .optional(),
  started: z.string().datetime({ offset: true }),
  last_updated: z.string().datetime({ offset: true }),
  status: SessionStatus,
});

export type SessionFrontmatter = z.infer<typeof SessionFrontmatterSchema>;

// --- Task schema ---

/**
 * A task item from the Plan section.
 * Example: - [ ] <!-- id:t_a1b2c dep:none --> Phase 1: Research
 */
export const SessionTaskSchema = z.object({
  id: z.string().regex(TASK_ID_REGEX, {
    error: "Task ID must match t_ + 5 lowercase alphanumeric chars",
  }),
  checked: z.boolean(),
  dependency: z.string(),
  description: z.string(),
});

export type SessionTask = z.infer<typeof SessionTaskSchema>;

// --- Failed attempt schema ---

/**
 * A failed attempt entry.
 * Example: <!-- id:f_m1n2o task:t_g5h6i --> Description of failure
 */
export const FailedAttemptSchema = z.object({
  id: z.string().regex(FAILED_ATTEMPT_ID_REGEX, {
    error: "Failed attempt ID must match f_ + 5 lowercase alphanumeric chars",
  }),
  taskRef: z.string().regex(TASK_ID_REGEX, {
    error: "Task ref must match t_ + 5 lowercase alphanumeric chars",
  }),
  description: z.string(),
});

export type FailedAttempt = z.infer<typeof FailedAttemptSchema>;

// --- Completion entry schema ---

/**
 * A completed work entry.
 * Example: <!-- ref:t_a1b2c at:2026-03-09T11:00:00-07:00 --> Description
 */
export const CompletionEntrySchema = z.object({
  taskRef: z.string().regex(TASK_ID_REGEX, {
    error: "Task ref must match t_ + 5 lowercase alphanumeric chars",
  }),
  timestamp: z.string().datetime({ offset: true }),
  description: z.string(),
});

export type CompletionEntry = z.infer<typeof CompletionEntrySchema>;

// --- Full file schema ---

/**
 * Complete parsed SESSION_PROGRESS.md file.
 */
export const SessionFileSchema = SessionFrontmatterSchema.extend({
  tasks: z.array(SessionTaskSchema),
  currentStatus: z.string(),
  decisions: z.array(z.string()),
  failedAttempts: z.array(FailedAttemptSchema),
  completedWork: z.array(CompletionEntrySchema),
  filePath: z.string(),
});

export type SessionFile = z.infer<typeof SessionFileSchema>;

// --- Validation wrappers (Result type pattern) ---

export function validateSessionFrontmatter(
  input: unknown,
): Result<SessionFrontmatter> {
  return validate(SessionFrontmatterSchema, input);
}

export function validateSessionFile(input: unknown): Result<SessionFile> {
  return validate(SessionFileSchema, input);
}
