"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { useCommentsQuery } from "@/hooks/useComments";
import { useTranscriptQuery, useMeetingQuery } from "@/hooks/useMeetings";
import { useActiveSegment } from "@/hooks/useTranscriptSync";
import { TranscriptSegmentRow } from "@/components/transcript/TranscriptSegment";
import { TranscriptSearch } from "@/components/transcript/TranscriptSearch";
import { TranscriptSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { findTranscriptMatches } from "@/lib/transcriptSearch";
import { exportToMarkdown, exportToPDF } from "@/lib/exportUtils";
import type { TranscriptComment } from "@/types";

interface TranscriptPanelProps {
  meetingId: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

export function TranscriptPanel({ meetingId, currentTime, onSeek }: TranscriptPanelProps) {
  const { data: meeting } = useMeetingQuery(meetingId);
  const { data: segments, isLoading } = useTranscriptQuery(meetingId);
  const { data: comments } = useCommentsQuery(meetingId);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchGlobalIndex, setActiveMatchGlobalIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const activeSegment = useActiveSegment(segments, currentTime);
  const commentsBySegment = useMemo(() => {
    const grouped = new Map<number, TranscriptComment[]>();
    for (const comment of comments ?? []) {
      grouped.set(comment.segment_id, [...(grouped.get(comment.segment_id) ?? []), comment]);
    }
    return grouped;
  }, [comments]);

  const matches = useMemo(
    () => findTranscriptMatches(segments ?? [], searchQuery),
    [segments, searchQuery]
  );

  useEffect(() => {
    setActiveMatchGlobalIndex(0);
  }, [searchQuery]);

  // Auto-scroll to the segment that matches current playback time.
  useEffect(() => {
    if (!activeSegment || searchQuery.trim()) return;
    const node = segmentRefs.current.get(activeSegment.id);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSegment, searchQuery]);

  // Scroll to the active search match.
  useEffect(() => {
    if (!searchQuery.trim() || matches.length === 0) return;
    const match = matches[activeMatchGlobalIndex];
    if (!match) return;
    const node = segmentRefs.current.get(match.segmentId);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeMatchGlobalIndex, matches, searchQuery]);

  function goToNextMatch() {
    if (matches.length === 0) return;
    setActiveMatchGlobalIndex((prev) => (prev + 1) % matches.length);
  }

  function goToPreviousMatch() {
    if (matches.length === 0) return;
    setActiveMatchGlobalIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }

  const activeMatch = matches[activeMatchGlobalIndex];

  return (
    <div className="flex h-full flex-col">
      <TranscriptSearch
        query={searchQuery}
        onQueryChange={setSearchQuery}
        matchCount={matches.length}
        activeMatchNumber={matches.length > 0 ? activeMatchGlobalIndex + 1 : 0}
        onNext={goToNextMatch}
        onPrevious={goToPreviousMatch}
        onExportMarkdown={segments && segments.length > 0 ? () => exportToMarkdown(segments, meeting?.title) : undefined}
        onExportPDF={segments && segments.length > 0 ? () => exportToPDF(segments, meeting?.title) : undefined}
      />

      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <TranscriptSkeleton />
        ) : !segments || segments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No transcript available."
            description="Upload or paste a transcript for this meeting to see it here."
            className="mx-3 my-4 border-none"
          />
        ) : (
          <div className="space-y-0.5 p-2">
            {segments.map((segment) => (
              <TranscriptSegmentRow
                key={segment.id}
                ref={(node) => {
                  if (node) segmentRefs.current.set(segment.id, node);
                  else segmentRefs.current.delete(segment.id);
                }}
                meetingId={meetingId}
                segment={segment}
                comments={commentsBySegment.get(segment.id) ?? []}
                isActive={activeSegment?.id === segment.id}
                onSeek={onSeek}
                searchQuery={searchQuery}
                activeOccurrenceIndex={
                  activeMatch && activeMatch.segmentId === segment.id
                    ? activeMatch.occurrenceIndexInSegment
                    : null
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
