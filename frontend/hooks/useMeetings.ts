"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  meetingService,
  type MeetingListParams,
} from "@/services/meetingService";
import type { CreateMeetingInput, UpdateMeetingInput } from "@/types";

export function useMeetingsQuery(params: MeetingListParams) {
  return useQuery({
    queryKey: queryKeys.meetings(params),
    queryFn: () => meetingService.list(params),
  });
}

export function useMeetingQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.meeting(id),
    queryFn: () => meetingService.get(id),
    enabled: Number.isFinite(id),
  });
}

export function useTranscriptQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.transcript(id),
    queryFn: () => meetingService.getTranscript(id),
    enabled: Number.isFinite(id),
  });
}

export function useSummaryQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.summary(id),
    queryFn: () => meetingService.getSummary(id),
    enabled: Number.isFinite(id),
    retry: false,
  });
}

export function useTopicsQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.topics(id),
    queryFn: () => meetingService.getTopics(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMeetingInput) => meetingService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useUpdateMeeting(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMeetingInput) => meetingService.update(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.meeting(id), data);
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => meetingService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useUploadTranscript(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ format, content }: { format: "txt" | "vtt" | "json"; content: string }) =>
      meetingService.uploadTranscript(id, format, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transcript(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.topics(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.meeting(id) });
    },
  });
}
