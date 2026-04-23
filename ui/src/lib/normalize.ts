import { parseTodoRepeatRule } from './types.js';
import type { CreateTodoInput, TodoItem } from './types.js';

/**
 * Skill responses are already in our `TodoItem` shape, but defensively coerce
 * unknown rows (e.g. legacy snapshots) into the typed view used by hooks/views.
 */
export function normalizeTodo(raw: Record<string, unknown>): TodoItem {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ''),
    description: (raw.description as string | null) ?? null,
    priority: (raw.priority as TodoItem['priority']) ?? 'medium',
    status: (raw.status as TodoItem['status']) ?? 'pending',
    dueDate: (raw.dueDate as string | null) ?? null,
    dateStart: (raw.dateStart as string | null) ?? null,
    remindAt: (raw.remindAt as string | null) ?? null,
    reminderEnabled: Boolean(raw.reminderEnabled),
    repeatRule:
      typeof raw.repeatRule === 'string'
        ? raw.repeatRule
        : raw.repeatRule
          ? JSON.stringify(raw.repeatRule)
          : '{"type":"none"}',
    parentId: (raw.parentId as string | null) ?? null,
    sortOrder: Number(raw.sortOrder ?? 0),
    completedAt: (raw.completedAt as string | null) ?? null,
    color: (raw.color as string | null) ?? null,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

export function buildCreateFromTodo(todo: TodoItem): CreateTodoInput {
  const rule = parseTodoRepeatRule(todo.repeatRule);
  return {
    title: todo.title,
    description: todo.description ?? undefined,
    priority: todo.priority,
    dueDate: todo.dueDate ?? undefined,
    dateStart: todo.dateStart ?? undefined,
    remindAt: todo.remindAt ?? undefined,
    reminderEnabled: todo.reminderEnabled,
    repeatRule: rule,
    parentId: todo.parentId ?? undefined,
    color: todo.color ?? undefined,
    tags: todo.tags?.length ? todo.tags : undefined,
  };
}
