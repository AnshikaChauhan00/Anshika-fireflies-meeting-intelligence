"use client";

import { Sparkles } from "lucide-react";
import { useSummaryQuery } from "@/hooks/useMeetings";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";

export function SummaryPanel({ meetingId }: { meetingId: number }) {
  const { data: summary, isLoading, isError } = useSummaryQuery(meetingId);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-600" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Overview</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      ) : isError || !summary ? (
        <EmptyState
          icon={Sparkles}
          title="No summary available yet."
          description="A summary will appear once a transcript has been added."
          className="border-none py-4"
        />
      ) : (
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{summary.overview}</p>
      )}
    </div>
  );
}
