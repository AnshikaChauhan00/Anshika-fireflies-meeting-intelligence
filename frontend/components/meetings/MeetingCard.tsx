"use client";

import Link from "next/link";
import { useState } from "react";
import { Calendar, Clock, ListChecks, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { AvatarStack } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import type { MeetingSummaryCard } from "@/types";
import { formatDuration, formatMeetingDate } from "@/lib/utils";

interface MeetingCardProps {
  meeting: MeetingSummaryCard;
  onEdit: (meeting: MeetingSummaryCard) => void;
  onDelete: (meeting: MeetingSummaryCard) => void;
}

export function MeetingCard({ meeting, onEdit, onDelete }: MeetingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-card transition-shadow hover:shadow-popover dark:border-gray-800 dark:bg-gray-900">
      <Link href={`/meetings/${meeting.id}`} className="absolute inset-0 rounded-xl focus-ring" aria-label={meeting.title} />

      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-gray-50">{meeting.title}</h3>
        <div className="relative z-10 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setMenuOpen((prev) => !prev);
            }}
            aria-label="Meeting actions"
            aria-haspopup="menu"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 focus-ring dark:hover:bg-gray-800"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-popover dark:border-gray-700 dark:bg-gray-800"
              >
                <button
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit(meeting);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(meeting);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> {formatMeetingDate(meeting.meeting_date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {formatDuration(meeting.duration_seconds)}
        </span>
        {meeting.action_item_count > 0 && (
          <span className="flex items-center gap-1">
            <ListChecks className="h-3.5 w-3.5" /> {meeting.action_item_count} action items
          </span>
        )}
      </div>

      {meeting.description && (
        <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{meeting.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarStack names={meeting.participants.map((p) => p.name)} />
          {meeting.participants.length > 0 && (
            <span className="text-xs text-gray-400">
              {meeting.participants.length} participant{meeting.participants.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {meeting.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {meeting.tags.map((tag) => (
            <Badge key={tag.id} variant="brand">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
