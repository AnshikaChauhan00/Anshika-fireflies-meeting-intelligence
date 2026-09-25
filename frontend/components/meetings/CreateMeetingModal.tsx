"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { useCreateMeeting } from "@/hooks/useMeetings";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api-client";
import type { ParticipantInput } from "@/types";

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TranscriptSource = "paste" | "upload";

const EXTENSION_FORMAT: Record<string, "txt" | "vtt" | "json"> = {
  txt: "txt",
  vtt: "vtt",
  json: "json",
};

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function CreateMeetingModal({ isOpen, onClose }: CreateMeetingModalProps) {
  const router = useRouter();
  const toast = useToast();
  const createMeeting = useCreateMeeting();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState(() => toDatetimeLocalValue(new Date()));
  const [participants, setParticipants] = useState<ParticipantInput[]>([{ name: "" }]);
  const [tagsInput, setTagsInput] = useState("");
  const [source, setSource] = useState<TranscriptSource>("paste");
  const [transcriptFormat, setTranscriptFormat] = useState<"txt" | "vtt" | "json">("txt");
  const [transcriptContent, setTranscriptContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setDescription("");
    setMeetingDate(toDatetimeLocalValue(new Date()));
    setParticipants([{ name: "" }]);
    setTagsInput("");
    setSource("paste");
    setTranscriptFormat("txt");
    setTranscriptContent("");
    setFileName(null);
    setFormError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function updateParticipant(index: number, value: string) {
    setParticipants((prev) => prev.map((p, i) => (i === index ? { ...p, name: value } : p)));
  }

  function addParticipantRow() {
    setParticipants((prev) => [...prev, { name: "" }]);
  }

  function removeParticipantRow(index: number) {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const format = EXTENSION_FORMAT[extension];
    if (!format) {
      setFormError("Unsupported file type. Please upload a .txt, .vtt, or .json file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError("File is too large. Maximum size is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTranscriptContent(String(reader.result ?? ""));
      setTranscriptFormat(format);
      setFileName(file.name);
      setFormError(null);
    };
    reader.onerror = () => setFormError("Could not read the selected file.");
    reader.readAsText(file);
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
      const meeting = await createMeeting.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        meeting_date: new Date(meetingDate).toISOString(),
        participants: cleanParticipants,
        tags,
        transcript_format: transcriptContent.trim() ? transcriptFormat : undefined,
        transcript_content: transcriptContent.trim() || undefined,
      });

      toast.success("Meeting created successfully.");
      if (transcriptContent.trim()) {
        toast.success("Transcript uploaded successfully.");
      }
      handleClose();
      router.push(`/meetings/${meeting.id}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      setFormError(message);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Meeting"
      description="Add meeting details and optionally paste or upload a transcript."
      maxWidthClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="meeting-title" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Meeting Title
          </label>
          <input
            id="meeting-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Product Roadmap Discussion"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div>
          <label htmlFor="meeting-description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="meeting-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What is this meeting about?"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="meeting-date" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Date & Time
            </label>
            <input
              id="meeting-date"
              type="datetime-local"
              required
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label htmlFor="meeting-tags" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Tags <span className="text-gray-400">(comma-separated)</span>
            </label>
            <input
              id="meeting-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="roadmap, planning"
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
                  placeholder="Participant name"
                  aria-label={`Participant ${index + 1} name`}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
                />
                <button
                  type="button"
                  onClick={() => removeParticipantRow(index)}
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
            onClick={addParticipantRow}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add participant
          </button>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Transcript source</span>
          <div className="mb-3 flex gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="transcript-source"
                checked={source === "paste"}
                onChange={() => setSource("paste")}
              />
              Paste Transcript
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="transcript-source"
                checked={source === "upload"}
                onChange={() => setSource("upload")}
              />
              Upload File (.txt, .vtt, .json)
            </label>
          </div>

          {source === "paste" ? (
            <div className="space-y-2">
              <select
                value={transcriptFormat}
                onChange={(e) => setTranscriptFormat(e.target.value as "txt" | "vtt" | "json")}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="txt">TXT format</option>
                <option value="vtt">VTT format</option>
                <option value="json">JSON format</option>
              </select>
              <textarea
                value={transcriptContent}
                onChange={(e) => setTranscriptContent(e.target.value)}
                rows={6}
                placeholder={
                  transcriptFormat === "txt"
                    ? "[00:00] Speaker Name:\nWhat they said..."
                    : transcriptFormat === "vtt"
                    ? "00:00:00.000 --> 00:00:05.000\nSpeaker: What they said..."
                    : '[{"speaker": "Name", "start": 0, "end": 5, "text": "What they said"}]'
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center dark:border-gray-700">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.vtt,.json"
                onChange={handleFileChange}
                className="hidden"
                id="transcript-file-input"
              />
              <label
                htmlFor="transcript-file-input"
                className="flex cursor-pointer flex-col items-center gap-2 text-sm text-gray-500"
              >
                <Upload className="h-5 w-5" />
                {fileName ? (
                  <span className="font-medium text-gray-700 dark:text-gray-200">{fileName}</span>
                ) : (
                  <span>Click to select a .txt, .vtt, or .json transcript file</span>
                )}
              </label>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-400">
            You can also skip this and add a transcript later from the meeting page.
          </p>
        </div>

        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createMeeting.isPending}>
            Create Meeting
          </Button>
        </div>
      </form>
    </Modal>
  );
}
