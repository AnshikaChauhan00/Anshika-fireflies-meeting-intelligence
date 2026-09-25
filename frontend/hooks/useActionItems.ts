"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { actionItemService, meetingService } from "@/services/meetingService";
import type { CreateActionItemInput, UpdateActionItemInput } from "@/types";

export function useActionItemsQuery(meetingId: number) {
  return useQuery({
    queryKey: queryKeys.actionItems(meetingId),
    queryFn: () => meetingService.listActionItems(meetingId),
    enabled: Number.isFinite(meetingId),
  });
}

export function useCreateActionItem(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateActionItemInput) =>
      meetingService.createActionItem(meetingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems(meetingId) });
    },
  });
}

export function useUpdateActionItem(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateActionItemInput }) =>
      actionItemService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems(meetingId) });
    },
  });
}

export function useCompleteActionItem(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => actionItemService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems(meetingId) });
    },
  });
}

export function useDeleteActionItem(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => actionItemService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems(meetingId) });
    },
  });
}
