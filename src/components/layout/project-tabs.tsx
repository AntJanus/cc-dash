"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ProjectTabsProps {
  slug: string;
}

const TABS = [
  { label: "Roadmap", segment: "roadmap" },
  { label: "Session", segment: "session" },
];

export function ProjectTabs({ slug }: ProjectTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-6 border-b">
      {TABS.map((tab) => {
        const href = `/project/${slug}/${tab.segment}`;
        const isActive = pathname === href || pathname.startsWith(href + "/");

        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              "border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
