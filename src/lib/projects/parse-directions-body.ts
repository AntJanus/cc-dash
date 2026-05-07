/**
 * Lightweight markdown parser for the body of a TODAYS_DIRECTIONS.md file.
 *
 * Output is a flat block list the panel can render directly. Scope is
 * intentionally tiny: headings, bullet lists, fenced code blocks, and
 * loose paragraphs. QA checkbox ref lines are dropped because the panel
 * renders them separately as interactive checkboxes.
 *
 * No external markdown dependency — this avoids dragging react-markdown
 * (and its remark/rehype tail) in for a file shape we control.
 */

export type DirectionsBodyBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "code"; lang: string; lines: string[] }
  | { kind: "para"; text: string };

const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const BULLET_RE = /^\s*[-*]\s+(.+)$/;
const FENCE_RE = /^```([\w-]*)\s*$/;
const QA_REF_RE = /<!--\s*ref:q_[a-z0-9]{5}\s+slug:[^\s-]+/;

export function parseDirectionsBody(body: string): DirectionsBodyBlock[] {
  const lines = body.split(/\r?\n/);
  const blocks: DirectionsBodyBlock[] = [];

  let pendingList: string[] | null = null;
  let pendingPara: string[] | null = null;

  function flushList() {
    if (pendingList && pendingList.length > 0) {
      blocks.push({ kind: "list", items: pendingList });
    }
    pendingList = null;
  }
  function flushPara() {
    if (pendingPara && pendingPara.length > 0) {
      blocks.push({ kind: "para", text: pendingPara.join(" ") });
    }
    pendingPara = null;
  }
  function flushAll() {
    flushList();
    flushPara();
  }

  let index = 0;
  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trimEnd();

    const fenceMatch = line.match(FENCE_RE);
    if (fenceMatch) {
      flushAll();
      const lang = fenceMatch[1] ?? "";
      const inner: string[] = [];
      index++;
      while (index < lines.length && !FENCE_RE.test(lines[index].trimEnd())) {
        inner.push(lines[index]);
        index++;
      }
      blocks.push({ kind: "code", lang, lines: inner });
      index++;
      continue;
    }

    if (line.trim() === "") {
      flushAll();
      index++;
      continue;
    }

    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      flushAll();
      blocks.push({
        kind: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      index++;
      continue;
    }

    const bulletMatch = line.match(BULLET_RE);
    if (bulletMatch) {
      const text = bulletMatch[1];
      if (QA_REF_RE.test(text)) {
        flushAll();
        index++;
        continue;
      }
      flushPara();
      if (!pendingList) pendingList = [];
      pendingList.push(text.trim());
      index++;
      continue;
    }

    flushList();
    if (!pendingPara) pendingPara = [];
    pendingPara.push(line.trim());
    index++;
  }

  flushAll();
  return blocks;
}
