"use client";

import { useState } from "react";
import { ProjectBoard } from "./project-board";
import { ProjectStats } from "./project-stats";
import { HomeSearchInput } from "./home-search-input";
import { CrossProjectPromptButton } from "@/components/prompt/cross-project-prompt-button";
import type { ProjectCardData } from "@/lib/projects/get-projects";

interface ProjectHomeProps {
  projects: ProjectCardData[];
}

export function ProjectHome({ projects }: ProjectHomeProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
        <div className="flex items-center gap-3">
          <HomeSearchInput value={searchQuery} onChange={setSearchQuery} />
          <CrossProjectPromptButton />
        </div>
      </div>
      <ProjectStats projects={projects} />
      <ProjectBoard projects={projects} searchQuery={searchQuery} />
    </>
  );
}
