export type DiffLine = {
  type: "add" | "remove" | "context";
  text: string;
  oldNumber: number | null;
  newNumber: number | null;
};

export type DiffResult = {
  lines: DiffLine[];
  additions: number;
  deletions: number;
};

/**
 * Line-based diff using a Myers-style LCS table. README files are small, so the
 * quadratic table is fine and keeps the output stable and easy to read.
 */
export function diffLines(oldText: string, newText: string): DiffResult {
  const a = oldText.length ? oldText.replace(/\r\n/g, "\n").split("\n") : [];
  const b = newText.length ? newText.replace(/\r\n/g, "\n").split("\n") : [];

  const lcs: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] =
        a[i] === b[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let additions = 0;
  let deletions = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push({
        type: "context",
        text: a[i],
        oldNumber: i + 1,
        newNumber: j + 1,
      });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      lines.push({
        type: "remove",
        text: a[i],
        oldNumber: i + 1,
        newNumber: null,
      });
      deletions++;
      i++;
    } else {
      lines.push({ type: "add", text: b[j], oldNumber: null, newNumber: j + 1 });
      additions++;
      j++;
    }
  }
  while (i < a.length) {
    lines.push({ type: "remove", text: a[i], oldNumber: i + 1, newNumber: null });
    deletions++;
    i++;
  }
  while (j < b.length) {
    lines.push({ type: "add", text: b[j], oldNumber: null, newNumber: j + 1 });
    additions++;
    j++;
  }

  return { lines, additions, deletions };
}

/** Collapse long runs of unchanged lines into hunks with a few lines of context. */
export function collapseContext(
  lines: DiffLine[],
  context = 3
): (DiffLine | { type: "skip"; count: number })[] {
  const keep = new Set<number>();
  lines.forEach((line, index) => {
    if (line.type === "context") return;
    for (
      let k = Math.max(0, index - context);
      k <= Math.min(lines.length - 1, index + context);
      k++
    ) {
      keep.add(k);
    }
  });

  const output: (DiffLine | { type: "skip"; count: number })[] = [];
  let skipped = 0;
  lines.forEach((line, index) => {
    if (keep.has(index)) {
      if (skipped) {
        output.push({ type: "skip", count: skipped });
        skipped = 0;
      }
      output.push(line);
    } else {
      skipped++;
    }
  });
  if (skipped) output.push({ type: "skip", count: skipped });
  return output;
}
