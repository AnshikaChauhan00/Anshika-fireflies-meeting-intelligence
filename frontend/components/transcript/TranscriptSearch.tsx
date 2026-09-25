"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

interface TranscriptSearchProps {
  query: string;
  onQueryChange: (value: string) => void;
  matchCount: number;
  activeMatchNumber: number;
  onNext: () => void;
  onPrevious: () => void;
  onExportMarkdown?: () => void;
  onExportPDF?: () => void;
}

export function TranscriptSearch({
  query,
  onQueryChange,
  matchCount,
  activeMatchNumber,
  onNext,
  onPrevious,
  onExportMarkdown,
  onExportPDF,
}: TranscriptSearchProps) {
  return (
    <div className="flex items-center gap-1.5 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search in transcript…"
          aria-label="Search transcript"
          className="h-8 w-full rounded-md border border-gray-200 bg-gray-50 pl-8 pr-7 text-sm focus-ring focus:border-brand-400 focus:bg-white dark:border-gray-700 dark:bg-gray-900"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear transcript search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {query.trim() && (
        <div className="flex shrink-0 items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="tabular-nums">
            {matchCount > 0 ? `${activeMatchNumber}/${matchCount}` : "No matches"}
          </span>
          <button
            type="button"
            onClick={onPrevious}
            disabled={matchCount === 0}
            aria-label="Previous match"
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={matchCount === 0}
            aria-label="Next match"
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {(onExportMarkdown || onExportPDF) && (
        <div className="flex shrink-0 items-center gap-1 border-l border-gray-200 pl-1.5 dark:border-gray-700">
          {onExportMarkdown && (
            <button
              onClick={onExportMarkdown}
              title="Export as Markdown"
              className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              MD
            </button>
          )}
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              title="Export as PDF"
              className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
}
