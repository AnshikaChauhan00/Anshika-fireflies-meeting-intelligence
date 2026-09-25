"use client";

import { useMemo } from "react";
import type { TranscriptSegment } from "@/types";

/**
 * Maps the current player time to the transcript segment it falls within,
 * mirroring the rule from the spec: the active segment is the one where
 * `start_time <= current_time <= end_time`. Falls back to the last segment
 * whose start_time has already passed, so the highlight doesn't disappear
 * during the small gaps between segments.
 */
export function useActiveSegment(
  segments: TranscriptSegment[] | undefined,
  currentTime: number
): TranscriptSegment | null {
  return useMemo(() => {
    if (!segments || segments.length === 0) return null;

    const withinRange = segments.find(
      (segment) => currentTime >= segment.start_time && currentTime <= segment.end_time
    );
    if (withinRange) return withinRange;

    let fallback: TranscriptSegment | null = null;
    for (const segment of segments) {
      if (segment.start_time <= currentTime) {
        fallback = segment;
      } else {
        break;
      }
    }
    return fallback;
  }, [segments, currentTime]);
}
