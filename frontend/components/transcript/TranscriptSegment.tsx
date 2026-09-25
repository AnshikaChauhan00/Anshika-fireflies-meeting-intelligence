"use client";

import { forwardRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { CommentThread } from "@/components/transcript/CommentThread";
import { cn, formatTimestamp } from "@/lib/utils";
import { renderHighlightedText } from "@/lib/transcriptSearch";
import type { TranscriptComment, TranscriptSegment as TranscriptSegmentType } from "@/types";

interface TranscriptSegmentProps {
  meetingId: number;
  segment: TranscriptSegmentType;
  comments: TranscriptComment[];
  isActive: boolean;
  searchQuery: string;
  activeOccurrenceIndex: number | null;
  onSeek: (startTime: number) => void;
}

export const TranscriptSegmentRow = forwardRef<HTMLDivElement, TranscriptSegmentProps>(
  ({ meetingId, segment, comments, isActive, searchQuery, activeOccurrenceIndex, onSeek }, ref) => {
    const [threadOpen, setThreadOpen] = useState(false);
    const commentCount = comments.length;

    return (
      <div
        ref={ref}
        className={cn(
          "group rounded-lg transition-colors",
          isActive ? "bg-brand-50 dark:bg-brand-900/30" : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
        )}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSeek(segment.start_time)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSeek(segment.start_time);
            }
          }}
          aria-current={isActive ? "true" : undefined}
          className="flex cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-left focus-ring"
        >
          <Avatar name={segment.speaker_name} size={30} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-sm font-semibold",
                  isActive ? "text-brand-700 dark:text-brand-300" : "text-gray-800 dark:text-gray-100"
                )}
              >
                {segment.speaker_name}
              </span>
              <span className="font-mono text-xs text-gray-400">{formatTimestamp(segment.start_time)}</span>
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {renderHighlightedText(segment.text, searchQuery, activeOccurrenceIndex)}
            </p>
          </div>
        </div>

        <div className="pb-1.5 pl-[54px] pr-3">
          <button
            type="button"
            onClick={() => setThreadOpen((open) => !open)}
            aria-expanded={threadOpen}
            aria-label={
              commentCount > 0
                ? `${commentCount} comment${commentCount === 1 ? "" : "s"} on this line`
                : "Add a comment on this line"
            }
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-opacity focus-ring",
              commentCount > 0
                ? "text-brand-600 hover:bg-brand-100 dark:text-brand-300 dark:hover:bg-brand-900/50"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
              threadOpen && "sm:opacity-100"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            {commentCount > 0 ? commentCount : "Comment"}
          </button>
        </div>

        {threadOpen && <CommentThread meetingId={meetingId} segmentId={segment.id} comments={comments} />}
      </div>
    );
  }
);

TranscriptSegmentRow.displayName = "TranscriptSegmentRow";
