"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  Activity,
  Settings,
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
  { href: "/", label: "All Projects", icon: LayoutDashboard },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({ projects }: AppSidebarProps) {
  const { isOpen, isMobileOpen, toggle, closeMobile } = useSidebar();
  const pathname = usePathname();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
    }
    return "light";
  });

  const activeSessionProjects = projects.filter((p) => p.hasActiveSession);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("cc-dash-theme", JSON.stringify(next));
    } catch {
      // ignore
    }
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
          className="text-lg font-semibold text-sidebar-foreground"
          onClick={closeMobile}
        >
          {isOpen ? "cc-dash" : "cc"}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {/* Personal section */}
        {isOpen && activeSessionProjects.length > 0 && (
          <div className="mb-3">
            <div className="px-3 py-1.5 text-sm font-semibold uppercase tracking-widest text-sidebar-foreground">
              Personal
            </div>
            <ul className="mt-1 space-y-0.5">
              {activeSessionProjects.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/project/${p.slug}/session`}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      pathname.includes(`/project/${p.slug}`)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  >
                    <Terminal className="h-3.5 w-3.5 shrink-0 text-[var(--status-active)]" />
                    <span className="truncate">{p.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation */}
        {isOpen && (
          <div className="px-3 py-1.5 text-sm font-semibold uppercase tracking-widest text-sidebar-foreground">
            Navigation
          </div>
        )}
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "border-l-2 border-primary bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
                title={!isOpen ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {isOpen && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>

        {/* Projects section */}
        {isOpen && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setProjectsExpanded((p) => !p)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm font-semibold uppercase tracking-widest text-sidebar-foreground hover:text-sidebar-foreground"
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
                        "flex items-center gap-2 truncate rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        pathname.includes(`/project/${p.slug}`)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <span className="truncate">{p.name}</span>
                      {p.hasActiveSession && (
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--status-active)]" />
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
      <div className="flex items-center justify-between border-t border-sidebar-border/50 p-3">
        <div className="flex items-center gap-1">
          <RefreshButton />
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
          className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
          "hidden lg:flex flex-col bg-sidebar shadow-[1px_0_4px_-2px_oklch(0.5_0.01_240/0.06)] transition-[width] duration-200",
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
