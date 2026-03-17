/**
 * Extended types for parsed markdown data.
 * These carry preserved raw content needed for round-trip serialization (SERL-03).
 * The Zod schemas define the validated data shape; these types carry the "extras"
 * that must survive a parse->serialize->parse cycle.
 */

/**
 * A generic section parsed from markdown by splitting on ## headings.
 */
export interface Section {
  heading: string;
  lines: string[];
}

/**
 * A section the parser does not recognize as a known type.
 * Stored as raw text so the serializer can splice it back in.
 */
export interface UnknownSection {
  heading: string;
  raw: string;
}

/**
 * Preserved content from a ROADMAP.md parse.
 * Attached alongside the validated RoadmapFile data for serializer use.
 */
export interface RoadmapParseResult {
  /** Content between frontmatter and first ## heading (e.g., "# Roadmap\n\n> description") */
  preamble: string;
  /** Sections without a <!-- category:slug --> comment */
  unknownSections: UnknownSection[];
  /** Content after the last section */
  trailingContent: string;
}

/**
 * Preserved content from a SESSION_PROGRESS.md parse.
 * Attached alongside the validated SessionFile data for serializer use.
 */
export interface SessionParseResult {
  /** Content between frontmatter and first ## heading */
  preamble: string;
  /** Sections not matching known session section headings */
  unknownSections: UnknownSection[];
  /** Content after the last section */
  trailingContent: string;
}

/**
 * Preserved content from a PROJECT_IDEAS.md parse.
 * Attached alongside the validated IdeasFile data for serializer use.
 */
export interface IdeasParseResult {
  /** Content before ## Project ideas (# heading + ## preamble sections) */
  preamble: string;
  /** Content after the last idea within ## Project ideas */
  trailingContent: string;
}
