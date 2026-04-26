import { CheckSquare, Clock, Tags } from 'lucide-react';
import { CardShell, Pill } from './card-shell';
import {
  asObject,
  formatDate,
  normalizeTodoItem,
  priorityLabel,
  priorityTone,
  stringValue,
  tr,
} from './card-utils';
import { TodoRow } from './todo-row';
import type { TodoItemPayload } from './types';

export function normalizeTodoItemPayload(payload: unknown): TodoItemPayload {
  const obj = asObject(payload);
  const itemSource = obj.item && typeof obj.item === 'object' ? obj.item : obj;
  return {
    title: stringValue(obj.title),
    subtitle: stringValue(obj.subtitle),
    item: normalizeTodoItem(itemSource),
  };
}

export function TodoItemCard({ payload }: { payload: TodoItemPayload }) {
  const item = payload.item ?? {};
  const title = payload.title || item.title || tr('todo.cards.todoItem', 'Calendar item');
  const tags = item.tags ?? [];

  return (
    <CardShell
      eyebrow={tr('todo.cards.todoItem', 'Calendar item')}
      title={title}
      icon={<CheckSquare className="h-4.5 w-4.5" />}
      meta={payload.subtitle || formatDate(item.dueDate) || undefined}
      footer={
        <div className="flex flex-wrap gap-1.5">
          <Pill className={priorityTone(item.priority)}>{priorityLabel(item.priority)}</Pill>
          {item.reminderEnabled || item.remindAt ? (
            <Pill className="border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300">
              <Clock className="h-3 w-3" />
              {tr('todo.cards.reminder', 'Reminder')}
            </Pill>
          ) : null}
          {tags.length ? (
            <Pill className="border-border/70 bg-background text-muted-foreground">
              <Tags className="h-3 w-3" />
              {tags.slice(0, 2).join(', ')}
            </Pill>
          ) : null}
        </div>
      }
    >
      <TodoRow item={item} />
    </CardShell>
  );
}
