/**
 * Public API barrel for the fs module.
 *
 * Re-exports all public types, functions, and classes from fs submodules.
 * Consumers import from `@/lib/fs` instead of individual files.
 */

// Parser (Phase 02-01, Phase 13-01)
export {
  parseRoadmap,
  parseSession,
  parseIdeas,
  parseQa,
  type ParseResult,
  type RoadmapResult,
  type SessionResult,
  type IdeasResult,
  type QaResult,
} from "./parser";

// Serializer (Phase 02-02, Phase 13-01)
export {
  serializeRoadmap,
  serializeSession,
  serializeIdeas,
  serializeQa,
} from "./serializer";

// Types (Phase 02-01, Phase 13-01)
export type {
  RoadmapParseResult,
  SessionParseResult,
  IdeasParseResult,
  QaParseResult,
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

// Write wrappers (Phase 03-01, Phase 13-01)
export {
  writeRoadmapFile,
  writeSessionFile,
  writeIdeasFile,
} from "./write-file";

// Discovery (Phase 03-02)
export { discoverProjects, slugify, type DiscoveredProject } from "./discovery";
export { DiscoveryCache } from "./discovery-cache";

// Portfolio metadata (v3.0)
export {
  portfolioPath,
  loadPortfolio,
  savePortfolio,
  loadAllPortfolios,
} from "./portfolio";
