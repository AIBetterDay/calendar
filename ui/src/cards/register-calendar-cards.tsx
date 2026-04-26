import { createRoot } from 'react-dom/client';
import type { Host } from '@better/connector-sdk-web';
import { TodoItemCard, normalizeTodoItemPayload } from './todo-item-card';
import { TodoListCard, normalizeTodoListPayload } from './todo-list-card';
import { TodoScheduleCard, normalizeTodoSchedulePayload } from './todo-schedule-card';
import { TodoBulkActionCard, normalizeTodoBulkActionPayload } from './todo-bulk-action-card';

const RENDERERS = [
  {
    kind: 'application/x.calendar-item+json',
    render: (payload: unknown) => <TodoItemCard payload={normalizeTodoItemPayload(payload)} />,
  },
  {
    kind: 'application/x.calendar-list+json',
    render: (payload: unknown) => <TodoListCard payload={normalizeTodoListPayload(payload)} />,
  },
  {
    kind: 'application/x.calendar-schedule+json',
    render: (payload: unknown) => <TodoScheduleCard payload={normalizeTodoSchedulePayload(payload)} />,
  },
  {
    kind: 'application/x.calendar-bulk-action+json',
    render: (payload: unknown) => <TodoBulkActionCard payload={normalizeTodoBulkActionPayload(payload)} />,
  },
] as const;

export function registerCalendarCards(host: Host): void {
  for (const item of RENDERERS) {
    host.chat.contributeMessageRenderer(item.kind, (payload, container) => {
      const root = createRoot(container);
      root.render(item.render(payload));
      return () => root.unmount();
    });
  }
}
