export type TextObjectKind = "i" | "a";

export type TextObjectRange = {
  startAbs: number;
  endAbs: number;
};

export type WordTextObjectClass = "word" | "WORD";

function normalizeCount(count: number): number {
  if (!Number.isFinite(count) || count < 1) return 1;
  return Math.floor(count);
}

function clampCursorCol(line: string, cursorCol: number): number {
  if (line.length === 0) return 0;
  if (!Number.isFinite(cursorCol)) return 0;

  const normalized = Math.trunc(cursorCol);
  return Math.max(0, Math.min(normalized, line.length - 1));
}

function findLogicalLineBounds(line: string, cursorCol: number): { start: number; end: number } {
  if (line.length === 0) return { start: 0, end: 0 };

  const previousSearchStart = line[cursorCol] === "\n" ? cursorCol - 1 : cursorCol;
  const start = line.lastIndexOf("\n", previousSearchStart) + 1;
  const nextNewline = line.indexOf("\n", cursorCol);

  return {
    start,
    end: nextNewline === -1 ? line.length : nextNewline,
  };
}

function isWordTextObjectChar(ch: string | undefined, semanticClass: WordTextObjectClass): boolean {
  if (ch === undefined) return false;
  if (semanticClass === "WORD") return !/\s/.test(ch);
  return /\w/.test(ch);
}

function isWhitespace(ch: string | undefined): boolean {
  return ch !== undefined && /\s/.test(ch);
}

export function resolveWordTextObjectRange(
  line: string,
  lineStartAbs: number,
  cursorCol: number,
  kind: TextObjectKind,
  count: number = 1,
  semanticClass: WordTextObjectClass = "word",
): TextObjectRange | null {
  if (line.length === 0) return null;

  const cursor = clampCursorCol(line, cursorCol);
  const bounds = findLogicalLineBounds(line, cursor);
  if (bounds.start >= bounds.end) return null;

  const hasWordChar = (idx: number) => (
    idx >= bounds.start
    && idx < bounds.end
    && isWordTextObjectChar(line[idx], semanticClass)
  );

  let col = Math.max(bounds.start, Math.min(cursor, bounds.end - 1));

  if (!hasWordChar(col)) {
    let right = col;
    while (right < bounds.end && !hasWordChar(right)) right++;

    if (right < bounds.end) {
      col = right;
    } else {
      let left = Math.min(col, bounds.end - 1);
      while (left >= bounds.start && !hasWordChar(left)) left--;
      if (left < bounds.start) return null;
      col = left;
    }
  }

  let start = col;
  while (start > bounds.start && hasWordChar(start - 1)) start--;

  let end = col + 1;
  while (end < bounds.end && hasWordChar(end)) end++;

  let remaining = normalizeCount(count) - 1;
  while (remaining > 0) {
    let nextWordStart = end;
    while (nextWordStart < bounds.end && !hasWordChar(nextWordStart)) nextWordStart++;
    if (nextWordStart >= bounds.end) break;

    let nextWordEnd = nextWordStart + 1;
    while (nextWordEnd < bounds.end && hasWordChar(nextWordEnd)) nextWordEnd++;

    end = nextWordEnd;
    remaining--;
  }

  if (kind === "a") {
    let aroundEnd = end;
    while (aroundEnd < bounds.end && isWhitespace(line[aroundEnd])) aroundEnd++;

    if (aroundEnd > end) {
      end = aroundEnd;
    } else {
      while (start > bounds.start && isWhitespace(line[start - 1])) start--;
    }
  }

  return {
    startAbs: lineStartAbs + start,
    endAbs: lineStartAbs + end,
  };
}
