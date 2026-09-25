"use client";

import { ListTree } from "lucide-react";
import { useTopicsQuery } from "@/hooks/useMeetings";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatTimestamp } from "@/lib/utils";

export function TopicList({ meetingId, onSeek }: { meetingId: number; onSeek: (time: number) => void }) {
  const { data: topics, isLoading } = useTopicsQuery(meetingId);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 flex items-center gap-2">
        <ListTree className="h-4 w-4 text-brand-600" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Key Topics & Chapters</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
      ) : !topics || topics.length === 0 ? (
        <EmptyState icon={ListTree} title="No topics identified yet." className="border-none py-4" />
      ) : (
        <ul className="space-y-1">
          {topics.map((topic) => (
            <li key={topic.id}>
              <button
                type="button"
                onClick={() => onSeek(topic.start_time)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-gray-50 focus-ring dark:hover:bg-gray-800"
              >
                <span className="shrink-0 font-mono text-xs text-brand-600 dark:text-brand-400">
                  {formatTimestamp(topic.start_time)}
                </span>
                <span className="text-gray-700 dark:text-gray-200">{topic.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
