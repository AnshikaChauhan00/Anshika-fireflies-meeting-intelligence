"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, FileText, Search, Video } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { searchService } from "@/services/searchService";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { formatMeetingDate } from "@/lib/utils";

export function GlobalSearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(initialQuery);

  const { data, isLoading, isFetched } = useQuery({
    queryKey: queryKeys.globalSearch(initialQuery),
    queryFn: () => searchService.globalSearch(initialQuery),
    enabled: initialQuery.trim().length > 0,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inputValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  }

  const hasAnyResults =
    data && (data.meetings.length > 0 || data.transcript_matches.length > 0 || data.action_items.length > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <form onSubmit={handleSubmit} className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search meeting titles, participants, transcripts, and action items…"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm focus-ring focus:border-brand-400 dark:border-gray-800 dark:bg-gray-900"
        />
      </form>

      {!initialQuery.trim() ? (
        <EmptyState icon={Search} title="Search across your workspace" description="Try a keyword like a meeting title, participant name, or something someone said." />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isFetched && !hasAnyResults ? (
        <EmptyState icon={Search} title="No matches found." description={`Nothing matched "${initialQuery}".`} />
      ) : (
        <div className="space-y-6">
          {data && data.meetings.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <Video className="h-4 w-4 text-brand-600" /> Meetings
              </h2>
              <div className="space-y-1.5">
                {data.meetings.map((meeting) => (
                  <button
                    key={meeting.id}
                    onClick={() => router.push(`/meetings/${meeting.id}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm hover:border-brand-300 hover:bg-brand-50/50 focus-ring dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-100">{meeting.title}</span>
                    <span className="text-xs text-gray-400">{formatMeetingDate(meeting.meeting_date)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {data && data.transcript_matches.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <FileText className="h-4 w-4 text-brand-600" /> Transcript Matches
              </h2>
              <div className="space-y-1.5">
                {data.transcript_matches.map((match) => (
                  <button
                    key={match.segment_id}
                    onClick={() => router.push(`/meetings/${match.meeting_id}`)}
                    className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-brand-300 hover:bg-brand-50/50 focus-ring dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{match.meeting_title}</span>
                      <span>{match.speaker_name}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-700 dark:text-gray-200">{match.text}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {data && data.action_items.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <CheckSquare className="h-4 w-4 text-brand-600" /> Action Items
              </h2>
              <div className="space-y-1.5">
                {data.action_items.map((item) => (
                  <button
                    key={item.action_item_id}
                    onClick={() => router.push(`/meetings/${item.meeting_id}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm hover:border-brand-300 hover:bg-brand-50/50 focus-ring dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    <span className="text-gray-800 dark:text-gray-100">{item.title}</span>
                    <span className="text-xs text-gray-400">{item.meeting_title}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
