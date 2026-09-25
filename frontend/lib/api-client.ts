import type { ApiErrorPayload } from "@/types";
import {
  getMockMeetings,
  getMockMeeting,
  getMockGlobalSearch,
  getMockTags,
  getMockTranscript,
  getMockSummary,
  getMockActionItems,
  getMockTopics,
  createMockMeeting,
} from "./mock-data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// In-memory mock response router
async function handleMock<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const url = new URL(path, "http://localhost"); 
    const pathname = url.pathname;
    
    if (options.method === "GET" || !options.method) {
      if (pathname === "/api/meetings") {
        const search = url.searchParams.get("search") || undefined;
        const tag = url.searchParams.get("tag") || undefined;
        const participant = url.searchParams.get("participant") || undefined;
        const sort = url.searchParams.get("sort") || undefined;
        const page = url.searchParams.get("page") || undefined;
        const page_size = url.searchParams.get("page_size") || undefined;
        return getMockMeetings({ search, tag, participant, sort, page, page_size }) as any;
      }
      if (pathname.match(/^\/api\/meetings\/\d+$/)) {
        const id = parseInt(pathname.split("/")[3] || "0");
        const m = getMockMeeting(id);
        if (m) return m as any;
      }
      if (pathname.match(/^\/api\/meetings\/\d+\/transcript$/)) {
        const id = parseInt(pathname.split("/")[3] || "0");
        return getMockTranscript(id) as any;
      }
      if (pathname.match(/^\/api\/meetings\/\d+\/summary$/)) {
        const id = parseInt(pathname.split("/")[3] || "0");
        return getMockSummary(id) as any;
      }
      if (pathname.match(/^\/api\/meetings\/\d+\/action-items$/)) {
        const id = parseInt(pathname.split("/")[3] || "0");
        return getMockActionItems(id) as any;
      }
      if (pathname.match(/^\/api\/meetings\/\d+\/topics$/)) {
        const id = parseInt(pathname.split("/")[3] || "0");
        return getMockTopics(id) as any;
      }
      if (pathname.match(/^\/api\/meetings\/\d+\/comments$/)) {
        return [] as any; // Mock empty comments
      }
      if (pathname === "/api/search") {
        const q = url.searchParams.get("q") || "";
        return getMockGlobalSearch(q) as any;
      }
      if (pathname === "/api/tags") {
        return getMockTags() as any;
      }
      if (pathname === "/api/users/me") {
        return { id: 1, name: "Anshika Chauhan", email: "anshika@example.com", avatar_url: null, created_at: new Date().toISOString() } as any;
      }
    } else if (options.method === "POST") {
      if (pathname === "/api/meetings") {
        const body = options.body ? JSON.parse(options.body as string) : {};
        return createMockMeeting(body) as any;
      }
      if (pathname.match(/^\/api\/meetings\/\d+\/ask$/)) {
        return { answer: "This is a mock answer based on the transcript.", mode: "llm", model: "mock-model", notice: null, sources: [] } as any;
      }
    }
  } catch(e) {
    console.error("Mock router error:", e);
  }
  return null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const useMock = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_USE_MOCK === "true" || API_BASE_URL.includes("localhost");
  
  if (useMock) {
    const mockRes = await handleMock<T>(path, options);
    if (mockRes !== null) {
      await new Promise(r => setTimeout(r, 200));
      return mockRes;
    }
    // Return empty for unhandled mocks so UI doesn't break
    if (options.method !== "GET") return {} as T;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let detail = "Something went wrong. Please try again.";
    try {
      const payload: ApiErrorPayload = await response.json();
      if (payload.detail) detail = payload.detail;
    } catch {
      // response body wasn't JSON; keep the default message
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
