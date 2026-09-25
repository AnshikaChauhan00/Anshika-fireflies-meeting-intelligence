"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Tag as TagIcon } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { tagService } from "@/services/searchService";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";

export default function TagsPage() {
  const { data: tags, isLoading } = useQuery({ queryKey: queryKeys.tags(), queryFn: tagService.list });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Browse meetings by the tags they&apos;ve been labeled with.
      </p>

      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      ) : !tags || tags.length === 0 ? (
        <EmptyState icon={TagIcon} title="No tags yet" description="Tags you add to meetings will show up here." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/meetings?tag=${encodeURIComponent(tag.name)}`}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-ring dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <TagIcon className="h-3.5 w-3.5 text-gray-400" />
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
