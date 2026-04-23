/**
 * Connector-local todo types. These mirror the legacy `@better/shared` shape
 * the original todo UI consumed, but live entirely inside the connector so the
 * UI iframe has zero coupling to host data layers.
 *
 * `parseTodoRepeatRule` is also re-implemented here (not imported from shared)
 * for the same reason.
 */

export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TodoRepeatType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface TodoRepeatRule {
  type: TodoRepeatType;
}

export interface TodoItem {
  id: string;
  title: string;
  description: string | null;
  priority: TodoPriority;
  status: TodoStatus;
  dueDate: string | null;
  dateStart: string | null;
  remindAt: string | null;
  reminderEnabled: boolean;
  /** Stored as JSON-encoded `{ type }`; UI parses with `parseTodoRepeatRule`. */
  repeatRule: string;
  parentId: string | null;
  sortOrder: number;
  completedAt: string | null;
  color: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string | null;
  priority?: TodoPriority;
  dueDate?: string | null;
  dateStart?: string | null;
  remindAt?: string | null;
  reminderEnabled?: boolean;
  repeatRule?: TodoRepeatRule;
  parentId?: string | null;
  color?: string | null;
  tags?: string[];
}

export interface UpdateTodoInput {
  title?: string;
  description?: string | null;
  priority?: TodoPriority;
  status?: TodoStatus;
  dueDate?: string | null;
  dateStart?: string | null;
  remindAt?: string | null;
  reminderEnabled?: boolean;
  repeatRule?: TodoRepeatRule;
  parentId?: string | null;
  sortOrder?: number;
  color?: string | null;
  tags?: string[];
}

export function parseTodoRepeatRule(raw: string | null | undefined): TodoRepeatRule {
  if (!raw) return { type: 'none' };
  try {
    const parsed = JSON.parse(raw) as Partial<TodoRepeatRule>;
    const t = parsed?.type as TodoRepeatType | undefined;
    if (t === 'none' || t === 'daily' || t === 'weekdays' || t === 'weekly' || t === 'monthly') {
      return { type: t };
    }
  } catch {
    /* fallthrough */
  }
  return { type: 'none' };
}
