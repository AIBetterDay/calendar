/**
 * Thin host-skill bridge.
 *
 * The connector UI never talks HTTP directly; every read/write goes through
 * the host's central agent (`host.agent.invoke('<connectorId>.<skill>')`).
 * That single channel is what gives the host:
 *   - permission enforcement (no direct DB access from the iframe);
 *   - undo middleware (results that include `_undo` flow into the host stack);
 *   - same-connector skills only; cross-connector work is done by the in-app AI, not iframes.
 *
 * The functions below mirror the legacy `apps/web/src/modules/connectors/todo/api.ts`
 * shape so the page code can be a near-verbatim port.
 */

import type { Host } from '@better/connector-sdk-web';
import type { CreateTodoInput, TodoItem, UpdateTodoInput } from './types.js';

const NAMESPACE = 'todo';

interface ListResult {
  items: TodoItem[];
  meta: { total: number; page: number; pageSize: number };
}

export interface TodoApi {
  list(params?: Record<string, unknown>): Promise<TodoItem[]>;
  get(id: string): Promise<TodoItem>;
  create(input: CreateTodoInput): Promise<TodoItem>;
  update(id: string, patch: UpdateTodoInput): Promise<TodoItem>;
  delete(id: string): Promise<void>;
}

export function makeTodoApi(host: Host): TodoApi {
  const invoke = <T>(name: string, params?: unknown) =>
    host.agent.invoke<T>(`${NAMESPACE}.${name}`, params ?? {});

  return {
    async list(params) {
      const res = await invoke<ListResult>('list', params);
      return res?.items ?? [];
    },
    get: (id) => invoke<TodoItem>('get', { id }),
    create: (input) => invoke<TodoItem>('create', input),
    update: (id, patch) => invoke<TodoItem>('update', { id, ...patch }),
    delete: async (id) => {
      await invoke('delete', { id });
    },
  };
}
