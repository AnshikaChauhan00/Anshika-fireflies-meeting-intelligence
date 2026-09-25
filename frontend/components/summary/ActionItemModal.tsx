"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import type { ActionItem, ActionItemStatus } from "@/types";

interface ActionItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: {
    title: string;
    description?: string;
    assignee?: string;
    due_date?: string;
    status: ActionItemStatus;
  }) => Promise<void>;
  initialItem?: ActionItem | null;
  isSubmitting: boolean;
}

export function ActionItemModal({ isOpen, onClose, onSubmit, initialItem, isSubmitting }: ActionItemModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<ActionItemStatus>("TODO");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialItem?.title ?? "");
    setDescription(initialItem?.description ?? "");
    setAssignee(initialItem?.assignee ?? "");
    setDueDate(initialItem?.due_date ?? "");
    setStatus(initialItem?.status ?? "TODO");
    setError(null);
  }, [isOpen, initialItem]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      assignee: assignee.trim() || undefined,
      due_date: dueDate || undefined,
      status,
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialItem ? "Edit Action Item" : "New Action Item"}
      maxWidthClassName="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ai-title" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Title
          </label>
          <input
            id="ai-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div>
          <label htmlFor="ai-description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Description
          </label>
          <textarea
            id="ai-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ai-assignee" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Assignee
            </label>
            <input
              id="ai-assignee"
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label htmlFor="ai-due" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Due Date
            </label>
            <input
              id="ai-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ai-status" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Status
          </label>
          <select
            id="ai-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ActionItemStatus)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus-ring focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialItem ? "Save Changes" : "Add Action Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
