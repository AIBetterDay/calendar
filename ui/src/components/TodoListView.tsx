import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Settings2, GitBranch } from 'lucide-react';
import { cn } from '@better/connector-ui-primitives';
import { format, type CalendarEvent } from '@better/connector-calendar';

interface TodoListViewProps {
  events: CalendarEvent[];
  onToggleComplete: (event: CalendarEvent) => void;
  onOpenDetail: (event: CalendarEvent, mouseX: number, mouseY: number) => void;
}

/**
 * List view: a 1:1 port of the legacy `TodoListView`. All-day items render
 * first, then a divider, then timed items sorted by start time. Hovering a
 * row reveals the gear button which opens the same popover the calendar uses.
 */
export function TodoListView({ events, onToggleComplete, onOpenDetail }: TodoListViewProps) {
  const { t } = useTranslation();

  const { allDay, timed } = useMemo(() => {
    const ad: CalendarEvent[] = [];
    const td: CalendarEvent[] = [];
    for (const ev of events) {
      if (ev.allDay) ad.push(ev);
      else td.push(ev);
    }
    ad.sort((a, b) => a.start.getTime() - b.start.getTime() || a.title.localeCompare(b.title));
    td.sort((a, b) => a.start.getTime() - b.start.getTime() || a.title.localeCompare(b.title));
    return { allDay: ad, timed: td };
  }, [events]);

  if (allDay.length === 0 && timed.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">{t('todo.listEmpty')}</p>
        <p className="mt-1 text-xs text-muted-foreground/70">{t('todo.listEmptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {allDay.length > 0 && (
        <Section label={t('calendar.allDay')}>
          {allDay.map((ev) => (
            <ListRow key={ev.id} event={ev} onToggleComplete={onToggleComplete} onOpenDetail={onOpenDetail} />
          ))}
        </Section>
      )}

      {allDay.length > 0 && timed.length > 0 && (
        <div className="my-2 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
            {t('todo.listSectionTimed')}
          </span>
          <div className="h-px flex-1 bg-border/50" />
        </div>
      )}

      {timed.length > 0 && (
        <Section label={allDay.length === 0 ? t('todo.listSectionTimed') : undefined}>
          {timed.map((ev) => (
            <ListRow key={ev.id} event={ev} onToggleComplete={onToggleComplete} onOpenDetail={onOpenDetail} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div>
      {label ? (
        <div className="mb-1.5 px-2 text-[11px] uppercase tracking-wider text-muted-foreground/70">
          {label}
        </div>
      ) : null}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ListRow({
  event,
  onToggleComplete,
  onOpenDetail,
}: {
  event: CalendarEvent;
  onToggleComplete: (event: CalendarEvent) => void;
  onOpenDetail: (event: CalendarEvent, mouseX: number, mouseY: number) => void;
}) {
  const isDone = event.status === 'completed';
  const color = event.color ?? '#3b82f6';

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
        'hover:bg-muted/60',
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDetail(event, e.clientX, e.clientY);
        }}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-opacity',
          'opacity-0 hover:bg-accent hover:text-foreground group-hover:opacity-100',
        )}
      >
        <Settings2 className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(event);
        }}
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors',
          isDone ? 'text-primary-foreground' : 'hover:border-primary/60',
        )}
        style={{
          borderColor: isDone ? color : color + '66',
          backgroundColor: isDone ? color : 'transparent',
        }}
      >
        {isDone && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
      </button>

      <button
        type="button"
        onClick={(e) => onOpenDetail(event, e.clientX, e.clientY)}
        className="min-w-0 flex-1 text-left"
      >
        <span
          className={cn(
            'flex items-center gap-1.5 truncate text-[14px] leading-snug',
            isDone && 'text-muted-foreground line-through',
          )}
        >
          {event.isChild && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full opacity-60"
              style={{ backgroundColor: isDone ? undefined : color }}
              aria-hidden
            />
          )}
          <span className="truncate">{event.title}</span>
          {event.childCount && event.childCount > 0 ? (
            <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              {event.childCount}
            </span>
          ) : null}
        </span>
      </button>

      {!event.allDay ? (
        <span
          className={cn(
            'shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground',
            isDone && 'line-through',
          )}
        >
          {format(event.start, 'HH:mm')}–{format(event.end, 'HH:mm')}
        </span>
      ) : null}
    </div>
  );
}
