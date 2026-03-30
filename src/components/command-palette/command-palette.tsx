"use client";

import {
  useState,
  useEffect,
  useRef,
  useTransition,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Lightbulb,
  Activity,
  Settings,
  FolderOpen,
  Sun,
  Moon,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { refreshAllData } from "@/lib/actions/refresh-action";
import { CommandPaletteItem } from "./command-palette-item";

interface ProjectNavItem {
  slug: string;
  name: string;
  hasActiveSession?: boolean;
}

interface Command {
  id: string;
  label: string;
  icon: LucideIcon;
  section: "Navigation" | "Projects" | "Actions";
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  projects: ProjectNavItem[];
}

const NAV_COMMANDS: Omit<Command, "action">[] = [
  {
    id: "nav-home",
    label: "Home",
    icon: LayoutDashboard,
    section: "Navigation",
    keywords: ["dashboard", "all projects", "overview"],
  },
  {
    id: "nav-search",
    label: "Search",
    icon: Search,
    section: "Navigation",
    keywords: ["find", "lookup"],
  },
  {
    id: "nav-ideas",
    label: "Ideas",
    icon: Lightbulb,
    section: "Navigation",
    keywords: ["backlog", "concepts"],
  },
  {
    id: "nav-activity",
    label: "Activity",
    icon: Activity,
    section: "Navigation",
    keywords: ["timeline", "milestones", "history"],
  },
  {
    id: "nav-settings",
    label: "Settings",
    icon: Settings,
    section: "Navigation",
    keywords: ["config", "preferences"],
  },
];

const NAV_HREFS: Record<string, string> = {
  "nav-home": "/",
  "nav-search": "/search",
  "nav-ideas": "/ideas",
  "nav-activity": "/activity",
  "nav-settings": "/settings",
};

function getCurrentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function setDocumentTheme(next: "light" | "dark") {
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem("cc-dash-theme", JSON.stringify(next));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("theme-change", { detail: next }));
}

export function CommandPalette({ projects }: CommandPaletteProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync theme state when palette opens
  useEffect(() => {
    if (isOpen) {
      setTheme(getCurrentTheme());
    }
  }, [isOpen]);

  function open() {
    setIsOpen(true);
    setQuery("");
    setSelectedIndex(0);
  }

  function close() {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          close();
        } else {
          open();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Defer to let the DOM render first
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setDocumentTheme(next);
    close();
  }

  function handleRefresh() {
    startTransition(async () => {
      await refreshAllData();
      router.refresh();
    });
    close();
  }

  // Build full command list
  const allCommands: Command[] = [
    ...NAV_COMMANDS.map((cmd) => ({
      ...cmd,
      action: () => {
        router.push(NAV_HREFS[cmd.id]);
        close();
      },
    })),
    ...projects.map((p) => ({
      id: `project-${p.slug}`,
      label: p.name,
      icon: FolderOpen,
      section: "Projects" as const,
      action: () => {
        router.push(`/project/${p.slug}/roadmap`);
        close();
      },
    })),
    {
      id: "action-theme",
      label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      icon: theme === "dark" ? Sun : Moon,
      section: "Actions",
      keywords: ["toggle theme", "dark mode", "light mode"],
      action: toggleTheme,
    },
    {
      id: "action-refresh",
      label: "Refresh Data",
      icon: RefreshCw,
      section: "Actions",
      keywords: ["reload", "sync", "update"],
      action: handleRefresh,
    },
  ];

  // Filter by query
  const q = query.toLowerCase().trim();
  const filteredCommands = q
    ? allCommands.filter((cmd) => {
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.section.toLowerCase().includes(q) ||
          (cmd.keywords ?? []).some((k) => k.toLowerCase().includes(q))
        );
      })
    : allCommands;

  // Group filtered commands by section
  const sections: Array<{ title: string; commands: Command[] }> = [];
  const sectionOrder: Array<"Navigation" | "Projects" | "Actions"> = [
    "Navigation",
    "Projects",
    "Actions",
  ];
  for (const sectionName of sectionOrder) {
    const cmds = filteredCommands.filter((c) => c.section === sectionName);
    if (cmds.length > 0) {
      sections.push({ title: sectionName, commands: cmds });
    }
  }

  // Flat list for keyboard index tracking
  const flatCommands = sections.flatMap((s) => s.commands);
  const safeSelected = Math.min(
    selectedIndex,
    Math.max(0, flatCommands.length - 1),
  );

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const selected = flatCommands[safeSelected];
      if (selected) {
        selected.action();
      }
      return;
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector('[aria-selected="true"]');
    if (selectedEl && typeof selectedEl.scrollIntoView === "function") {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [safeSelected]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div
      data-testid="command-palette-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: "20vh" }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative z-10 w-full max-w-lg mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-light)",
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-light)" }}
        >
          <Search
            className="size-4 shrink-0"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex-1 bg-transparent text-base outline-none placeholder:text-sm",
            )}
            style={{
              color: "var(--text-primary)",
            }}
            aria-label="Search commands"
            aria-autocomplete="list"
            aria-controls="command-palette-list"
            role="combobox"
            aria-expanded={true}
          />
          <kbd
            className="hidden shrink-0 text-sm sm:inline-block"
            style={{ color: "var(--text-muted)" }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          id="command-palette-list"
          ref={listRef}
          role="listbox"
          aria-label="Commands"
          className="max-h-80 overflow-y-auto py-2"
        >
          {sections.length === 0 && (
            <div
              className="px-4 py-8 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No commands found
            </div>
          )}

          {sections.map((section) => (
            <div key={section.title}>
              <div
                className="px-3 py-2 text-sm font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
                role="presentation"
              >
                {section.title}
              </div>
              {section.commands.map((cmd) => {
                const index = flatIndex++;
                const isSelected = index === safeSelected;
                return (
                  <CommandPaletteItem
                    key={cmd.id}
                    icon={cmd.icon}
                    label={cmd.label}
                    isSelected={isSelected}
                    onSelect={cmd.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4 py-2 text-sm"
          style={{
            borderTop: "1px solid var(--border-light)",
            color: "var(--text-muted)",
          }}
        >
          <span>
            <kbd>↑↓</kbd> Navigate
          </span>
          <span>
            <kbd>↵</kbd> Select
          </span>
          <span>
            <kbd>Esc</kbd> Close
          </span>
          {isPending && (
            <span
              className="ml-auto text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Refreshing...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
