"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { commentService, meetingService } from "@/services/meetingService";

export function useCommentsQuery(meetingId: number) {
  return useQuery({
    queryKey: queryKeys.comments(meetingId),
    queryFn: () => meetingService.listComments(meetingId),
    enabled: Number.isFinite(meetingId),
  });
}

export function useCreateComment(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { segment_id: number; text: string }) =>
      meetingService.createComment(meetingId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.comments(meetingId) }),
  });
}

export function useUpdateComment(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => commentService.update(id, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.comments(meetingId) }),
  });
}

export function useDeleteComment(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => commentService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.comments(meetingId) }),
  });
}
