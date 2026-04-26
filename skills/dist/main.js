/**
 * Calendar connector — skill process entry.
 *
 * Skills exposed (all are namespaced as `calendar.<name>` by the host agent):
 *   list           — list/filter pending/completed calendar items
 *   get            — fetch a single row by id
 *   create         — create a new calendar item with schedule-aware time placement
 *   update         — update arbitrary fields; status=completed clears reminders
 *   bulk_update    — apply one patch to many ids
 *   delete         — remove a row
 *
 * Storage: a single SQL table `items`. The host transparently rewrites every
 * reference in the queries below to `c_calendar_items`.
 *
 * Undo: each write skill returns a `_undo` envelope (snapshot + ids). The
 * matching `reverse` handler restores from that envelope, so the host's undo
 * middleware can simply pass the original result back without knowing the
 * connector's schema.
 */
import { connect } from '@better/connector-sdk-server';
import { nanoid } from 'nanoid';
const ALL_COLUMNS = 'id, title, description, priority, status, due_date, date_start, remind_at, ' +
    'reminder_enabled, repeat_rule, parent_id, sort_order, completed_at, color, tags, ' +
    'created_at, updated_at';
function format(row) {
    let tags = [];
    try {
        tags = JSON.parse(row.tags || '[]');
    }
    catch {
        tags = [];
    }
    let repeatRule = { type: 'none' };
    try {
        repeatRule = JSON.parse(row.repeat_rule || '{"type":"none"}');
    }
    catch { /* keep default */ }
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        priority: row.priority,
        status: row.status,
        dueDate: row.due_date,
        dateStart: row.date_start,
        remindAt: row.remind_at,
        reminderEnabled: !!row.reminder_enabled,
        repeatRule,
        parentId: row.parent_id,
        sortOrder: row.sort_order,
        completedAt: row.completed_at,
        color: row.color,
        tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
const conn = await connect();
const { host } = conn;
async function findById(id) {
    const rows = (await host.storage.query(`SELECT ${ALL_COLUMNS} FROM items WHERE id = ?`, [id]));
    return rows[0] ?? null;
}
async function nextSortOrder(parentId) {
    const rows = parentId
        ? (await host.storage.query(`SELECT coalesce(max(sort_order), -1) AS m FROM items WHERE parent_id = ?`, [parentId]))
        : (await host.storage.query(`SELECT coalesce(max(sort_order), -1) AS m FROM items WHERE parent_id IS NULL`));
    return (rows[0]?.m ?? -1) + 1;
}
// ─────────────────────────────────────────────────────────────────────
// Time placement: ported from the legacy create-todo script verbatim.
// Normalises (dateStart, dueDate, remindAt) into "both timed" or "both
// dated" so the calendar always renders a sane window.
// ─────────────────────────────────────────────────────────────────────
const DEFAULT_TODO_DURATION_MIN = 30;
const pad = (n) => String(n).padStart(2, '0');
const fmtLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const hasTime = (v) => !!v && v.includes('T');
const addMinutes = (iso, minutes) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return null;
    return fmtLocal(new Date(d.getTime() + minutes * 60 * 1000));
};
function derivePlacement(input) {
    let dateStart = input.dateStart ?? null;
    let dueDate = input.dueDate ?? null;
    const remindAt = input.remindAt ?? null;
    if (hasTime(dateStart) && !hasTime(dueDate)) {
        dueDate = addMinutes(dateStart, DEFAULT_TODO_DURATION_MIN) ?? dueDate;
    }
    else if (hasTime(dueDate) && !hasTime(dateStart)) {
        dateStart = addMinutes(dueDate, -DEFAULT_TODO_DURATION_MIN) ?? dateStart;
    }
    if (dateStart || dueDate)
        return { dateStart, dueDate };
    if (!remindAt)
        return { dateStart, dueDate };
    if (!hasTime(remindAt))
        return { dateStart: remindAt, dueDate: remindAt };
    const end = addMinutes(remindAt, DEFAULT_TODO_DURATION_MIN);
    if (!end)
        return { dateStart, dueDate };
    return { dateStart: remindAt, dueDate: end };
}
function normalizeNullable(v) {
    if (v === undefined)
        return undefined;
    if (v === null)
        return null;
    if (v === '' || v === 'null')
        return null;
    return v;
}
const MAX_PAGE_SIZE = 2000;
const DEFAULT_PAGE_SIZE = 500;
conn.registerSkill({
    meta: {
        name: 'list',
        description: '列出日历，支持按状态/优先级/日期/tag/过期筛选',
        write: false,
    },
    handler: async (params, _ctx) => {
        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
        const wheres = [];
        const args = [];
        if (params.status) {
            wheres.push('status = ?');
            args.push(params.status);
        }
        if (params.priority) {
            wheres.push('priority = ?');
            args.push(params.priority);
        }
        if (params.dateFrom && params.dateTo) {
            const inRange = `(
        (date_start IS NOT NULL OR due_date IS NOT NULL)
        AND substr(coalesce(date_start, due_date), 1, 10) <= ?
        AND substr(coalesce(due_date, date_start), 1, 10) >= ?
      )`;
            if (params.includeUndated) {
                wheres.push(`(${inRange} OR (date_start IS NULL AND due_date IS NULL))`);
            }
            else {
                wheres.push(inRange);
            }
            args.push(params.dateTo, params.dateFrom);
        }
        else if (params.date) {
            const inDay = `(
        (date_start IS NOT NULL OR due_date IS NOT NULL)
        AND substr(coalesce(date_start, due_date), 1, 10) <= ?
        AND substr(coalesce(due_date, date_start), 1, 10) >= ?
      )`;
            if (params.includeUndated) {
                wheres.push(`(${inDay} OR (date_start IS NULL AND due_date IS NULL))`);
            }
            else {
                wheres.push(inDay);
            }
            args.push(params.date, params.date);
        }
        if (params.overdue) {
            const today = new Date().toISOString().slice(0, 10);
            wheres.push(`(
        (due_date IS NOT NULL AND substr(due_date, 1, 10) < ?)
        OR (due_date IS NULL AND date_start IS NOT NULL AND substr(date_start, 1, 10) < ?)
      )`);
            args.push(today, today);
            wheres.push(`status NOT IN ('completed', 'cancelled')`);
        }
        else if (params.dueBefore) {
            wheres.push(`(
        (due_date IS NOT NULL AND substr(due_date, 1, 10) <= ?)
        OR (due_date IS NULL AND date_start IS NOT NULL AND substr(date_start, 1, 10) <= ?)
      )`);
            args.push(params.dueBefore, params.dueBefore);
            wheres.push(`status NOT IN ('completed', 'cancelled')`);
        }
        if (params.tag) {
            wheres.push('tags LIKE ?');
            args.push(`%"${params.tag}"%`);
        }
        const whereSql = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';
        const offset = (page - 1) * pageSize;
        const items = (await host.storage.query(`SELECT ${ALL_COLUMNS} FROM items ${whereSql}
       ORDER BY parent_id ASC, sort_order ASC, created_at ASC
       LIMIT ? OFFSET ?`, [...args, pageSize, offset]));
        const totalRow = (await host.storage.query(`SELECT count(*) AS c FROM items ${whereSql}`, args));
        return {
            items: items.map(format),
            meta: { total: totalRow[0]?.c ?? 0, page, pageSize },
        };
    },
});
// ─────────────────────────────────────────────────────────────────────
// get
// ─────────────────────────────────────────────────────────────────────
conn.registerSkill({
    meta: {
        name: 'get',
        description: '获取单个日程详情',
        write: false,
        parameters: { id: { type: 'string' } },
    },
    handler: async ({ id }) => {
        const row = await findById(id);
        if (!row) {
            throw Object.assign(new Error('日历事项不存在'), { code: 'rpc.not_found' });
        }
        return format(row);
    },
});
conn.registerSkill({
    meta: {
        name: 'create',
        description: '创建新日历（支持时间窗 + 提醒 + 重复规则）',
        write: true,
        parameters: { title: { type: 'string' } },
        required: ['title'],
    },
    handler: async (input) => {
        if (!input.title || typeof input.title !== 'string') {
            throw Object.assign(new Error('title required'), { code: 'rpc.invalid_params' });
        }
        const ts = new Date().toISOString();
        const parentId = input.parentId ?? null;
        const sortOrder = await nextSortOrder(parentId);
        const { dateStart, dueDate } = derivePlacement(input);
        const id = nanoid();
        const repeatRule = JSON.stringify(input.repeatRule ?? { type: 'none' });
        const tags = JSON.stringify(input.tags ?? []);
        const reminderEnabled = input.reminderEnabled ?? !!input.remindAt;
        await host.storage.sql(`INSERT INTO items
        (id, title, description, priority, status, due_date, date_start, remind_at,
         reminder_enabled, repeat_rule, parent_id, sort_order, completed_at, color, tags,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`, [
            id,
            input.title,
            input.description ?? null,
            input.priority ?? 'medium',
            dueDate,
            dateStart,
            input.remindAt ?? null,
            reminderEnabled ? 1 : 0,
            repeatRule,
            parentId,
            sortOrder,
            input.color ?? null,
            tags,
            ts,
            ts,
        ]);
        const row = await findById(id);
        return { ...format(row), _undo: { id } };
    },
    reverse: async (input) => {
        const id = input?._undo?.id
            ?? input?.id
            ?? null;
        if (!id)
            return;
        await host.storage.sql('DELETE FROM items WHERE id = ?', [id]);
    },
});
conn.registerSkill({
    meta: {
        name: 'update',
        description: '更新日历内容或状态。status=completed 时自动写 completedAt 并清除提醒',
        write: true,
        parameters: { id: { type: 'string' } },
        required: ['id'],
    },
    handler: async (input) => {
        const before = await findById(input.id);
        if (!before) {
            throw Object.assign(new Error('日历事项不存在'), { code: 'rpc.not_found' });
        }
        const sets = ['updated_at = ?'];
        const args = [new Date().toISOString()];
        const push = (col, val) => { sets.push(`${col} = ?`); args.push(val); };
        if (input.title !== undefined)
            push('title', input.title);
        if (input.description !== undefined)
            push('description', input.description);
        if (input.priority !== undefined)
            push('priority', input.priority);
        if (input.status !== undefined) {
            push('status', input.status);
            if (input.status === 'completed') {
                push('completed_at', new Date().toISOString());
                push('reminder_enabled', 0);
                push('remind_at', null);
            }
            else {
                push('completed_at', null);
            }
        }
        if (input.dueDate !== undefined)
            push('due_date', input.dueDate);
        if (input.dateStart !== undefined)
            push('date_start', input.dateStart);
        if (input.remindAt !== undefined)
            push('remind_at', input.remindAt);
        if (input.reminderEnabled !== undefined)
            push('reminder_enabled', input.reminderEnabled ? 1 : 0);
        if (input.repeatRule !== undefined)
            push('repeat_rule', JSON.stringify(input.repeatRule));
        if (input.parentId !== undefined)
            push('parent_id', input.parentId);
        if (input.sortOrder !== undefined)
            push('sort_order', input.sortOrder);
        if (input.color !== undefined)
            push('color', input.color);
        if (input.tags !== undefined)
            push('tags', JSON.stringify(input.tags));
        args.push(input.id);
        await host.storage.sql(`UPDATE items SET ${sets.join(', ')} WHERE id = ?`, args);
        const after = await findById(input.id);
        return { ...format(after), _undo: { snapshot: before } };
    },
    reverse: async (input) => {
        const snap = input?._undo?.snapshot
            ?? input?.snapshot;
        if (!snap?.id)
            return;
        await restoreRow(snap);
    },
});
conn.registerSkill({
    meta: {
        name: 'bulk_update',
        description: '批量更新日历：一次改期、批量完成/取消、批量改优先级或 tag',
        write: true,
        parameters: { ids: { type: 'array', items: { type: 'string' } } },
        required: ['ids'],
    },
    handler: async (params) => {
        const ids = Array.isArray(params.ids) ? params.ids.filter((id) => typeof id === 'string' && id) : [];
        const snapshots = [];
        if (ids.length === 0) {
            return { updated: 0, skipped: 0, items: [], _undo: { snapshots } };
        }
        const now = new Date().toISOString();
        const addTags = Array.isArray(params.addTags) ? params.addTags.filter(Boolean) : [];
        const removeTags = Array.isArray(params.removeTags) ? params.removeTags.filter(Boolean) : [];
        let updated = 0;
        let skipped = 0;
        const items = [];
        for (const id of ids) {
            const before = await findById(id);
            if (!before) {
                skipped += 1;
                continue;
            }
            snapshots.push(before);
            const sets = ['updated_at = ?'];
            const args = [now];
            const push = (col, val) => { sets.push(`${col} = ?`); args.push(val); };
            if (params.status !== undefined) {
                push('status', params.status);
                if (params.status === 'completed') {
                    push('completed_at', now);
                    push('reminder_enabled', 0);
                    push('remind_at', null);
                }
                else {
                    push('completed_at', null);
                }
            }
            if (params.priority !== undefined)
                push('priority', params.priority);
            const due = normalizeNullable(params.dueDate ?? undefined);
            if (due !== undefined)
                push('due_date', due);
            const ds = normalizeNullable(params.dateStart ?? undefined);
            if (ds !== undefined)
                push('date_start', ds);
            const ra = normalizeNullable(params.remindAt ?? undefined);
            if (ra !== undefined)
                push('remind_at', ra);
            if (params.reminderEnabled !== undefined)
                push('reminder_enabled', params.reminderEnabled ? 1 : 0);
            if (params.color !== undefined)
                push('color', params.color);
            if (addTags.length || removeTags.length) {
                let tags = [];
                try {
                    tags = JSON.parse(before.tags || '[]');
                }
                catch {
                    tags = [];
                }
                const set = new Set(tags);
                for (const t of removeTags)
                    set.delete(t);
                for (const t of addTags)
                    set.add(t);
                push('tags', JSON.stringify([...set]));
            }
            args.push(id);
            await host.storage.sql(`UPDATE items SET ${sets.join(', ')} WHERE id = ?`, args);
            const after = await findById(id);
            if (after) {
                updated += 1;
                items.push(format(after));
            }
            else {
                skipped += 1;
            }
        }
        return { updated, skipped, items, _undo: { snapshots } };
    },
    reverse: async (input) => {
        const snaps = input?._undo?.snapshots
            ?? input?.snapshots
            ?? [];
        for (const snap of snaps) {
            if (snap?.id)
                await restoreRow(snap);
        }
    },
});
conn.registerSkill({
    meta: {
        name: 'delete',
        description: '删除日历（host undo 框架可还原）',
        write: true,
        parameters: { id: { type: 'string' } },
        required: ['id'],
    },
    handler: async ({ id }) => {
        const before = await findById(id);
        if (!before) {
            throw Object.assign(new Error('日历事项不存在'), { code: 'rpc.not_found' });
        }
        await host.storage.sql('DELETE FROM items WHERE id = ?', [id]);
        return { deleted: true, _undo: { snapshot: before } };
    },
    reverse: async (input) => {
        const snap = input?._undo?.snapshot
            ?? input?.snapshot;
        if (!snap?.id)
            return;
        await restoreRow(snap);
    },
});
conn.registerSkill({
    meta: {
        name: 'host_mention_hits',
        description: 'Host @-mention：日历标题',
        write: false,
    },
    handler: async (params) => {
        const limit = Math.min(30, Math.max(1, params.limit ?? 6));
        const q = (params.q ?? '').trim();
        const rows = !q
            ? (await host.storage.query(`SELECT ${ALL_COLUMNS} FROM items ORDER BY updated_at DESC LIMIT ?`, [limit]))
            : (await host.storage.query(`SELECT ${ALL_COLUMNS} FROM items WHERE title LIKE ? ORDER BY updated_at DESC LIMIT ?`, [`%${q}%`, limit]));
        return {
            hits: rows.map((r) => ({
                kind: 'calendar',
                id: r.id,
                title: r.title,
                connectorId: 'calendar',
                subtitle: '日历',
                updatedAt: r.updated_at,
            })),
        };
    },
});
// ─────────────────────────────────────────────────────────────────────
// shared snapshot restore (used by update / delete / bulk_update reverse)
// ─────────────────────────────────────────────────────────────────────
async function restoreRow(row) {
    const existing = await findById(row.id);
    if (existing) {
        await host.storage.sql(`UPDATE items SET
         title = ?, description = ?, priority = ?, status = ?,
         due_date = ?, date_start = ?, remind_at = ?, reminder_enabled = ?,
         repeat_rule = ?, parent_id = ?, sort_order = ?, completed_at = ?,
         color = ?, tags = ?, created_at = ?, updated_at = ?
       WHERE id = ?`, [
            row.title, row.description, row.priority, row.status,
            row.due_date, row.date_start, row.remind_at, row.reminder_enabled,
            row.repeat_rule, row.parent_id, row.sort_order, row.completed_at,
            row.color, row.tags, row.created_at, row.updated_at,
            row.id,
        ]);
    }
    else {
        await host.storage.sql(`INSERT INTO items
        (id, title, description, priority, status, due_date, date_start, remind_at,
         reminder_enabled, repeat_rule, parent_id, sort_order, completed_at, color, tags,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            row.id, row.title, row.description, row.priority, row.status,
            row.due_date, row.date_start, row.remind_at, row.reminder_enabled,
            row.repeat_rule, row.parent_id, row.sort_order, row.completed_at,
            row.color, row.tags, row.created_at, row.updated_at,
        ]);
    }
}
// ─────────────────────────────────────────────────────────────────────
// Prompt
// ─────────────────────────────────────────────────────────────────────
conn.registerPrompt([
    '## 【Calendar 指南】',
    '核心：把用户想法落成可执行日程，并**在日历上能被看见**。',
    '',
    '关键规则：',
    '- 用户给了**具体时间点**（"10 点提醒我 X"、"明早 8 点"）→ **只填 dateStart 和 remindAt**（都是 `YYYY-MM-DDTHH:mm`）。**不要填 dueDate**——后端会自动补一个 30 分钟窗口；你手动塞一个纯日期的 dueDate 会让日历把这条画成整天长条。',
    '- 只需要提醒不需要具体时长（"下周二去医院"）→ 只填 dateStart（可含时间或仅日期），dueDate 留空。',
    '- 日期格式用 ISO：仅日期 `YYYY-MM-DD`，带时间 `YYYY-MM-DDTHH:mm`（本地时区，不要带 Z）。**不要给一边带 T，另一边不带 T 的混合格式。**',
    '- 用户说"完成了 X" → `calendar.update` 把 status 设为 `completed`，不要新建。',
    '- 小颗粒"帮我记一下" → 直接 `calendar.create`，不走 plan_card。',
    '- 不要为了"先确认一下有没有重复"而额外调用 `calendar.list`——重复不是问题，啰嗦才是。',
    '',
    '创建成功后的回复：',
    '- UI 已经有一条"日程创建成功"的图标状态行作为系统反馈——你不需要再重复"我已创建 / 加好了 / 记下了"。',
    '- 但要**用自然语言把事件本身讲清**：标题 + 具体时间（"明早 8 点"而非 ISO）+ 提醒状态。1 句，有温度，不煽情。',
].join('\n'));
