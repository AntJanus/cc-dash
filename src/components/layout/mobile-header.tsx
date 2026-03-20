"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "./sidebar-context";

export function MobileHeader() {
  const { openMobile } = useSidebar();

  return (
    <header className="flex h-14 items-center border-b px-4 lg:hidden">
      <button
        type="button"
        onClick={openMobile}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="mx-auto text-sm font-semibold">cc-dash</span>
      {/* Spacer to center the text */}
      <div className="w-8" />
    </header>
  );
}
