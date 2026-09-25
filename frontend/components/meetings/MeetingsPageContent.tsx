"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMeetingsQuery, useDeleteMeeting } from "@/hooks/useMeetings";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { MeetingFilters } from "@/components/meetings/MeetingFilters";
import { MeetingList } from "@/components/meetings/MeetingList";
import { EditMeetingModal } from "@/components/meetings/EditMeetingModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/common/Badge";
import { applyDateRangeFilter, type DateRangeFilter } from "@/lib/meetingFilters";
import type { MeetingSummaryCard } from "@/types";

const PAGE_SIZE = 9;

export function MeetingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTag = searchParams.get("tag");

  const [search, setSearch] = useState("");
  const [range, setRange] = useState<DateRangeFilter>("all");
  const [sort, setSort] = useState<"recent" | "oldest" | "duration">("recent");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useMeetingsQuery({
    search: debouncedSearch || undefined,
    tag: activeTag || undefined,
    sort,
    page,
    page_size: PAGE_SIZE,
  });
  const deleteMeeting = useDeleteMeeting();
  const toast = useToast();

  const [editingMeeting, setEditingMeeting] = useState<MeetingSummaryCard | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<MeetingSummaryCard | null>(null);

  const meetings = applyDateRangeFilter(data?.items ?? [], range);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

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
      <div className="mb-5 space-y-3">
        <MeetingFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          range={range}
          onRangeChange={setRange}
          sort={sort}
          onSortChange={setSort}
        />
        {activeTag && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            Filtering by tag:
            <Badge variant="brand" className="gap-1">
              {activeTag}
              <button
                type="button"
                onClick={() => router.push("/meetings")}
                aria-label="Clear tag filter"
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}
      </div>

      <MeetingList
        meetings={meetings}
        isLoading={isLoading}
        hasActiveFilters={!!search || range !== "all" || !!activeTag}
        onEdit={setEditingMeeting}
        onDelete={setDeletingMeeting}
      />

      {data && data.total > PAGE_SIZE && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

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
