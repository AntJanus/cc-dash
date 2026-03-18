/**
 * Pure function that converts WizardData into a markdown body string.
 *
 * Output format matches the ideas-full.md fixture:
 * - Pitch as plain paragraph
 * - #### Core Loop (game only, if non-empty)
 * - #### Requirements (if non-empty array)
 * - #### Inspirations (if non-empty array)
 * - #### Open Questions (if non-empty array)
 *
 * Sections are separated by double newlines. Empty sections are omitted entirely.
 */

import type { WizardData } from "./wizard-types";

/**
 * Format an array of strings as a markdown bullet list section.
 * Returns null if the array is empty.
 */
function formatListSection(heading: string, items: string[]): string | null {
  if (items.length === 0) return null;
  return `#### ${heading}\n\n${items.map((item) => `- ${item}`).join("\n")}`;
}

/**
 * Convert wizard data to a markdown body string.
 *
 * @param data - The wizard data to convert
 * @returns Markdown body string (may be empty if all fields are empty)
 */
export function generateIdeaBody(data: WizardData): string {
  const sections: string[] = [];

  // Pitch paragraph
  if (data.pitch.trim()) {
    sections.push(data.pitch.trim());
  }

  // Core Loop (game-only)
  if (data.projectType === "game" && data.coreLoop.trim()) {
    sections.push(`#### Core Loop\n\n${data.coreLoop.trim()}`);
  }

  // List sections
  const listSections: [string, string[]][] = [
    ["Requirements", data.requirements],
    ["Inspirations", data.inspirations],
    ["Open Questions", data.openQuestions],
  ];

  for (const [heading, items] of listSections) {
    const section = formatListSection(heading, items);
    if (section) {
      sections.push(section);
    }
  }

  return sections.join("\n\n");
}
