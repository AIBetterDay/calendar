import { CheckCheck } from 'lucide-react';
import { CardShell, Pill } from './card-shell';
import { asObject, normalizeTodoItems, numberValue, stringValue, tr } from './card-utils';
import { TodoRow } from './todo-row';
import type { TodoBulkActionPayload } from './types';

export function normalizeTodoBulkActionPayload(payload: unknown): TodoBulkActionPayload {
  const obj = asObject(payload);
  return {
    title: stringValue(obj.title, tr('todo.cards.bulkAction', 'Bulk update')),
    action: stringValue(obj.action),
    summary: stringValue(obj.summary),
    updated: numberValue(obj.updated),
    completed: numberValue(obj.completed),
    rescheduled: numberValue(obj.rescheduled),
    cancelled: numberValue(obj.cancelled),
    items: normalizeTodoItems(obj.items ?? obj.calendar ?? obj.updatedItems, 6),
  };
}

export function TodoBulkActionCard({ payload }: { payload: TodoBulkActionPayload }) {
  const items = payload.items ?? [];
  return (
    <CardShell
      eyebrow={tr('todo.cards.bulkAction', 'Bulk update')}
      title={payload.title || tr('todo.cards.bulkAction', 'Bulk update')}
      icon={<CheckCheck className="h-4.5 w-4.5" />}
      meta={payload.action}
      footer={
        <div className="flex flex-wrap gap-1.5">
          {payload.updated != null ? (
            <Pill className="border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300">
              {tr('todo.cards.updatedCount', '{{count}} updated', { count: payload.updated })}
            </Pill>
          ) : null}
          {payload.completed != null ? (
            <Pill className="border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              {tr('todo.cards.completedCount', '{{count}} completed', { count: payload.completed })}
            </Pill>
          ) : null}
          {payload.rescheduled != null ? (
            <Pill className="border-purple-500/35 bg-purple-500/10 text-purple-700 dark:text-purple-300">
              {tr('todo.cards.rescheduledCount', '{{count}} rescheduled', { count: payload.rescheduled })}
            </Pill>
          ) : null}
          {payload.cancelled != null ? (
            <Pill className="border-muted bg-muted/40 text-muted-foreground">
              {tr('todo.cards.cancelledCount', '{{count}} cancelled', { count: payload.cancelled })}
            </Pill>
          ) : null}
        </div>
      }
    >
      {payload.summary ? (
        <p className="mb-3 text-[12.5px] leading-relaxed text-foreground/80">{payload.summary}</p>
      ) : null}
      {items.length ? (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <TodoRow key={item.id || `${item.title}-${idx}`} item={item} compact />
          ))}
        </div>
      ) : (
        <p className="text-[12.5px] text-muted-foreground">
          {tr('todo.cards.bulkDone', 'Bulk action completed.')}
        </p>
      )}
    </CardShell>
  );
}
