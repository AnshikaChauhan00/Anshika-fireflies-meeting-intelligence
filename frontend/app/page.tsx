"use client";

import Link from "next/link";
import { ArrowRight, Video } from "lucide-react";
import { useMeetingsQuery } from "@/hooks/useMeetings";
import { MeetingList } from "@/components/meetings/MeetingList";
import { EditMeetingModal } from "@/components/meetings/EditMeetingModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useDeleteMeeting } from "@/hooks/useMeetings";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { userService } from "@/services/searchService";
import type { MeetingSummaryCard } from "@/types";

export default function HomePage() {
  const { data, isLoading } = useMeetingsQuery({ sort: "recent", page: 1, page_size: 6 });
  const { data: currentUser } = useQuery({ queryKey: queryKeys.currentUser(), queryFn: userService.me });
  const deleteMeeting = useDeleteMeeting();
  const toast = useToast();

  const [editingMeeting, setEditingMeeting] = useState<MeetingSummaryCard | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<MeetingSummaryCard | null>(null);

  const firstName = currentUser?.name?.split(" ")[0] ?? "there";

  async function handleDeleteConfirmed() {
    if (!deletingMeeting) return;
    try {
      await deleteMeeting.mutateAsync(deletingMeeting.id);
      toast.success("Meeting deleted successfully.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeletingMeeting(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here&apos;s what&apos;s been happening across your recent meetings.
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <Video className="h-4 w-4 text-brand-600" /> Recent Meetings
        </h2>
        <Link
          href="/meetings"
          className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <MeetingList
        meetings={data?.items ?? []}
        isLoading={isLoading}
        hasActiveFilters={false}
        onEdit={setEditingMeeting}
        onDelete={setDeletingMeeting}
      />

      <EditMeetingModal meeting={editingMeeting} onClose={() => setEditingMeeting(null)} />
      <ConfirmDialog
        isOpen={!!deletingMeeting}
        title="Delete this meeting?"
        message="All transcript, summary and action item data associated with this meeting will also be removed."
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteMeeting.isPending}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeletingMeeting(null)}
      />
    </div>
  );
}
