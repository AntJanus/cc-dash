/**
 * Plain file generators for project scaffolding.
 *
 * These generate non-schema files (README.md, CLAUDE.md, .claude/settings.local.json)
 * that are written directly via atomicWriteFile — they bypass the parser/serializer.
 */

/** Generate a basic README.md with project name and description. */
export function generateReadme(name: string, description: string): string {
  return `# ${name}\n\n${description}\n`;
}

/** Generate a starter CLAUDE.md with standard sections. */
export function generateClaudeMd(
  name: string,
  description: string,
  stack: string[],
): string {
  const stackLine =
    stack.length > 0 ? `\n**Stack**: ${stack.join(", ")}\n` : "";

  return `# CLAUDE.md — ${name}

## Project Overview

${description}
${stackLine}
## Development Commands

\`\`\`bash
# TODO: Add build, test, lint, and dev commands
\`\`\`

## Architecture

\`\`\`
# TODO: Add directory structure and key patterns
\`\`\`

## Conventions

- TODO: Add code style, imports, error handling conventions

## Do Not

- TODO: Add project-specific guardrails
`;
}

/** Generate an empty .claude/settings.local.json. */
export function generateClaudeSettings(): string {
  return "{}\n";
}
