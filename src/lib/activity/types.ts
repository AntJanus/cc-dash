export type ActivityEventType =
  | "roadmap_item_completed"
  | "roadmap_item_started"
  | "session_started"
  | "session_work_completed";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  timestamp: string;
  projectSlug: string;
  projectName: string;
  title: string;
  description?: string;
  link?: string;
}
