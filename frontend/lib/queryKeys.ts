export const queryKeys = {
  meetings: (params?: unknown) => ["meetings", params] as const,
  meeting: (id: number) => ["meeting", id] as const,
  transcript: (id: number) => ["transcript", id] as const,
  summary: (id: number) => ["summary", id] as const,
  topics: (id: number) => ["topics", id] as const,
  comments: (id: number) => ["comments", id] as const,
  actionItems: (id: number) => ["action-items", id] as const,
  tags: () => ["tags"] as const,
  currentUser: () => ["current-user"] as const,
  globalSearch: (query: string) => ["global-search", query] as const,
};
