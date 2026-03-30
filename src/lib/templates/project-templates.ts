/**
 * Built-in project template presets.
 *
 * Templates provide default categories and starter roadmap items
 * for common project types. Users can customize these before creation.
 */

export interface TemplateCategory {
  title: string;
  slug: string;
}

export interface TemplateStarterItem {
  name: string;
  description: string;
  categorySlug: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  defaultStack: string[];
  categories: TemplateCategory[];
  starterItems: TemplateStarterItem[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Empty project with no predefined categories",
    defaultStack: [],
    categories: [],
    starterItems: [],
  },
  {
    id: "go-cli",
    name: "Go CLI",
    description: "Command-line tool built with Go",
    defaultStack: ["Go"],
    categories: [
      { title: "Core Features", slug: "core" },
      { title: "CLI UX", slug: "cli-ux" },
      { title: "Testing & CI", slug: "testing-ci" },
    ],
    starterItems: [
      {
        name: "Project scaffolding",
        description:
          "Initialize Go module, directory structure, and main entrypoint.",
        categorySlug: "core",
      },
      {
        name: "CI pipeline",
        description: "Set up GitHub Actions for build, lint, and test checks.",
        categorySlug: "testing-ci",
      },
      {
        name: "README and docs",
        description:
          "Write usage examples, installation instructions, and CLI reference.",
        categorySlug: "cli-ux",
      },
    ],
  },
  {
    id: "react-app",
    name: "React App",
    description: "Web application built with React",
    defaultStack: ["TypeScript", "React"],
    categories: [
      { title: "Core Features", slug: "core" },
      { title: "UI/UX", slug: "ui-ux" },
      { title: "Testing & CI", slug: "testing-ci" },
      { title: "Infrastructure", slug: "infra" },
    ],
    starterItems: [
      {
        name: "Project scaffolding",
        description:
          "Initialize React app with TypeScript, linting, and dev server.",
        categorySlug: "core",
      },
      {
        name: "CI pipeline",
        description: "Set up GitHub Actions for build, lint, and test checks.",
        categorySlug: "testing-ci",
      },
      {
        name: "Component library setup",
        description:
          "Choose and configure UI component primitives and styling approach.",
        categorySlug: "ui-ux",
      },
    ],
  },
  {
    id: "python-api",
    name: "Python API",
    description: "Backend API built with Python",
    defaultStack: ["Python", "FastAPI"],
    categories: [
      { title: "API Endpoints", slug: "api" },
      { title: "Data Layer", slug: "data" },
      { title: "Testing & CI", slug: "testing-ci" },
      { title: "Infrastructure", slug: "infra" },
    ],
    starterItems: [
      {
        name: "Project scaffolding",
        description:
          "Initialize Python project with virtual env, dependencies, and entry point.",
        categorySlug: "api",
      },
      {
        name: "CI pipeline",
        description:
          "Set up GitHub Actions for lint, type check, and test suite.",
        categorySlug: "testing-ci",
      },
      {
        name: "Database setup",
        description:
          "Configure database connection, migrations, and seed data.",
        categorySlug: "data",
      },
    ],
  },
  {
    id: "sveltekit-app",
    name: "SvelteKit App",
    description: "Web application built with SvelteKit",
    defaultStack: ["TypeScript", "SvelteKit"],
    categories: [
      { title: "Pages & Routes", slug: "pages" },
      { title: "Components", slug: "components" },
      { title: "Testing & CI", slug: "testing-ci" },
      { title: "Infrastructure", slug: "infra" },
    ],
    starterItems: [
      {
        name: "Project scaffolding",
        description:
          "Initialize SvelteKit project with TypeScript and adapter config.",
        categorySlug: "pages",
      },
      {
        name: "CI pipeline",
        description: "Set up GitHub Actions for build, lint, and test checks.",
        categorySlug: "testing-ci",
      },
      {
        name: "Layout and navigation",
        description:
          "Create root layout with navigation structure and shared components.",
        categorySlug: "components",
      },
    ],
  },
  {
    id: "game",
    name: "Game",
    description: "Game project (any engine or framework)",
    defaultStack: [],
    categories: [
      { title: "Core Gameplay", slug: "gameplay" },
      { title: "Art & Assets", slug: "art" },
      { title: "Polish", slug: "polish" },
      { title: "Testing & CI", slug: "testing-ci" },
    ],
    starterItems: [
      {
        name: "Project scaffolding",
        description:
          "Initialize game project with engine setup and basic scene.",
        categorySlug: "gameplay",
      },
      {
        name: "Core game loop",
        description: "Implement main update/render loop with state management.",
        categorySlug: "gameplay",
      },
      {
        name: "Asset pipeline",
        description: "Set up asset loading, sprite sheets, or model imports.",
        categorySlug: "art",
      },
    ],
  },
  {
    id: "library",
    name: "Library",
    description: "Reusable library or package",
    defaultStack: ["TypeScript"],
    categories: [
      { title: "Core API", slug: "core-api" },
      { title: "Documentation", slug: "docs" },
      { title: "Testing & CI", slug: "testing-ci" },
      { title: "Distribution", slug: "distribution" },
    ],
    starterItems: [
      {
        name: "Project scaffolding",
        description:
          "Initialize package with build config, exports, and type definitions.",
        categorySlug: "core-api",
      },
      {
        name: "CI pipeline",
        description:
          "Set up GitHub Actions for build, lint, test, and publish checks.",
        categorySlug: "testing-ci",
      },
      {
        name: "API documentation",
        description:
          "Write API reference with usage examples and getting started guide.",
        categorySlug: "docs",
      },
    ],
  },
];

/** Find a template by ID, returns undefined if not found. */
export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
}
