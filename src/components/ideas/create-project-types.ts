import type {
  TemplateCategory,
  TemplateStarterItem,
} from "@/lib/templates/project-templates";

export interface CreateProjectData {
  projectName: string;
  directoryName: string;
  targetDir: string;
  description: string;
  templateId: string;
  categories: TemplateCategory[];
  starterItems: TemplateStarterItem[];
  stack: string[];
  createSession: boolean;
}

/** Extract the first paragraph from idea body (before first #### heading). */
export function extractDescription(body: string): string {
  const lines = body.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#### ")) break;
    result.push(line);
  }

  return result.join("\n").trim();
}
