import { apiClient } from "@/lib/api-client";
import type {
  ActionItem,
  AskAnswer,
  TranscriptComment,
  CreateActionItemInput,
  CreateMeetingInput,
  Meeting,
  MeetingListResponse,
  Summary,
  TranscriptSegment,
  Topic,
  UpdateActionItemInput,
  UpdateMeetingInput,
} from "@/types";

export interface MeetingListParams {
  search?: string;
  participant?: string;
  tag?: string;
  sort?: "recent" | "oldest" | "duration";
  page?: number;
  page_size?: number;
}

function buildQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const meetingService = {
  list: (params: MeetingListParams = {}) =>
    apiClient.get<MeetingListResponse>(`/api/meetings${buildQuery(params)}`),

  get: (id: number) => apiClient.get<Meeting>(`/api/meetings/${id}`),

  create: (payload: CreateMeetingInput) => apiClient.post<Meeting>("/api/meetings", payload),

  update: (id: number, payload: UpdateMeetingInput) =>
    apiClient.put<Meeting>(`/api/meetings/${id}`, payload),

  remove: (id: number) => apiClient.delete<void>(`/api/meetings/${id}`),

  getTranscript: (id: number) =>
    apiClient.get<TranscriptSegment[]>(`/api/meetings/${id}/transcript`),

  uploadTranscript: (id: number, format: "txt" | "vtt" | "json", content: string) =>
    apiClient.post<TranscriptSegment[]>(`/api/meetings/${id}/transcript`, { format, content }),

  getSummary: (id: number) => apiClient.get<Summary>(`/api/meetings/${id}/summary`),

  getTopics: (id: number) => apiClient.get<Topic[]>(`/api/meetings/${id}/topics`),

  listActionItems: (id: number) =>
    apiClient.get<ActionItem[]>(`/api/meetings/${id}/action-items`),

  createActionItem: (id: number, payload: CreateActionItemInput) =>
    apiClient.post<ActionItem>(`/api/meetings/${id}/action-items`, payload),

  listComments: (id: number) => apiClient.get<TranscriptComment[]>(`/api/meetings/${id}/comments`),

  createComment: (id: number, payload: { segment_id: number; text: string }) =>
    apiClient.post<TranscriptComment>(`/api/meetings/${id}/comments`, payload),

  ask: (id: number, question: string) =>
    apiClient.post<AskAnswer>(`/api/meetings/${id}/ask`, { question }),
};

export const commentService = {
  update: (id: number, text: string) => apiClient.put<TranscriptComment>(`/api/comments/${id}`, { text }),

  remove: (id: number) => apiClient.delete<void>(`/api/comments/${id}`),
};

export const actionItemService = {
  update: (id: number, payload: UpdateActionItemInput) =>
    apiClient.put<ActionItem>(`/api/action-items/${id}`, payload),

  complete: (id: number) => apiClient.patch<ActionItem>(`/api/action-items/${id}/complete`),

  remove: (id: number) => apiClient.delete<void>(`/api/action-items/${id}`),
};
