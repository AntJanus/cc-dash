"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  Activity,
  BarChart3,
  Bot,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Moon,
  Sun,
  Terminal,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { RefreshButton } from "@/components/shared/refresh-button";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  projects: { slug: string; name: string; hasActiveSession?: boolean }[];
}

const NAV_ITEMS = [
  { href: "/", label: "All Projects", icon: LayoutDashboard, color: "teal" },
  { href: "/search", label: "Search", icon: Search, color: "blue" },
  { href: "/ideas", label: "Ideas", icon: Lightbulb, color: "violet" },
  { href: "/activity", label: "Activity", icon: Activity, color: "blue" },
  { href: "/metrics", label: "Metrics", icon: BarChart3, color: "emerald" },
  { href: "/agents", label: "Agents", icon: Bot, color: "violet" },
  { href: "/settings", label: "Settings", icon: Settings, color: "amber" },
] as const;

const ICON_COLORS = {
  teal: {
    bg: "var(--accent-teal-light)",
    fg: "var(--accent-teal)",
  },
  violet: {
    bg: "var(--accent-violet-light)",
    fg: "var(--accent-violet)",
  },
  blue: {
    bg: "var(--accent-blue-light)",
    fg: "var(--accent-blue)",
  },
  amber: {
    bg: "var(--accent-amber-light)",
    fg: "var(--accent-amber)",
  },
  emerald: {
    bg: "var(--accent-emerald-light)",
    fg: "var(--accent-emerald)",
  },
};

export function AppSidebar({ projects }: AppSidebarProps) {
  const { isOpen, isMobileOpen, toggle, closeMobile } = useSidebar();
  const pathname = usePathname();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const activeSessionProjects = projects.filter((p) => p.hasActiveSession);

  // Sync theme state with DOM after mount (avoids hydration mismatch)
  useEffect(() => {
    const current = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setTheme(current);
  }, []);

  // Listen for theme changes from other components (e.g. command palette)
  useEffect(() => {
    function onThemeChange(e: Event) {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      setTheme(detail);
    }
    window.addEventListener("theme-change", onThemeChange);
    return () => window.removeEventListener("theme-change", onThemeChange);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("cc-dash-theme", JSON.stringify(next));
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("theme-change", { detail: next }));
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={closeMobile}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-teal), var(--accent-violet))",
            }}
          >
            <Activity className="h-4 w-4" />
          </div>
          {isOpen && (
            <span className="text-lg font-semibold dark:gradient-text">
              cc-dash
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {/* Active Sessions section */}
        {isOpen && activeSessionProjects.length > 0 && (
          <div className="mb-4">
            <div
              className="px-3 py-2 text-sm font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Active Sessions
            </div>
            <ul className="mt-1 space-y-0.5">
              {activeSessionProjects.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/project/${p.slug}/session`}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      pathname.includes(`/project/${p.slug}`)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-md"
                      style={{
                        background: ICON_COLORS.emerald.bg,
                        color: ICON_COLORS.emerald.fg,
                      }}
                    >
                      <Terminal className="h-3 w-3" />
                    </span>
                    <span className="flex-1 truncate">{p.name}</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        background: "var(--accent-emerald-light)",
                        color: "var(--accent-emerald)",
                      }}
                    >
                      LIVE
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation section */}
        {isOpen && (
          <div
            className="px-3 py-2 text-sm font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Navigation
          </div>
        )}
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const colors = ICON_COLORS[item.color];
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary dark:shadow-[0_0_20px_var(--accent-cyan-dim)]"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-md"
                    style={{
                      background: colors.bg,
                      color: colors.fg,
                    }}
                  >
                    <item.icon className="h-3 w-3" />
                  </span>
                  {isOpen && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Projects section */}
        {isOpen && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setProjectsExpanded((p) => !p)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold uppercase tracking-widest hover:text-sidebar-foreground"
              style={{ color: "var(--text-muted)" }}
            >
              {projectsExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Projects
            </button>
            {projectsExpanded && (
              <ul className="mt-1 max-h-64 space-y-0.5 overflow-y-auto">
                {projects.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/project/${p.slug}/roadmap`}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center gap-2 truncate rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        pathname.includes(`/project/${p.slug}`)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <span className="truncate">{p.name}</span>
                      {p.hasActiveSession && (
                        <span
                          className="ml-auto h-2 w-2 shrink-0 rounded-full pulse-dot"
                          style={{ background: "var(--accent-emerald)" }}
                        />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div
        className="flex items-center justify-between p-3"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div className="flex items-center gap-1">
          <RefreshButton />
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 transition-colors hover:bg-sidebar-accent"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {isOpen && (
              <span className="text-sm">
                {theme === "dark" ? "Light" : "Dark"}
              </span>
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-sidebar-accent"
          style={{ color: "var(--text-secondary)" }}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        data-testid="app-sidebar"
        className={cn(
          "hidden lg:flex flex-col bg-sidebar transition-[width] duration-200",
          "border-r border-sidebar-border",
          isOpen ? "w-60" : "w-12",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <>
          <div
            data-testid="sidebar-overlay"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={closeMobile}
          />
          <aside
            data-testid="mobile-sidebar"
            className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-sidebar-border bg-sidebar lg:hidden"
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
