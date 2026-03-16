import { describe, it } from "vitest";

describe("assembleProjectPrompt", () => {
  it.todo("starts with cd /path/to/project");
  it.todo("includes project name");
  it.todo("includes roadmap progress summary X/Y done");
  it.todo("includes next in-progress or planned item");
  it.todo("includes session status and currentStatus when session exists");
  it.todo("includes reminder to read SESSION_PROGRESS.md when session exists");
  it.todo("omits session section when no session");
  it.todo("omits roadmap section when no roadmap");
  it.todo("suggests resume when session is in-progress");
  it.todo("suggests execute when roadmap has planned items");
  it.todo("suggests plan when no planned items and no active session");
  it.todo("produces plain text with no markdown formatting");
});

describe("pickBestProject", () => {
  it.todo("returns null when no candidates");
  it.todo("returns null when all projects are complete");
  it.todo("picks project with active session over recently active");
  it.todo("picks most recently updated active session when multiple");
  it.todo("picks recently active over stalled when no active sessions");
  it.todo("picks stalled project when no active or recent");
  it.todo("sorts stalled by lastUpdated descending");
});
