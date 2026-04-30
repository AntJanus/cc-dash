"use client";

import { useState } from "react";
import { StickyNote } from "@/components/ui/sticky-note";
import { FolderTab, FolderTabs } from "@/components/ui/folder-tab";
import { StatusDot } from "@/components/ui/status-dot";
import { AgentChip } from "@/components/ui/agent-chip";
import { Connector } from "@/components/ui/connector";
import { ThemeSwatchPicker } from "@/components/ui/theme-swatch";
import { ToolTracePanel } from "@/components/ui/tool-trace";

const COLOR_TOKENS = [
  { name: "--bg-app", label: "App background" },
  { name: "--bg-paper", label: "Paper" },
  { name: "--bg-paper-2", label: "Paper 2" },
  { name: "--bg-canvas", label: "Canvas" },
  { name: "--ink-strong", label: "Ink strong" },
  { name: "--ink", label: "Ink" },
  { name: "--ink-soft", label: "Ink soft" },
  { name: "--border", label: "Border" },
  { name: "--sidebar", label: "Sidebar" },
  { name: "--sidebar-2", label: "Sidebar 2" },
];

const ACCENT_TOKENS = [
  { name: "--accent-gold", label: "Gold" },
  { name: "--accent-moss", label: "Moss" },
  { name: "--accent-clay", label: "Clay" },
  { name: "--accent-sky", label: "Sky" },
  { name: "--accent-plum", label: "Plum" },
];

const NOTE_TOKENS = [
  { name: "--note-sage", label: "Sage" },
  { name: "--note-butter", label: "Butter" },
  { name: "--note-blush", label: "Blush" },
  { name: "--note-apricot", label: "Apricot" },
  { name: "--note-lavender", label: "Lavender" },
  { name: "--note-mist", label: "Mist" },
];

export default function StyleguidePage() {
  const [activeTab, setActiveTab] = useState("roadmap");
  const [theme, setTheme] = useState("sage");

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 reveal">
      <h1
        className="font-display text-5xl mb-2"
        style={{ color: "var(--ink-strong)" }}
      >
        Cozy Style Guide
      </h1>
      <p className="text-base mb-10" style={{ color: "var(--ink-soft)" }}>
        Living reference for the cozy/almanac UI primitives. See{" "}
        <code className="font-mono text-sm">
          .planning/research/COZY_UX_SYNTHESIS.md
        </code>{" "}
        for the underlying design contract.
      </p>

      <Section title="Color tokens">
        <div className="mb-4">
          <h3 className="font-serif text-base mb-2 text-[var(--ink-soft)] uppercase tracking-widest">
            Surfaces
          </h3>
          <SwatchGrid swatches={COLOR_TOKENS} />
        </div>
        <div className="mb-4">
          <h3 className="font-serif text-base mb-2 text-[var(--ink-soft)] uppercase tracking-widest">
            Accents
          </h3>
          <SwatchGrid swatches={ACCENT_TOKENS} />
        </div>
        <div>
          <h3 className="font-serif text-base mb-2 text-[var(--ink-soft)] uppercase tracking-widest">
            Sticky note family
          </h3>
          <SwatchGrid swatches={NOTE_TOKENS} />
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--ink-soft)] mb-1">
              h1 — Cormorant Garamond display
            </div>
            <h1 className="font-display text-4xl">The quick fox jumps</h1>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--ink-soft)] mb-1">
              h2 — Fraunces UI serif
            </div>
            <h2 className="font-serif text-2xl">Section heading</h2>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--ink-soft)] mb-1">
              h3 — Fraunces UI serif
            </div>
            <h3 className="font-serif text-lg">Subsection</h3>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--ink-soft)] mb-1">
              body — Instrument Sans
            </div>
            <p className="text-base">
              The dashboard is a lens over markdown files. All state is on disk;
              this is the view.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--ink-soft)] mb-1">
              code — JetBrains Mono
            </div>
            <code className="font-mono text-sm bg-[var(--bg-paper-2)] px-2 py-1 rounded">
              cc-dash/roadmap@1
            </code>
          </div>
        </div>
      </Section>

      <Section title="Sticky note">
        <div className="grid grid-cols-3 gap-6">
          <StickyNote color="sage">Sage</StickyNote>
          <StickyNote color="butter">Butter</StickyNote>
          <StickyNote color="blush">Blush</StickyNote>
          <StickyNote color="apricot" tilt="left">
            Apricot, tilted left
          </StickyNote>
          <StickyNote color="lavender" decoration="pin">
            Lavender + pin
          </StickyNote>
          <StickyNote color="mist" decoration="tape">
            Mist + tape
          </StickyNote>
        </div>
      </Section>

      <Section title="Folder tabs">
        <div className="space-y-6">
          <FolderTabs>
            {["roadmap", "session", "ideas"].map((id) => (
              <FolderTab
                key={id}
                active={activeTab === id}
                onClick={() => setActiveTab(id)}
              >
                {id}
              </FolderTab>
            ))}
          </FolderTabs>
          <div className="paper-card p-4 -mt-1">
            <p>
              Tab content for <strong>{activeTab}</strong>.
            </p>
          </div>
          <FolderTabs variant="detached">
            <FolderTab active>Detached</FolderTab>
            <FolderTab>Inactive</FolderTab>
          </FolderTabs>
        </div>
      </Section>

      <Section title="Pills and tags">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="cottage-pill">cottage-pill</span>
          <span className="cottage-pill cottage-pill-accent">
            cottage-pill-accent
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="pill-tag">default</span>
          <span className="pill-tag pill-tag-gold">gold</span>
          <span className="pill-tag pill-tag-moss">moss</span>
          <span className="pill-tag pill-tag-clay">clay</span>
          <span className="pill-tag pill-tag-apricot">apricot</span>
          <span className="pill-tag pill-tag-sky">sky</span>
          <span className="pill-tag pill-tag-plum">plum</span>
        </div>
      </Section>

      <Section title="Status dot + agent chip">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Dots:</Label>
            <span className="flex items-center gap-2">
              <StatusDot state="running" /> running
            </span>
            <span className="flex items-center gap-2">
              <StatusDot state="draft" /> draft
            </span>
            <span className="flex items-center gap-2">
              <StatusDot state="blocked" /> blocked
            </span>
            <span className="flex items-center gap-2">
              <StatusDot state="idle" /> idle
            </span>
            <span className="flex items-center gap-2">
              <StatusDot state="archived" /> archived
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Label>Chips:</Label>
            <AgentChip name="Sage" state="running" />
            <AgentChip name="Moss" state="draft" />
            <AgentChip name="Archivist" state="idle" />
            <AgentChip name="Claude Opus" initials="CO" state="running" />
          </div>
        </div>
      </Section>

      <Section title="Connector">
        <div className="relative paper-card p-6" style={{ height: 200 }}>
          <span className="absolute" style={{ left: 30, top: 60 }}>
            <span className="cottage-pill">A</span>
          </span>
          <span className="absolute" style={{ right: 30, top: 60 }}>
            <span className="cottage-pill">B</span>
          </span>
          <Connector
            width={500}
            height={150}
            from={{ x: 70, y: 75 }}
            to={{ x: 430, y: 75 }}
            variant="dotted"
            arrowhead
            active
            style={{ left: 0, top: 25 }}
          />
        </div>
      </Section>

      <Section title="Theme swatch picker">
        <ThemeSwatchPicker
          options={[
            { id: "sage", color: "var(--note-sage)", label: "Sage" },
            { id: "butter", color: "var(--note-butter)", label: "Butter" },
            { id: "blush", color: "var(--note-blush)", label: "Blush" },
            { id: "apricot", color: "var(--note-apricot)", label: "Apricot" },
            {
              id: "lavender",
              color: "var(--note-lavender)",
              label: "Lavender",
            },
            { id: "mist", color: "var(--note-mist)", label: "Mist" },
          ]}
          value={theme}
          onChange={setTheme}
          size={56}
        />
      </Section>

      <Section title="Tool trace panel">
        <ToolTracePanel
          entries={[
            {
              id: "1",
              timestamp: "10:23:14",
              actor: "claude",
              action: "Read globals.css",
              state: "running",
            },
            {
              id: "2",
              timestamp: "10:23:18",
              actor: "claude",
              action: "Edit globals.css",
              output: "Replaced 3 declarations.",
              state: "draft",
            },
            {
              id: "3",
              timestamp: "10:23:24",
              actor: "build",
              action: "next build",
              state: "blocked",
            },
          ]}
        />
      </Section>

      <Section title="Motion utilities">
        <div className="flex flex-wrap gap-4">
          <button className="cottage-pill lift">.lift (hover me)</button>
          <button className="cottage-pill settle">.settle (click me)</button>
          <span className="cottage-pill pulse-soft">.pulse-soft</span>
          <span
            className="cottage-pill flutter"
            style={{ "--flutter-base": "-0.4deg" } as React.CSSProperties}
          >
            .flutter
          </span>
        </div>
      </Section>

      <Section title="Texture utilities">
        <div className="grid grid-cols-2 gap-4">
          <TextureSwatch label="tex-grain" className="tex-grain" />
          <TextureSwatch label="tex-grain-dense" className="tex-grain-dense" />
          <TextureSwatch label="tex-fibers" className="tex-fibers" />
          <TextureSwatch label="tex-dotgrid" className="tex-dotgrid" />
        </div>
      </Section>

      <Section title="Elevation recipes">
        <div className="grid grid-cols-2 gap-4">
          <ElevationSwatch label="--elevation-paper" recipe="paper" />
          <ElevationSwatch label="--elevation-pinned" recipe="pinned" />
          <ElevationSwatch label="--elevation-active" recipe="active" />
          <ElevationSwatch label="--elevation-floating" recipe="floating" />
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2
        className="font-serif text-2xl mb-4 pb-2"
        style={{
          color: "var(--ink-strong)",
          borderBottom: "1px dotted var(--border)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs uppercase tracking-widest text-[var(--ink-soft)] w-16">
      {children}
    </span>
  );
}

function SwatchGrid({
  swatches,
}: {
  swatches: { name: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {swatches.map((s) => (
        <div
          key={s.name}
          className="rounded-lg border border-[var(--border)] overflow-hidden"
        >
          <div className="h-12" style={{ background: `var(${s.name})` }} />
          <div className="px-2 py-1.5 text-xs">
            <div className="font-medium" style={{ color: "var(--ink-strong)" }}>
              {s.label}
            </div>
            <code className="font-mono text-[10px] text-[var(--ink-soft)]">
              {s.name}
            </code>
          </div>
        </div>
      ))}
    </div>
  );
}

function TextureSwatch({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div
      className="rounded-lg border border-[var(--border)] overflow-hidden"
      style={{ backgroundColor: "var(--bg-paper)" }}
    >
      <div className={`h-24 ${className}`} />
      <div className="px-2 py-1.5">
        <code className="font-mono text-xs" style={{ color: "var(--ink)" }}>
          .{label}
        </code>
      </div>
    </div>
  );
}

function ElevationSwatch({
  label,
  recipe,
}: {
  label: string;
  recipe: "paper" | "pinned" | "active" | "floating";
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "var(--bg-paper)",
        boxShadow: `var(--elevation-${recipe})`,
        border: "1px solid var(--border)",
      }}
    >
      <code
        className="font-mono text-xs"
        style={{ color: "var(--ink-strong)" }}
      >
        {label}
      </code>
    </div>
  );
}
