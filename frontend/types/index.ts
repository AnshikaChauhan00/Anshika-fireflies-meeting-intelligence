export interface Participant {
  id: number;
  name: string;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
}

export interface Tag {
  id: number;
  name: string;
}

export interface MeetingSummaryCard {
  id: number;
  title: string;
  description: string | null;
  meeting_date: string;
  duration_seconds: number;
  participants: Participant[];
  tags: Tag[];
  action_item_count: number;
}

export interface MeetingListResponse {
  items: MeetingSummaryCard[];
  total: number;
  page: number;
  page_size: number;
}

export interface Meeting {
  id: number;
  title: string;
  description: string | null;
  meeting_date: string;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
  owner_id: number;
  participants: Participant[];
  tags: Tag[];
}

export interface TranscriptSegment {
  id: number;
  speaker_name: string;
  start_time: number;
  end_time: number;
  text: string;
  sequence_number: number;
}

export interface Summary {
  id: number;
  overview: string;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: number;
  title: string;
  description: string | null;
  start_time: number;
  end_time: number | null;
}

export type ActionItemStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface ActionItem {
  id: number;
  meeting_id: number;
  title: string;
  description: string | null;
  assignee: string | null;
  due_date: string | null;
  status: ActionItemStatus;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface GlobalSearchResponse {
  meetings: { id: number; title: string; meeting_date: string }[];
  transcript_matches: {
    meeting_id: number;
    meeting_title: string;
    segment_id: number;
    speaker_name: string;
    start_time: number;
    text: string;
  }[];
  action_items: {
    meeting_id: number;
    meeting_title: string;
    action_item_id: number;
    title: string;
    status: string;
  }[];
}

export interface ParticipantInput {
  name: string;
  email?: string;
  role?: string;
}

export interface CreateMeetingInput {
  title: string;
  description?: string;
  meeting_date: string;
  duration_seconds?: number;
  participants: ParticipantInput[];
  tags: string[];
  transcript_format?: "txt" | "vtt" | "json";
  transcript_content?: string;
}

export interface UpdateMeetingInput {
  title?: string;
  description?: string;
  meeting_date?: string;
  duration_seconds?: number;
  participants?: ParticipantInput[];
  tags?: string[];
}

export interface CreateActionItemInput {
  title: string;
  description?: string;
  assignee?: string;
  due_date?: string;
  status?: ActionItemStatus;
}

export interface UpdateActionItemInput {
  title?: string;
  description?: string;
  assignee?: string;
  due_date?: string;
  status?: ActionItemStatus;
}

export interface TranscriptComment {
  id: number;
  meeting_id: number;
  segment_id: number;
  author_name: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface AskSource {
  segment_id: number;
  speaker_name: string;
  start_time: number;
  text: string;
}

export interface AskAnswer {
  answer: string;
  mode: "llm" | "keyword";
  model: string | null;
  notice: string | null;
  sources: AskSource[];
}

export interface ApiErrorPayload {
  detail?: string;
}
