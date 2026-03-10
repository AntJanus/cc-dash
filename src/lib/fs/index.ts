/**
 * Public API barrel for the fs module.
 *
 * Re-exports all public types, functions, and classes from fs submodules.
 * Consumers import from `@/lib/fs` instead of individual files.
 */

// Parser (Phase 02-01)
export {
  parseRoadmap,
  parseSession,
  type ParseResult,
  type RoadmapResult,
  type SessionResult,
} from "./parser";

// Serializer (Phase 02-02)
export { serializeRoadmap, serializeSession } from "./serializer";

// Types (Phase 02-01)
export type {
  RoadmapParseResult,
  SessionParseResult,
  UnknownSection,
  Section,
} from "./types";

// Errors (Phase 03-01)
export {
  type FileError,
  type FileErrorCode,
  isNodeError,
  mapFileError,
} from "./errors";

// Atomic write (Phase 03-01)
export { atomicWriteFile } from "./atomic-write";

// Write wrappers (Phase 03-01)
export { writeRoadmapFile, writeSessionFile } from "./write-file";

// Discovery (Phase 03-02)
export { discoverProjects, type DiscoveredProject } from "./discovery";
export { DiscoveryCache } from "./discovery-cache";
