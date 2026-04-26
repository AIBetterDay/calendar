import { Bell, CalendarClock, CheckCircle2, Circle, Repeat2, Tag } from 'lucide-react';
import { Pill } from './card-shell';
import {
  formatTimeRange,
  priorityLabel,
  priorityTone,
  statusLabel,
  tr,
} from './card-utils';
import type { TodoCardItem } from './types';

export function TodoRow({ item, compact = false }: { item: TodoCardItem; compact?: boolean }) {
  const done = item.status === 'completed';
  const time = formatTimeRange(item);
  const tags = item.tags ?? [];

  return (
    <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2">
      <div className="flex items-start gap-2">
        {done ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        ) : (
          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h4 className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {item.title || tr('todo.cards.untitledTodo', 'Untitled calendar item')}
            </h4>
            <Pill className={priorityTone(item.priority)}>{priorityLabel(item.priority)}</Pill>
          </div>
          {!compact && item.description ? (
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-foreground/70">
              {item.description}
            </p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <Pill className="border-border/60 bg-muted/30 text-muted-foreground">{statusLabel(item.status)}</Pill>
            {time ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {time}
              </span>
            ) : null}
            {item.reminderEnabled || item.remindAt ? (
              <span className="inline-flex items-center gap-1">
                <Bell className="h-3 w-3" />
                {item.remindAt ? formatTimeRange({ ...item, dateStart: item.remindAt, dueDate: item.remindAt }) : tr('todo.cards.reminder', 'Reminder')}
              </span>
            ) : null}
            {typeof item.repeatRule === 'object' && item.repeatRule?.type && item.repeatRule.type !== 'none' ? (
              <span className="inline-flex items-center gap-1">
                <Repeat2 className="h-3 w-3" />
                {item.repeatRule.type}
              </span>
            ) : null}
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
