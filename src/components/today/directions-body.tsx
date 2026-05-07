import {
  parseDirectionsBody,
  type DirectionsBodyBlock,
} from "@/lib/projects/parse-directions-body";

interface DirectionsBodyProps {
  body: string;
}

export function DirectionsBody({ body }: DirectionsBodyProps) {
  const blocks = parseDirectionsBody(body);
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <BlockRenderer key={index} block={block} />
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: DirectionsBodyBlock }) {
  switch (block.kind) {
    case "heading":
      return <Heading level={block.level} text={block.text} />;
    case "list":
      return (
        <ul
          className="list-disc pl-5 space-y-1 text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          {block.items.map((item, index) => (
            <li key={index}>
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );
    case "code":
      return <CodeBlock lang={block.lang} lines={block.lines} />;
    case "para":
      return (
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--text-primary)" }}
        >
          <InlineText text={block.text} />
        </p>
      );
  }
}

function Heading({ level, text }: { level: number; text: string }) {
  // Top-level # already appears in the panel header; render h2/h3/h4 visually.
  if (level <= 1) {
    return (
      <h3
        className="text-base font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {text}
      </h3>
    );
  }
  if (level === 2) {
    return (
      <h3
        className="text-sm font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        {text}
      </h3>
    );
  }
  return (
    <h4
      className="text-sm font-semibold"
      style={{ color: "var(--text-primary)" }}
    >
      {text}
    </h4>
  );
}

function CodeBlock({ lang, lines }: { lang: string; lines: string[] }) {
  return (
    <pre
      className="overflow-x-auto rounded-md p-3 text-sm leading-relaxed"
      style={{
        background: "var(--bg-subtle, var(--bg-card))",
        border: "1px solid var(--border-light)",
        color: "var(--text-primary)",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
      data-lang={lang || undefined}
    >
      {lines.join("\n")}
    </pre>
  );
}

const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`)/g;

function InlineText({ text }: { text: string }) {
  const segments = text.split(INLINE_RE);
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.startsWith("**") && segment.endsWith("**")) {
          return <strong key={index}>{segment.slice(2, -2)}</strong>;
        }
        if (segment.startsWith("`") && segment.endsWith("`")) {
          return (
            <code
              key={index}
              className="rounded px-1 text-sm"
              style={{
                background: "var(--bg-subtle, var(--bg-card))",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            >
              {segment.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{segment}</span>;
      })}
    </>
  );
}
