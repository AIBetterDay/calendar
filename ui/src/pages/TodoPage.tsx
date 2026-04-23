import { useState, useMemo, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, addMinutes } from 'date-fns';
import { CalendarDays, List } from 'lucide-react';
import { cn } from '@better/connector-ui-primitives';
import {
  Calendar,
  CalendarHeader,
  EventContextMenu,
  EventPopover,
  HOUR_HEIGHT,
  getViewDateRange,
  todosToCalendarEvents,
  type CalendarEvent,
  type CalendarView,
  type EventClipboardAction,
  type SelectionSlot,
} from '@better/connector-calendar';
import { TodoListView } from '../components/TodoListView.js';
import { useTodoReminders } from '../hooks/use-todo-reminders.js';
import { buildCreateFromTodo, normalizeTodo } from '../lib/normalize.js';
import type { TodoApi } from '../lib/api.js';
import type { CreateTodoInput, TodoItem, UpdateTodoInput } from '../lib/types.js';

interface TodoPageProps {
  api: TodoApi;
}

/** 1 minute → grid Y px. HOUR_HEIGHT = 60, so effectively 1:1 — kept explicit. */
const MIN_TO_Y = HOUR_HEIGHT / 60;

type ViewMode = 'calendar' | 'list';

/**
 * Faithful port of the legacy `apps/web/src/modules/connectors/todo/pages/todo-page.tsx`
 * — same state machine, same handlers, same calendar/list interaction surface.
 *
 * The only behavioral changes versus the legacy page:
 *   - data layer: `api` is the host-skill bridge (no HTTP) instead of fetch.
 *   - Goals coupling removed (no `goalId` in patches/creates).
 */
export function TodoPage({ api }: TodoPageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const calendarClipRef = useRef<CreateTodoInput | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('day');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createDraft, setCreateDraft] = useState<{ start: Date; end: Date } | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null);
  const [selectionSlot, setSelectionSlot] = useState<SelectionSlot | null>(null);

  const dateRange = useMemo(() => getViewDateRange(currentDate, currentView), [currentDate, currentView]);
  const params = useMemo<Record<string, unknown>>(() => ({
    dateFrom: format(dateRange.start, 'yyyy-MM-dd'),
    dateTo: format(dateRange.end, 'yyyy-MM-dd'),
    includeUndated: true,
  }), [dateRange]);

  const { data } = useQuery({
    queryKey: ['todos', params],
    queryFn: async () => {
      const items = await api.list(params);
      return items.map((raw) => normalizeTodo(raw as unknown as Record<string, unknown>));
    },
  });

  const todos = data ?? [];
  useTodoReminders(todos);
  const events = useMemo(() => todosToCalendarEvents(todos), [todos]);

  const popoverEvent = useMemo(() => {
    if (!selectedEvent) return null;
    return events.find((e) => e.id === selectedEvent.id) ?? selectedEvent;
  }, [selectedEvent, events]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['todos'] });
  const createMut = useMutation({
    mutationFn: async (input: CreateTodoInput) => {
      const created = await api.create(input);
      return normalizeTodo(created as unknown as Record<string, unknown>);
    },
    onSuccess: invalidate,
  });
  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTodoInput }) => api.update(id, patch),
    onSuccess: invalidate,
  });
  const deleteMut = useMutation({ mutationFn: (id: string) => api.delete(id), onSuccess: invalidate });

  const handleEventClick = useCallback((ev: CalendarEvent, mx: number, my: number) => {
    setCtxMenu(null);
    setCreateDraft(null);
    setSelectionSlot(null);
    setSelectedEvent(ev);
    setPopoverAnchor({ x: mx, y: my });
  }, []);

  const handleEventContextMenu = useCallback((ev: CalendarEvent, mx: number, my: number) => {
    setSelectedEvent(null);
    setPopoverAnchor(null);
    setCreateDraft(null);
    setCtxMenu({ event: ev, x: mx, y: my });
  }, []);

  const handleSlotClick = useCallback((start: Date, end: Date, slot: SelectionSlot, mx: number, my: number) => {
    setCtxMenu(null);
    setSelectedEvent(null);
    setCreateDraft({ start, end });
    setPopoverAnchor({ x: mx, y: my });
    setSelectionSlot(slot);
  }, []);

  const handleEmptyGridContextMenu = useCallback((payload: { dayIndex: number; start: Date; end: Date; mouseX: number; mouseY: number }) => {
    const start = payload.start;
    const end = addMinutes(start, 30);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const startY = startMin * MIN_TO_Y;
    const endY = startY + 30 * MIN_TO_Y;
    setCtxMenu(null);
    setSelectedEvent(null);
    setCreateDraft({ start, end });
    setPopoverAnchor({ x: payload.mouseX, y: payload.mouseY });
    setSelectionSlot({ dayIndex: payload.dayIndex, startY, endY });
  }, []);

  const handleEmptyAllDayContextMenu = useCallback((day: Date, mx: number, my: number) => {
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 0);
    setCtxMenu(null);
    setSelectedEvent(null);
    setCreateDraft({ start, end });
    setPopoverAnchor({ x: mx, y: my });
    setSelectionSlot(null);
  }, []);

  const handlePopoverCreate = useCallback(async (input: CreateTodoInput) => {
    const todo = await createMut.mutateAsync(input);
    setCreateDraft(null);
    setSelectionSlot(null);
    const ev = todosToCalendarEvents([todo])[0];
    if (ev) setSelectedEvent(ev);
  }, [createMut]);

  const handleToggleComplete = useCallback((ev: CalendarEvent) => {
    updateMut.mutate({ id: ev.id, patch: { status: ev.status === 'completed' ? 'pending' : 'completed' } });
  }, [updateMut]);

  const handlePatch = useCallback((id: string, patch: UpdateTodoInput) => {
    updateMut.mutate({ id, patch });
  }, [updateMut]);

  const patchTodoDatesInCache = useCallback((eventId: string, newStart: Date, newEnd: Date) => {
    const ds = format(newStart, "yyyy-MM-dd'T'HH:mm");
    const de = format(newEnd, "yyyy-MM-dd'T'HH:mm");
    queryClient.setQueryData<TodoItem[]>(['todos', params], (old) => {
      if (!old) return old;
      return old.map((row) => (row.id === eventId ? { ...row, dateStart: ds, dueDate: de } : row));
    });
  }, [queryClient, params]);

  const handleEventDrop = useCallback((eventId: string, newStart: Date, newEnd: Date) => {
    patchTodoDatesInCache(eventId, newStart, newEnd);
    updateMut.mutate({ id: eventId, patch: { dateStart: format(newStart, "yyyy-MM-dd'T'HH:mm"), dueDate: format(newEnd, "yyyy-MM-dd'T'HH:mm") } });
  }, [updateMut, patchTodoDatesInCache]);

  const handleEventResize = useCallback((eventId: string, newStart: Date, newEnd: Date) => {
    patchTodoDatesInCache(eventId, newStart, newEnd);
    updateMut.mutate({ id: eventId, patch: { dateStart: format(newStart, "yyyy-MM-dd'T'HH:mm"), dueDate: format(newEnd, "yyyy-MM-dd'T'HH:mm") } });
  }, [updateMut, patchTodoDatesInCache]);

  const handleContextMenuAction = useCallback((action: EventClipboardAction, ev: CalendarEvent) => {
    const todo = ev.raw as TodoItem;
    if (action === 'delete') {
      deleteMut.mutate(todo.id);
      return;
    }
    if (action === 'copy') {
      calendarClipRef.current = buildCreateFromTodo(todo);
      return;
    }
    if (action === 'cut') {
      calendarClipRef.current = buildCreateFromTodo(todo);
      deleteMut.mutate(todo.id);
      return;
    }
    if (action === 'duplicate') {
      void (async () => {
        try {
          const input = buildCreateFromTodo(todo);
          const baseTitle = input.title?.trim() || ' ';
          await createMut.mutateAsync({
            ...input,
            title: baseTitle + t('calendar.duplicateTitleSuffix'),
          });
        } catch {
          /* ignore */
        }
      })();
    }
  }, [createMut, deleteMut, t]);

  const handleClosePopover = useCallback((currentTitle?: string) => {
    const ev = selectedEvent;
    setSelectedEvent(null);
    setPopoverAnchor(null);
    setCreateDraft(null);
    setSelectionSlot(null);
    if (ev) {
      const trimmed = (currentTitle ?? '').trim();
      if (!trimmed) {
        deleteMut.mutate(ev.id);
      } else {
        const todo = ev.raw as TodoItem;
        if (trimmed !== (todo.title ?? '').trim()) {
          updateMut.mutate({ id: ev.id, patch: { title: trimmed } });
        }
      }
    }
  }, [selectedEvent, deleteMut, updateMut]);

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  const handleListOpenDetail = useCallback((ev: CalendarEvent, mx: number, my: number) => {
    setCtxMenu(null);
    setCreateDraft(null);
    setSelectionSlot(null);
    setSelectedEvent(ev);
    setPopoverAnchor({ x: mx, y: my });
  }, []);

  const showPopover = Boolean(popoverAnchor && (popoverEvent || createDraft));

  const viewToggle = (
    <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
      <button
        type="button"
        aria-label={t('todo.viewCalendar')}
        title={t('todo.viewCalendar')}
        onClick={() => setViewMode('calendar')}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md transition-all',
          viewMode === 'calendar'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <CalendarDays className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label={t('todo.viewList')}
        title={t('todo.viewList')}
        onClick={() => setViewMode('list')}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md transition-all',
          viewMode === 'list'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <List className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {viewMode === 'calendar' ? (
        <Calendar
          headerLeftExtra={viewToggle}
          events={events}
          selectionSlot={selectionSlot}
          defaultView={currentView}
          defaultDate={currentDate}
          onEventClick={handleEventClick}
          onEventContextMenu={handleEventContextMenu}
          onToggleComplete={handleToggleComplete}
          onSlotClick={handleSlotClick}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onEmptyAllDayContextMenu={handleEmptyAllDayContextMenu}
          onEmptyGridContextMenu={handleEmptyGridContextMenu}
          onDateChange={setCurrentDate}
          onViewChange={setCurrentView}
        />
      ) : (
        <>
          <CalendarHeader
            date={currentDate}
            view={currentView}
            onDateChange={setCurrentDate}
            onViewChange={setCurrentView}
            leftExtra={viewToggle}
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            <TodoListView
              events={events}
              onToggleComplete={handleToggleComplete}
              onOpenDetail={handleListOpenDetail}
            />
          </div>
        </>
      )}

      {showPopover && (
        <EventPopover
          event={popoverEvent}
          createDraft={createDraft}
          anchorPos={popoverAnchor}
          onClose={handleClosePopover}
          onPatch={handlePatch}
          onCreate={handlePopoverCreate}
          onAbandonCreate={() => setCreateDraft(null)}
        />
      )}

      <EventContextMenu
        event={ctxMenu?.event ?? null}
        position={ctxMenu ? { x: ctxMenu.x, y: ctxMenu.y } : null}
        onClose={closeCtxMenu}
        onAction={handleContextMenuAction}
      />
    </div>
  );
}
