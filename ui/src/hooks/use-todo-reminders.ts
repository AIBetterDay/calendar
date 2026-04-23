import { useEffect } from 'react';
import type { TodoItem } from '../lib/types.js';

/**
 * Electron desktop bridge: forward future reminders to the main process so
 * macOS can fire system notifications (only when the host injects an
 * `electronAPI` global into the iframe — typically through preload).
 *
 * On web the hook is a no-op.
 */
export function useTodoReminders(todos: TodoItem[]): void {
  useEffect(() => {
    const sync = (globalThis as unknown as {
      electronAPI?: { todoReminderSync?: (items: { id: string; title: string; at: string }[]) => Promise<void> | void };
    }).electronAPI?.todoReminderSync;
    if (!sync) return;

    const now = Date.now();
    const items = todos
      .filter((t) => t.reminderEnabled && t.remindAt && t.status !== 'completed' && t.status !== 'cancelled')
      .map((t) => ({ id: t.id, title: t.title.slice(0, 200), at: t.remindAt as string }))
      .filter((x) => {
        const ts = new Date(x.at).getTime();
        return !Number.isNaN(ts) && ts > now;
      });

    void sync(items);
  }, [todos]);
}
