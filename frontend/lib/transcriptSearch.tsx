import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { TranscriptSegment } from "@/types";

export interface TranscriptMatch {
  segmentId: number;
  occurrenceIndexInSegment: number;
  globalIndex: number;
}

/** Finds every case-insensitive occurrence of `query` across all segments,
 * in transcript order, so prev/next navigation can walk through them. */
export function findTranscriptMatches(
  segments: TranscriptSegment[],
  query: string
): TranscriptMatch[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const lowerQuery = trimmed.toLowerCase();
  const matches: TranscriptMatch[] = [];
  let globalIndex = 0;

  for (const segment of segments) {
    const lowerText = segment.text.toLowerCase();
    let occurrence = 0;
    let fromIndex = 0;

    while (true) {
      const foundAt = lowerText.indexOf(lowerQuery, fromIndex);
      if (foundAt === -1) break;
      matches.push({ segmentId: segment.id, occurrenceIndexInSegment: occurrence, globalIndex });
      globalIndex += 1;
      occurrence += 1;
      fromIndex = foundAt + lowerQuery.length;
    }
  }

  return matches;
}

/** Renders `text` with every occurrence of `query` wrapped in <mark>,
 * marking the occurrence at `activeOccurrenceIndex` distinctly so the
 * currently-selected search result stands out from the rest. */
export function renderHighlightedText(
  text: string,
  query: string,
  activeOccurrenceIndex: number | null
): ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let occurrence = 0;
  let fromIndex = 0;

  while (true) {
    const foundAt = lowerText.indexOf(lowerQuery, fromIndex);
    if (foundAt === -1) break;

    if (foundAt > cursor) parts.push(text.slice(cursor, foundAt));

    parts.push(
      <mark
        key={foundAt}
        className={cn("search-highlight", occurrence === activeOccurrenceIndex && "active-match")}
      >
        {text.slice(foundAt, foundAt + trimmed.length)}
      </mark>
    );

    cursor = foundAt + trimmed.length;
    fromIndex = cursor;
    occurrence += 1;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
