import seedData from "./seed.json";
import {
  Meeting,
  MeetingListResponse,
  MeetingSummaryCard,
  GlobalSearchResponse,
  TranscriptSegment,
  ActionItem,
  Topic,
  Summary,
  TranscriptComment,
  AskAnswer
} from "@/types";

let mockMeetings: any[] = [...seedData];

let nextId = 100;
function getNextId() {
  return nextId++;
}

export function getMockMeetings(params: { search?: string, tag?: string, participant?: string, sort?: string, page?: string, page_size?: string }): MeetingListResponse {
  let filtered = [...mockMeetings];
  
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.overview?.toLowerCase().includes(q) ||
      m.transcript?.some((t: any) => t.text.toLowerCase().includes(q))
    );
  }
  
  if (params.tag) {
    const q = params.tag.toLowerCase();
    filtered = filtered.filter(m => m.tags.some((t: any) => t.name.toLowerCase() === q));
  }
  
  if (params.participant) {
    const q = params.participant.toLowerCase();
    filtered = filtered.filter(m => m.participants.some((p: any) => p.name.toLowerCase() === q));
  }

  // sort
  if (params.sort === 'oldest') {
    filtered.sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime());
  } else if (params.sort === 'duration') {
    filtered.sort((a, b) => b.duration_seconds - a.duration_seconds);
  } else {
    // recent by default
    filtered.sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime());
  }

  const page = parseInt(params.page || '1');
  const pageSize = parseInt(params.page_size || '10');
  const total = filtered.length;
  
  const items = filtered.slice((page - 1) * pageSize, page * pageSize).map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    meeting_date: m.meeting_date,
    duration_seconds: m.duration_seconds,
    participants: m.participants,
    tags: m.tags,
    action_item_count: m.action_items?.length || 0
  }));

  return {
    items,
    total,
    page,
    page_size: pageSize
  };
}

export function getMockMeeting(id: number): Meeting | undefined {
  return mockMeetings.find(m => m.id === id);
}

export function getMockGlobalSearch(query: string): GlobalSearchResponse {
  const q = query.toLowerCase();
  const meetings = mockMeetings.filter(m => m.title.toLowerCase().includes(q) || m.overview?.toLowerCase().includes(q)).map(m => ({
    id: m.id,
    title: m.title,
    meeting_date: m.meeting_date
  }));
  
  const transcript_matches: any[] = [];
  const action_items: any[] = [];

  for (const m of mockMeetings) {
    if (m.transcript) {
      for (const t of m.transcript) {
        if (t.text.toLowerCase().includes(q)) {
          transcript_matches.push({
            meeting_id: m.id,
            meeting_title: m.title,
            segment_id: t.id,
            speaker_name: t.speaker_name,
            start_time: t.start_time,
            text: t.text
          });
        }
      }
    }
    if (m.action_items) {
      for (const a of m.action_items) {
        if (a.title.toLowerCase().includes(q) || a.assignee?.toLowerCase().includes(q)) {
          action_items.push({
            meeting_id: m.id,
            meeting_title: m.title,
            action_item_id: a.id,
            title: a.title,
            status: a.status
          });
        }
      }
    }
  }

  return { meetings, transcript_matches, action_items };
}

export function getMockTags(): { id: number, name: string }[] {
  const map = new Map<string, number>();
  for (const m of mockMeetings) {
    for (const t of m.tags) {
      if (!map.has(t.name)) {
        map.set(t.name, t.id);
      }
    }
  }
  return Array.from(map.entries()).map(([name, id]) => ({ id, name }));
}

export function getMockTranscript(id: number): TranscriptSegment[] {
  const m = getMockMeeting(id);
  return m ? (m as any).transcript || [] : [];
}

export function getMockSummary(id: number): Summary | undefined {
  const m = getMockMeeting(id);
  if (!m) return undefined;
  return {
    id: m.id,
    overview: (m as any).overview || "",
    created_at: m.created_at,
    updated_at: m.updated_at
  };
}

export function getMockActionItems(id: number): ActionItem[] {
  const m = getMockMeeting(id);
  return m ? (m as any).action_items || [] : [];
}

export function getMockTopics(id: number): Topic[] {
  const m = getMockMeeting(id);
  return m ? (m as any).topics || [] : [];
}

export function createMockMeeting(payload: any): Meeting {
  const newMeeting = {
    id: getNextId(),
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_id: 1,
    action_items: [],
    transcript: [],
    topics: [],
    overview: ""
  };
  mockMeetings = [newMeeting, ...mockMeetings];
  return newMeeting;
}
