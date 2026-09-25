"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useCreateComment, useDeleteComment, useUpdateComment } from "@/hooks/useComments";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api-client";
import { formatMeetingDateTime } from "@/lib/utils";
import type { TranscriptComment } from "@/types";

const MAX_COMMENT_LENGTH = 1000;

interface CommentThreadProps {
  meetingId: number;
  segmentId: number;
  comments: TranscriptComment[];
}

export function CommentThread({ meetingId, segmentId, comments }: CommentThreadProps) {
  const toast = useToast();
  const createComment = useCreateComment(meetingId);
  const updateComment = useUpdateComment(meetingId);
  const deleteComment = useDeleteComment(meetingId);

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingComment, setDeletingComment] = useState<TranscriptComment | null>(null);

  function errorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
  }

  async function handleAdd(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    try {
      await createComment.mutateAsync({ segment_id: segmentId, text });
      setDraft("");
      toast.success("Comment added.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleSaveEdit(comment: TranscriptComment) {
    const text = editText.trim();
    if (!text) return;
    try {
      await updateComment.mutateAsync({ id: comment.id, text });
      setEditingId(null);
      toast.success("Comment updated.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleDeleteConfirmed() {
    if (!deletingComment) return;
    try {
      await deleteComment.mutateAsync(deletingComment.id);
      toast.success("Comment deleted.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setDeletingComment(null);
    }
  }

  function submitOnModifierEnter(event: KeyboardEvent<HTMLTextAreaElement>, action: () => void) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      action();
    }
  }

  return (
    <div className="mb-2 ml-[54px] mr-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/60">
      {comments.length > 0 && (
        <ul className="space-y-3" aria-label="Comments on this transcript line">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2">
              <Avatar name={comment.author_name} size={24} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                    {comment.author_name}
                  </span>
                  <span className="text-xs text-gray-400">{formatMeetingDateTime(comment.created_at)}</span>
                  <span className="ml-auto flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditText(comment.text);
                      }}
                      aria-label="Edit comment"
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus-ring dark:hover:bg-gray-700"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingComment(comment)}
                      aria-label="Delete comment"
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 focus-ring dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                </div>

                {editingId === comment.id ? (
                  <div className="mt-1 space-y-1.5">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => submitOnModifierEnter(e, () => handleSaveEdit(comment))}
                      maxLength={MAX_COMMENT_LENGTH}
                      rows={2}
                      aria-label="Edit comment text"
                      className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(comment)}
                        isLoading={updateComment.isPending}
                        disabled={!editText.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-0.5 whitespace-pre-line break-words text-sm text-gray-700 dark:text-gray-200">
                    {comment.text}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="space-y-1.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => submitOnModifierEnter(e, () => handleAdd())}
          maxLength={MAX_COMMENT_LENGTH}
          rows={2}
          placeholder="Add a comment…"
          aria-label="Add a comment"
          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Ctrl/⌘ + Enter to post</span>
          <Button type="submit" size="sm" isLoading={createComment.isPending} disabled={!draft.trim()}>
            Comment
          </Button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={!!deletingComment}
        title="Delete this comment?"
        message="This comment will be permanently removed."
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteComment.isPending}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeletingComment(null)}
      />
    </div>
  );
}
