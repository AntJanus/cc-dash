"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { ProjectCard } from "./project-card";
import { setProjectCanvasPosition } from "@/lib/actions/portfolio-actions";
import type { ProjectCardData } from "@/lib/projects/get-projects";

const COLUMN_WIDTH = 340;
const ROW_HEIGHT = 220;
const COLUMNS = 4;
const GUTTER_X = 32;
const GUTTER_Y = 32;
const CARD_WIDTH = COLUMN_WIDTH;
const DRAG_THRESHOLD_PX = 5;

interface Position {
  x: number;
  y: number;
}

/** Auto-layout fallback for projects without saved positions. */
function autoLayout(index: number): Position {
  const col = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  return {
    x: col * (COLUMN_WIDTH + GUTTER_X),
    y: row * (ROW_HEIGHT + GUTTER_Y),
  };
}

interface ProjectCanvasProps {
  projects: ProjectCardData[];
}

export function ProjectCanvas({ projects }: ProjectCanvasProps) {
  const initialPositions = useMemo(() => {
    const map: Record<string, Position> = {};
    projects.forEach((project, idx) => {
      map[project.slug] = project.canvasPosition ?? autoLayout(idx);
    });
    return map;
  }, [projects]);

  const [positions, setPositions] =
    useState<Record<string, Position>>(initialPositions);

  // If the projects prop changes (filter / sort), refresh positions for new slugs
  // while preserving any in-flight drag positions for known slugs.
  useEffect(() => {
    setPositions((prev) => {
      const next: Record<string, Position> = {};
      projects.forEach((project, idx) => {
        next[project.slug] =
          prev[project.slug] ?? project.canvasPosition ?? autoLayout(idx);
      });
      return next;
    });
  }, [projects]);

  // Compute canvas extent so the scroll container covers all cards.
  const extent = useMemo(() => {
    let maxX = COLUMNS * (COLUMN_WIDTH + GUTTER_X);
    let maxY = 600;
    for (const pos of Object.values(positions)) {
      if (pos.x + COLUMN_WIDTH > maxX) maxX = pos.x + COLUMN_WIDTH;
      if (pos.y + ROW_HEIGHT > maxY) maxY = pos.y + ROW_HEIGHT;
    }
    return { width: maxX + 200, height: maxY + 200 };
  }, [positions]);

  const updatePosition = useCallback((slug: string, position: Position) => {
    setPositions((prev) => ({ ...prev, [slug]: position }));
  }, []);

  const persistPosition = useCallback(
    async (slug: string, position: Position) => {
      try {
        await setProjectCanvasPosition(slug, position);
      } catch {
        // Persistence failure is silent — the local position still updates.
      }
    },
    [],
  );

  return (
    <div className="canvas-scroll" data-slot="project-canvas">
      <div
        className="canvas-surface"
        style={{ width: extent.width, height: extent.height }}
      >
        {projects.map((project) => {
          const pos = positions[project.slug] ?? { x: 0, y: 0 };
          return (
            <CanvasCard
              key={project.slug}
              project={project}
              position={pos}
              onPositionChange={(p) => updatePosition(project.slug, p)}
              onCommit={(p) => persistPosition(project.slug, p)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface CanvasCardProps {
  project: ProjectCardData;
  position: Position;
  onPositionChange: (pos: Position) => void;
  onCommit: (pos: Position) => void;
}

function CanvasCard({
  project,
  position,
  onPositionChange,
  onCommit,
}: CanvasCardProps) {
  const dragState = useRef<{
    active: boolean;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    movement: number;
  }>({
    active: false,
    startClientX: 0,
    startClientY: 0,
    originX: 0,
    originY: 0,
    movement: 0,
  });

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    // Don't initiate drag from inline buttons (status menu, prompt, etc.)
    const target = e.target as HTMLElement;
    if (target.closest("button, [role='menuitem'], a[data-no-drag]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      active: true,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: position.x,
      originY: position.y,
      movement: 0,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag.active) return;
    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;
    const distance = Math.hypot(dx, dy);
    if (distance > drag.movement) drag.movement = distance;
    onPositionChange({ x: drag.originX + dx, y: drag.originY + dy });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag.active) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    drag.active = false;
    if (drag.movement > DRAG_THRESHOLD_PX) {
      const dx = e.clientX - drag.startClientX;
      const dy = e.clientY - drag.startClientY;
      onCommit({ x: drag.originX + dx, y: drag.originY + dy });
    }
  };

  // If a drag occurred, suppress the click that would otherwise navigate.
  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (dragState.current.movement > DRAG_THRESHOLD_PX) {
      e.preventDefault();
      e.stopPropagation();
      // Reset for the next interaction
      dragState.current.movement = 0;
    }
  };

  const isDragging = dragState.current.active;

  return (
    <div
      data-slot="canvas-card"
      data-slug={project.slug}
      className="canvas-card"
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${CARD_WIDTH}px`,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
    >
      {/* Re-use the existing ProjectCard but turn off the corkboard tilt
          since the canvas already provides freeform positioning. */}
      <ProjectCard project={project} corkboard={false} />
    </div>
  );
}
