"use client";

import { useState } from "react";
import { CheckSquare, Pencil, Plus, Trash2, User } from "lucide-react";
import {
  useActionItemsQuery,
  useCompleteActionItem,
  useCreateActionItem,
  useDeleteActionItem,
  useUpdateActionItem,
} from "@/hooks/useActionItems";
import { useToast } from "@/hooks/useToast";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/common/Badge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ActionItemModal } from "@/components/summary/ActionItemModal";
import { cn, formatMeetingDate } from "@/lib/utils";
import type { ActionItem, ActionItemStatus } from "@/types";

const STATUS_LABEL: Record<ActionItemStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

const STATUS_VARIANT: Record<ActionItemStatus, "default" | "brand" | "success"> = {
  TODO: "default",
  IN_PROGRESS: "brand",
  COMPLETED: "success",
};

export function ActionItems({ meetingId }: { meetingId: number }) {
  const { data: items, isLoading } = useActionItemsQuery(meetingId);
  const createItem = useCreateActionItem(meetingId);
  const updateItem = useUpdateActionItem(meetingId);
  const completeItem = useCompleteActionItem(meetingId);
  const deleteItem = useDeleteActionItem(meetingId);
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ActionItem | null>(null);

  function openCreateModal() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function openEditModal(item: ActionItem) {
    setEditingItem(item);
    setModalOpen(true);
  }

  async function handleSubmit(values: {
    title: string;
    description?: string;
    assignee?: string;
    due_date?: string;
    status: ActionItemStatus;
  }) {
    try {
      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, payload: values });
        toast.success("Action item updated.");
      } else {
        await createItem.mutateAsync(values);
        toast.success("Action item created.");
      }
      setModalOpen(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  async function handleToggleComplete(item: ActionItem) {
    try {
      if (item.status === "COMPLETED") {
        await updateItem.mutateAsync({ id: item.id, payload: { status: "TODO" } });
      } else {
        await completeItem.mutateAsync(item.id);
        toast.success("Action item completed.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  async function handleDeleteConfirmed() {
    if (!deletingItem) return;
    try {
      await deleteItem.mutateAsync(deletingItem.id);
      toast.success("Action item deleted.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeletingItem(null);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Action Items</h2>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No action items for this meeting."
          className="border-none py-4"
        />
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => {
            const isCompleted = item.status === "COMPLETED";
            return (
              <li
                key={item.id}
                className="group flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60"
              >
                <button
                  type="button"
                  onClick={() => handleToggleComplete(item)}
                  aria-label={isCompleted ? "Mark as not completed" : "Mark as completed"}
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors focus-ring",
                    isCompleted
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-300 hover:border-brand-500 dark:border-gray-600"
                  )}
                >
                  {isCompleted && <CheckSquare className="h-3 w-3" strokeWidth={3} />}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm text-gray-800 dark:text-gray-100",
                      isCompleted && "text-gray-400 line-through dark:text-gray-500"
                    )}
                  >
                    {item.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                    {item.assignee && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {item.assignee}
                      </span>
                    )}
                    {item.due_date && <span>Due {formatMeetingDate(item.due_date)}</span>}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    aria-label="Edit action item"
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-ring dark:hover:bg-gray-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingItem(item)}
                    aria-label="Delete action item"
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 focus-ring dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ActionItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialItem={editingItem}
        isSubmitting={createItem.isPending || updateItem.isPending}
      />

      <ConfirmDialog
        isOpen={!!deletingItem}
        title="Delete action item?"
        message={`"${deletingItem?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteItem.isPending}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
