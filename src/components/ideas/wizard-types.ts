/**
 * Wizard types and constants for the Idea Development Wizard.
 *
 * Shared across all wizard step components, the body generator,
 * and the wizard container.
 */

import type { ComponentType } from "react";

/** Supported project types for the wizard. */
export type ProjectType = "game" | "tool" | "webapp" | "library" | "other";

/** Data collected across all wizard steps. */
export interface WizardData {
  title: string;
  pitch: string;
  projectType: ProjectType;
  stack: string[];
  coreLoop: string;
  requirements: string[];
  inspirations: string[];
  openQuestions: string[];
}

/** Initial empty state for wizard data. */
export const INITIAL_WIZARD_DATA: WizardData = {
  title: "",
  pitch: "",
  projectType: "tool",
  stack: [],
  coreLoop: "",
  requirements: [],
  inspirations: [],
  openQuestions: [],
};

/** Definition for a wizard step. */
export type StepDef = {
  key: string;
  label: string;
  component: ComponentType;
};
