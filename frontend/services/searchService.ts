import { apiClient } from "@/lib/api-client";
import type { GlobalSearchResponse, Tag, User } from "@/types";

export const searchService = {
  globalSearch: (query: string) =>
    apiClient.get<GlobalSearchResponse>(`/api/search?q=${encodeURIComponent(query)}`),
};

export const tagService = {
  list: () => apiClient.get<Tag[]>("/api/tags"),
};

export const userService = {
  me: () => apiClient.get<User>("/api/users/me"),
};
