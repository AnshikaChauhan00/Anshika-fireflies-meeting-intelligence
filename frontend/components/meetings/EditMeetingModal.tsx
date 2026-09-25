"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { useUpdateMeeting } from "@/hooks/useMeetings";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api-client";
import type { Participant, ParticipantInput, Tag } from "@/types";

export interface EditableMeeting {
  id: number;
  title: string;
  description: string | null;
  meeting_date: string;
  participants: Participant[];
  tags: Tag[];
}

interface EditMeetingModalProps {
  meeting: EditableMeeting | null;
  onClose: () => void;
}

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function EditMeetingModal({ meeting, onClose }: EditMeetingModalProps) {
  const toast = useToast();
  const updateMeeting = useUpdateMeeting(meeting?.id ?? -1);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [participants, setParticipants] = useState<ParticipantInput[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!meeting) return;
    setTitle(meeting.title);
    setDescription(meeting.description ?? "");
    setMeetingDate(toDatetimeLocalValue(meeting.meeting_date));
    setParticipants(
      meeting.participants.length > 0
        ? meeting.participants.map((p) => ({ name: p.name, email: p.email ?? undefined, role: p.role ?? undefined }))
        : [{ name: "" }]
    );
    setTagsInput(meeting.tags.map((t) => t.name).join(", "));
    setFormError(null);
  }, [meeting]);

  if (!meeting) return null;

  function updateParticipant(index: number, value: string) {
    setParticipants((prev) => prev.map((p, i) => (i === index ? { ...p, name: value } : p)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Meeting title is required.");
      return;
    }

    const cleanParticipants = participants
      .map((p) => ({ ...p, name: p.name.trim() }))
      .filter((p) => p.name.length > 0);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await updateMeeting.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        meeting_date: new Date(meetingDate).toISOString(),
        participants: cleanParticipants,
        tags,
      });
      toast.success("Meeting updated successfully.");
      onClose();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      setFormError(message);
    }
  }

  return (
    <Modal isOpen={!!meeting} onClose={onClose} title="Edit Meeting" maxWidthClassName="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="edit-title" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Meeting Title
          </label>
          <input
            id="edit-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div>
          <label htmlFor="edit-description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Description
          </label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-date" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Date & Time
            </label>
            <input
              id="edit-date"
              type="datetime-local"
              required
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label htmlFor="edit-tags" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Tags <span className="text-gray-400">(comma-separated)</span>
            </label>
            <input
              id="edit-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Participants</span>
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={participant.name}
                  onChange={(e) => updateParticipant(index, e.target.value)}
                  aria-label={`Participant ${index + 1} name`}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setParticipants((prev) => prev.filter((_, i) => i !== index))}
                  disabled={participants.length === 1}
                  aria-label="Remove participant"
                  className="rounded-lg border border-gray-200 px-2 text-gray-400 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setParticipants((prev) => [...prev, { name: "" }])}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add participant
          </button>
        </div>

        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updateMeeting.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
