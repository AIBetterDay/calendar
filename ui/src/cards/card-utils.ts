import i18n from '../i18n';
import type { TodoCardItem } from './types';

export function tr(key: string, fallback: string, options?: Record<string, string | number>): string {
  return i18n.t(key, { defaultValue: fallback, ...options }) as string;
}

export function currentLocale(): 'zh' | 'en' {
  return i18n.language?.startsWith('zh') ? 'zh' : 'en';
}

export function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function normalizeTodoItem(value: unknown): TodoCardItem {
  const obj = asObject(value);
  return {
    id: stringValue(obj.id),
    title: stringValue(obj.title, tr('todo.cards.untitledTodo', 'Untitled calendar item')),
    description: stringValue(obj.description),
    priority: stringValue(obj.priority, 'medium'),
    status: stringValue(obj.status, 'pending'),
    dueDate: stringValue(obj.dueDate ?? obj.due_date),
    dateStart: stringValue(obj.dateStart ?? obj.date_start),
    remindAt: stringValue(obj.remindAt ?? obj.remind_at),
    reminderEnabled: booleanValue(obj.reminderEnabled ?? obj.reminder_enabled),
    repeatRule: typeof obj.repeatRule === 'string' ? obj.repeatRule : (obj.repeatRule as TodoCardItem['repeatRule']),
    color: stringValue(obj.color),
    tags: stringArray(obj.tags),
  };
}

export function normalizeTodoItems(value: unknown, limit = 8): TodoCardItem[] {
  return Array.isArray(value) ? value.slice(0, limit).map(normalizeTodoItem) : [];
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(currentLocale() === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(currentLocale() === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatTimeRange(item: TodoCardItem): string {
  const start = formatDateTime(item.dateStart);
  const due = formatDateTime(item.dueDate);
  if (start && due && start !== due) return `${start} - ${due}`;
  return due || start || '';
}

export function statusLabel(status?: string): string {
  switch (status) {
    case 'completed':
      return tr('todo.cards.statusCompleted', 'Completed');
    case 'in_progress':
      return tr('todo.cards.statusInProgress', 'In progress');
    case 'cancelled':
      return tr('todo.cards.statusCancelled', 'Cancelled');
    default:
      return tr('todo.cards.statusPending', 'Pending');
  }
}

export function priorityLabel(priority?: string): string {
  switch (priority) {
    case 'urgent':
      return tr('todo.cards.priorityUrgent', 'Urgent');
    case 'high':
      return tr('todo.cards.priorityHigh', 'High');
    case 'low':
      return tr('todo.cards.priorityLow', 'Low');
    default:
      return tr('todo.cards.priorityMedium', 'Medium');
  }
}

export function priorityTone(priority?: string): string {
  switch (priority) {
    case 'urgent':
      return 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300';
    case 'high':
      return 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300';
    case 'low':
      return 'border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300';
    default:
      return 'border-border/70 bg-background text-muted-foreground';
  }
}
