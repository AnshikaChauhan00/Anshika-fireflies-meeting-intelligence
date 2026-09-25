"use client";

import { useMutation } from "@tanstack/react-query";
import { meetingService } from "@/services/meetingService";

export function useAskMeeting(meetingId: number) {
  return useMutation({
    mutationFn: (question: string) => meetingService.ask(meetingId, question),
  });
}
