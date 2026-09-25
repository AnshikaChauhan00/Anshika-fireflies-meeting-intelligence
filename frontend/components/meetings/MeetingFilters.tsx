"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRangeFilter } from "@/lib/meetingFilters";

const RANGE_TABS: { value: DateRangeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "recent", label: "Recent" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

interface MeetingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  range: DateRangeFilter;
  onRangeChange: (value: DateRangeFilter) => void;
  sort: "recent" | "oldest" | "duration";
  onSortChange: (value: "recent" | "oldest" | "duration") => void;
}

export function MeetingFilters({
  search,
  onSearchChange,
  range,
  onRangeChange,
  sort,
  onSortChange,
}: MeetingFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search meetings by title, description, or participant…"
          aria-label="Search meetings"
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm focus-ring focus:border-brand-400 dark:border-gray-800 dark:bg-gray-900"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800" role="tablist">
          {RANGE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={range === tab.value}
              onClick={() => onRangeChange(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-ring",
                range === tab.value
                  ? "bg-white text-gray-900 shadow-card dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          Sort by
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as "recent" | "oldest" | "duration")}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus-ring dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="recent">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="duration">Longest duration</option>
          </select>
        </label>
      </div>
    </div>
  );
}
