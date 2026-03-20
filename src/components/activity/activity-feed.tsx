"use client";

import { useState, useMemo } from "react";
import { ActivityEventItem } from "./activity-event-item";
import { ActivityFilters } from "./activity-filters";
import type { ActivityEvent } from "@/lib/activity/types";

interface ActivityFeedProps {
  events: ActivityEvent[];
  compact?: boolean;
}

export function ActivityFeed({ events, compact = false }: ActivityFeedProps) {
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const projectNames = useMemo(() => {
    const names = new Set(events.map((e) => e.projectName));
    return Array.from(names).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedProject !== "all" && e.projectName !== selectedProject) {
        return false;
      }
      if (selectedType !== "all" && e.type !== selectedType) {
        return false;
      }
      return true;
    });
  }, [events, selectedProject, selectedType]);

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div>
      {!compact && (
        <div className="mb-4">
          <ActivityFilters
            projects={projectNames}
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
          />
        </div>
      )}

      <div className={compact ? "" : "divide-y"}>
        {filteredEvents.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No matching events
          </p>
        ) : (
          filteredEvents.map((event) => (
            <ActivityEventItem key={event.id} event={event} compact={compact} />
          ))
        )}
      </div>
    </div>
  );
}
