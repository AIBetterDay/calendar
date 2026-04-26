import { ListChecks } from 'lucide-react';
import { CardShell, Pill } from './card-shell';
import { asObject, normalizeTodoItems, numberValue, stringValue, tr } from './card-utils';
import { TodoRow } from './todo-row';
import type { TodoListPayload } from './types';

export function normalizeTodoListPayload(payload: unknown): TodoListPayload {
  const obj = asObject(payload);
  const items = normalizeTodoItems(obj.items ?? obj.calendar ?? obj.results, 8);
  const completed = numberValue(obj.completed) ?? items.filter((item) => item.status === 'completed').length;
  const pending = numberValue(obj.pending) ?? items.filter((item) => item.status !== 'completed').length;
  return {
    title: stringValue(obj.title, tr('todo.cards.todoList', 'Calendar list')),
    subtitle: stringValue(obj.subtitle),
    items,
    total: numberValue(obj.total) ?? items.length,
    completed,
    pending,
  };
}

export function TodoListCard({ payload }: { payload: TodoListPayload }) {
  const items = payload.items ?? [];
  return (
    <CardShell
      eyebrow={tr('todo.cards.todoList', 'Calendar list')}
      title={payload.title || tr('todo.cards.todoList', 'Calendar list')}
      icon={<ListChecks className="h-4.5 w-4.5" />}
      meta={payload.subtitle}
      footer={
        <div className="flex flex-wrap gap-1.5">
          <Pill className="border-border/70 bg-background text-muted-foreground">
            {tr('todo.cards.totalCount', '{{count}} total', { count: payload.total ?? items.length })}
          </Pill>
          <Pill className="border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            {tr('todo.cards.completedCount', '{{count}} completed', { count: payload.completed ?? 0 })}
          </Pill>
          <Pill className="border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300">
            {tr('todo.cards.pendingCount', '{{count}} pending', { count: payload.pending ?? items.length })}
          </Pill>
        </div>
      }
    >
      {items.length ? (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <TodoRow key={item.id || `${item.title}-${idx}`} item={item} compact />
          ))}
        </div>
      ) : (
        <p className="text-[12.5px] text-muted-foreground">
          {tr('todo.cards.noTodos', 'No calendar items to display.')}
        </p>
      )}
    </CardShell>
  );
}
