import type { MeetingSummaryCard } from "@/types";

export type DateRangeFilter = "all" | "recent" | "week" | "month";

export function applyDateRangeFilter(
  meetings: MeetingSummaryCard[],
  range: DateRangeFilter
): MeetingSummaryCard[] {
  if (range === "all") return meetings;

  const now = new Date();

  if (range === "recent") {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 3);
    return meetings.filter((m) => new Date(m.meeting_date) >= cutoff);
  }

  if (range === "week") {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    return meetings.filter((m) => new Date(m.meeting_date) >= cutoff);
  }

  // month
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);
  return meetings.filter((m) => new Date(m.meeting_date) >= cutoff);
}
