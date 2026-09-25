"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Clock, MoreVertical, Pencil, Trash2, Users } from "lucide-react";
import { useMeetingQuery, useDeleteMeeting } from "@/hooks/useMeetings";
import { useMediaPlayer } from "@/hooks/useMediaPlayer";
import { useToast } from "@/hooks/useToast";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { TranscriptPanel } from "@/components/transcript/TranscriptPanel";
import { SummaryPanel } from "@/components/summary/SummaryPanel";
import { TopicList } from "@/components/summary/TopicList";
import { ActionItems } from "@/components/summary/ActionItems";
import { AskMeetingPanel } from "@/components/chat/AskMeetingPanel";
import { EditMeetingModal } from "@/components/meetings/EditMeetingModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AvatarStack } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { cn, formatDuration, formatMeetingDateTime } from "@/lib/utils";

type SideTab = "notes" | "ask";

const SIDE_TABS: { value: SideTab; label: string }[] = [
  { value: "notes", label: "Notes" },
  { value: "ask", label: "Ask about this meeting" },
];

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const meetingId = Number(params.id);
  const router = useRouter();
  const toast = useToast();

  const { data: meeting, isLoading, isError } = useMeetingQuery(meetingId);
  const deleteMeeting = useDeleteMeeting();

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sideTab, setSideTab] = useState<SideTab>("notes");

  const player = useMediaPlayer(meeting?.duration_seconds ?? 0);

  async function handleDeleteConfirmed() {
    try {
      await deleteMeeting.mutateAsync(meetingId);
      toast.success("Meeting deleted successfully.");
      router.push("/meetings");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeleteOpen(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !meeting) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={Calendar}
          title="Meeting not found"
          description="This meeting may have been deleted or the link is incorrect."
          action={
            <button
              type="button"
              onClick={() => router.push("/meetings")}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Back to meetings
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-gray-50">{meeting.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {formatMeetingDateTime(meeting.meeting_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {formatDuration(meeting.duration_seconds)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {meeting.participants.length} participants
            </span>
          </div>
          {meeting.description && (
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">{meeting.description}</p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <AvatarStack names={meeting.participants.map((p) => p.name)} max={6} />
            {meeting.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {meeting.tags.map((tag) => (
                  <Badge key={tag.id} variant="brand">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="More actions"
            aria-haspopup="menu"
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 focus-ring dark:border-gray-800 dark:hover:bg-gray-800"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-popover dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit meeting
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete meeting
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-5">
        <AudioPlayer
          currentTime={player.currentTime}
          duration={meeting.duration_seconds}
          isPlaying={player.isPlaying}
          volume={player.volume}
          onToggle={player.toggle}
          onSeek={player.seek}
          onSkip={player.skip}
          onVolumeChange={player.setVolume}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="h-[600px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
          <TranscriptPanel meetingId={meetingId} currentTime={player.currentTime} onSeek={player.seek} />
        </div>

        <div className="space-y-4">
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800" role="tablist" aria-label="Meeting side panel">
            {SIDE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                id={`side-tab-${tab.value}`}
                aria-selected={sideTab === tab.value}
                aria-controls="side-panel"
                onClick={() => setSideTab(tab.value)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-ring",
                  sideTab === tab.value
                    ? "bg-white text-gray-900 shadow-card dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div id="side-panel" role="tabpanel" aria-labelledby={`side-tab-${sideTab}`} className="space-y-5">
            {sideTab === "notes" ? (
              <>
                <SummaryPanel meetingId={meetingId} />
                <TopicList meetingId={meetingId} onSeek={player.seek} />
                <ActionItems meetingId={meetingId} />
              </>
            ) : (
              <AskMeetingPanel meetingId={meetingId} onSeek={player.seek} />
            )}
          </div>
        </div>
      </div>

      <EditMeetingModal meeting={editOpen ? meeting : null} onClose={() => setEditOpen(false)} />
      <ConfirmDialog
        isOpen={deleteOpen}
        title="Delete this meeting?"
        message="All transcript, summary and action item data associated with this meeting will also be removed."
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteMeeting.isPending}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
