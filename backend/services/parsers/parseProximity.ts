import { ParsedLine, ParsedReceipt, TextractBlock, ParsedRow } from "../../types/receipt";

function extractLines(blocks: TextractBlock[]): ParsedLine[] {
  return (blocks || [])
    .filter(
      (b) =>
        b.BlockType === "LINE" &&
        !!b.Text &&
        !!b.Geometry &&
        !!b.Geometry.BoundingBox,
    )
    .map((b) => {
      const bb = b.Geometry!.BoundingBox!;
      return {
        id: b.Id,
        text: b.Text!.trim(),
        top: bb.Top,
        left: bb.Left,
        width: bb.Width,
        height: bb.Height,
        bottom: bb.Top + bb.Height,
        raw: b,
      } as ParsedLine;
    })
    .sort((a, b) => a.top - b.top || a.left - b.left);
}

function groupHorizontal(allLines: ParsedLine[]): ParsedRow[] {
  // Group lines by similar top coordinate (within half the max height in group) -> this will help to group by proximity
  const sorted = [...allLines].sort((a, b) => a.top - b.top || a.left - b.left);
  const groups = [];
  for (const line of sorted) {
    const range = line.height / 2;
    let placed = false;
    for (const g of groups) {
      const allowed = Math.max(g.maxHalfHeight, range);
      if (Math.abs(line.top - g.repTop) <= allowed) {
        g.lines.push(line);
        g.maxHalfHeight = Math.max(g.maxHalfHeight, range);
        g.repTop =
          (g.repTop * (g.lines.length - 1) + line.top) / g.lines.length;
        placed = true;
        break;
      }
    }
    if (!placed) {
      groups.push({ lines: [line], repTop: line.top, maxHalfHeight: range });
    }
  }
  return groups
    .map((g) => {
      const combined = g.lines
        .slice()
        .sort((a, b) => a.left - b.left)
        .map((l) => l.text)
        .join(" ");
      // const repTop = g.repTop;
      // const topFloored2 = Math.floor(repTop * 100) / 100;
      return {
        text: combined,
        // range: Number(g.maxHalfHeight.toFixed(6)),
        // top: topFloored2,
        // lineCount: g.lines.length,
        // original: g.lines.map(l=>({ id:l.id, text:l.text, top:l.top, left:l.left, width:l.width, height:l.height }))
      };
  });
}

export function parseProximity(blocks: TextractBlock[]): ParsedReceipt {
  const lines = extractLines(blocks || []);
  const rows = groupHorizontal(lines);
  return { rows };
}