"use client";

import { Video } from "lucide-react";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { MeetingCardSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import type { MeetingSummaryCard } from "@/types";

interface MeetingListProps {
  meetings: MeetingSummaryCard[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  onEdit: (meeting: MeetingSummaryCard) => void;
  onDelete: (meeting: MeetingSummaryCard) => void;
}

export function MeetingList({ meetings, isLoading, hasActiveFilters, onEdit, onDelete }: MeetingListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MeetingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <EmptyState
        icon={Video}
        title={hasActiveFilters ? "No meetings match your search." : "No meetings yet"}
        description={
          hasActiveFilters
            ? "Try a different search term or clear your filters."
            : "Create your first meeting to start building your transcript library."
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {meetings.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
