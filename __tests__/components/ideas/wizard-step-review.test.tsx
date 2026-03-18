import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { WizardStepReview } from "@/components/ideas/wizard-step-review";
import type { WizardData } from "@/components/ideas/wizard-types";

const fullGameData: WizardData = {
  title: "Fantasy Dungeon Crawler",
  pitch: "A roguelike dungeon crawler with procedural generation.",
  projectType: "game",
  stack: ["TypeScript", "PixiJS", "Vite"],
  coreLoop: "Explore dungeons, fight monsters, collect loot, level up.",
  requirements: ["Procedural map generation", "Save/load system"],
  inspirations: ["NetHack", "Dwarf Fortress"],
  openQuestions: ["What rendering engine?", "Multiplayer support?"],
};

const minimalData: WizardData = {
  title: "Minimal Idea",
  pitch: "",
  projectType: "tool",
  stack: [],
  coreLoop: "",
  requirements: [],
  inspirations: [],
  openQuestions: [],
};

const toolData: WizardData = {
  title: "CLI Helper",
  pitch: "A command-line tool for managing dotfiles.",
  projectType: "tool",
  stack: ["Go"],
  coreLoop: "Should be ignored for non-game",
  requirements: ["Cross-platform support"],
  inspirations: [],
  openQuestions: [],
};

describe("WizardStepReview", () => {
  afterEach(() => {
    cleanup();
  });

  it("displays title from data.title", () => {
    render(<WizardStepReview data={fullGameData} />);

    expect(screen.getByText("Fantasy Dungeon Crawler")).toBeInTheDocument();
  });

  it("displays project type from data.projectType", () => {
    render(<WizardStepReview data={fullGameData} />);

    expect(screen.getByText(/game/i)).toBeInTheDocument();
  });

  it("displays stack tags when non-empty", () => {
    render(<WizardStepReview data={fullGameData} />);

    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("PixiJS")).toBeInTheDocument();
    expect(screen.getByText("Vite")).toBeInTheDocument();
  });

  it("shows generated markdown preview containing pitch", () => {
    render(<WizardStepReview data={fullGameData} />);

    expect(
      screen.getByText(
        /a roguelike dungeon crawler with procedural generation/i,
      ),
    ).toBeInTheDocument();
  });

  it("preview contains #### Requirements section when requirements non-empty", () => {
    render(<WizardStepReview data={fullGameData} />);

    // The preview should contain the requirements section heading
    expect(screen.getByText(/#### Requirements/)).toBeInTheDocument();
    expect(screen.getByText(/- Procedural map generation/)).toBeInTheDocument();
  });

  it("preview contains #### Core Loop for game projectType", () => {
    render(<WizardStepReview data={fullGameData} />);

    expect(screen.getByText(/#### Core Loop/)).toBeInTheDocument();
    expect(
      screen.getByText(/explore dungeons, fight monsters/i),
    ).toBeInTheDocument();
  });

  it("preview omits #### Core Loop when projectType is not game", () => {
    render(<WizardStepReview data={toolData} />);

    // Core Loop should NOT appear in preview for non-game types
    expect(screen.queryByText(/#### Core Loop/)).not.toBeInTheDocument();
  });

  it("shows empty body message when all optional fields are empty", () => {
    render(<WizardStepReview data={minimalData} />);

    expect(screen.getByText(/no body content/i)).toBeInTheDocument();
  });
});
