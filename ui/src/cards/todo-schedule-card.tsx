import { CalendarDays } from 'lucide-react';
import { CardShell, Pill } from './card-shell';
import {
  asObject,
  formatDate,
  formatTimeRange,
  normalizeTodoItems,
  stringValue,
  tr,
} from './card-utils';
import { TodoRow } from './todo-row';
import type { TodoSchedulePayload } from './types';

export function normalizeTodoSchedulePayload(payload: unknown): TodoSchedulePayload {
  const obj = asObject(payload);
  const items = normalizeTodoItems(obj.items ?? obj.calendar ?? obj.events, 10).sort((a, b) => {
    const left = a.dateStart || a.dueDate || '';
    const right = b.dateStart || b.dueDate || '';
    return left.localeCompare(right);
  });
  return {
    title: stringValue(obj.title, tr('todo.cards.schedule', 'Schedule')),
    date: stringValue(obj.date),
    items,
  };
}

export function TodoScheduleCard({ payload }: { payload: TodoSchedulePayload }) {
  const items = payload.items ?? [];
  const timed = items.filter((item) => item.dateStart || item.dueDate);
  const floating = items.length - timed.length;

  return (
    <CardShell
      eyebrow={tr('todo.cards.schedule', 'Schedule')}
      title={payload.title || tr('todo.cards.schedule', 'Schedule')}
      icon={<CalendarDays className="h-4.5 w-4.5" />}
      meta={formatDate(payload.date) || undefined}
      footer={
        <div className="flex flex-wrap gap-1.5">
          <Pill className="border-border/70 bg-background text-muted-foreground">
            {tr('todo.cards.scheduledCount', '{{count}} scheduled', { count: timed.length })}
          </Pill>
          {floating > 0 ? (
            <Pill className="border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              {tr('todo.cards.unscheduledCount', '{{count}} unscheduled', { count: floating })}
            </Pill>
          ) : null}
        </div>
      }
    >
      {items.length ? (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const time = formatTimeRange(item);
            return (
              <div key={item.id || `${item.title}-${idx}`} className="grid grid-cols-[76px_1fr] gap-2">
                <div className="pt-2 text-right text-[11px] font-medium text-muted-foreground">
                  {time || tr('todo.cards.anytime', 'Anytime')}
                </div>
                <TodoRow item={item} compact />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[12.5px] text-muted-foreground">
          {tr('todo.cards.noSchedule', 'No scheduled items yet.')}
        </p>
      )}
    </CardShell>
  );
}
