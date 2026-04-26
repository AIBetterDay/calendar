import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const zh = {
  translation: {
    todo: {
      viewCalendar: '日历',
      viewList: '列表',
      listEmpty: '这一段时间没有日历',
      listEmptyHint: '切到日历视图右键空白就能新建。',
      listSectionTimed: '有具体时间',
      cards: {
        untitledTodo: '未命名日程',
        todoItem: '日程详情',
        todoList: '日程列表',
        schedule: '日程安排',
        bulkAction: '批量更新',
        reminder: '提醒',
        noCalendar: '暂无日历可展示。',
        noSchedule: '还没有安排到日程的日历。',
        bulkDone: '批量操作已完成。',
        anytime: '任意时间',
        totalCount: '共 {{count}} 个',
        pendingCount: '{{count}} 个待处理',
        completedCount: '{{count}} 个已完成',
        scheduledCount: '{{count}} 个已安排',
        unscheduledCount: '{{count}} 个未安排',
        updatedCount: '{{count}} 个已更新',
        rescheduledCount: '{{count}} 个已改期',
        cancelledCount: '{{count}} 个已取消',
        statusPending: '待处理',
        statusInProgress: '进行中',
        statusCompleted: '已完成',
        statusCancelled: '已取消',
        priorityLow: '低',
        priorityMedium: '中',
        priorityHigh: '高',
        priorityUrgent: '紧急',
      },
    },
    calendar: {
      allDay: '全天',
      todoTitle: '日程',
      titlePlaceholder: '标题',
      color: '配色',
      confirmDeleteTodo: '确定删除此日程？',
      today: '今天',
      viewDay: '日',
      viewWeek: '周',
      viewMonth: '月',
      moreEvents: '+{{count}} 更多',
      repeat: {
        none: '不重复',
        daily: '每天',
        weekdays: '工作日',
        weekly: '每周',
        monthly: '每月',
      },
      ctxCopy: '复制',
      ctxCut: '剪切',
      ctxDuplicate: '创建副本',
      ctxDelete: '删除',
      duplicateTitleSuffix: ' (副本)',
      gridCreateTodo: '新建日程',
      gridPaste: '粘贴',
    },
  },
};

const en = {
  translation: {
    todo: {
      viewCalendar: 'Calendar',
      viewList: 'List',
      listEmpty: 'Nothing on the schedule',
      listEmptyHint: 'Switch to calendar and right-click an empty slot to add one.',
      listSectionTimed: 'Scheduled',
      cards: {
        untitledTodo: 'Untitled calendar item',
        todoItem: 'Calendar item',
        todoList: 'Calendar list',
        schedule: 'Calendar schedule',
        bulkAction: 'Bulk update',
        reminder: 'Reminder',
        noCalendar: 'No calendar to display.',
        noSchedule: 'No scheduled items yet.',
        bulkDone: 'Bulk action completed.',
        anytime: 'Anytime',
        totalCount: '{{count}} total',
        pendingCount: '{{count}} pending',
        completedCount: '{{count}} completed',
        scheduledCount: '{{count}} scheduled',
        unscheduledCount: '{{count}} unscheduled',
        updatedCount: '{{count}} updated',
        rescheduledCount: '{{count}} rescheduled',
        cancelledCount: '{{count}} cancelled',
        statusPending: 'Pending',
        statusInProgress: 'In progress',
        statusCompleted: 'Completed',
        statusCancelled: 'Cancelled',
        priorityLow: 'Low',
        priorityMedium: 'Medium',
        priorityHigh: 'High',
        priorityUrgent: 'Urgent',
      },
    },
    calendar: {
      allDay: 'All day',
      todoTitle: 'Calendar item',
      titlePlaceholder: 'Title',
      color: 'Color',
      confirmDeleteTodo: 'Delete this calendar item?',
      today: 'Today',
      viewDay: 'Day',
      viewWeek: 'Week',
      viewMonth: 'Month',
      moreEvents: '+{{count}} more',
      repeat: {
        none: 'Does not repeat',
        daily: 'Daily',
        weekdays: 'Weekdays',
        weekly: 'Weekly',
        monthly: 'Monthly',
      },
      ctxCopy: 'Copy',
      ctxCut: 'Cut',
      ctxDuplicate: 'Duplicate',
      ctxDelete: 'Delete',
      duplicateTitleSuffix: ' (copy)',
      gridCreateTodo: 'Create calendar item',
      gridPaste: 'Paste',
    },
  },
};

export async function initI18n(initialLocale: string): Promise<void> {
  await i18next.use(initReactI18next).init({
    resources: { zh, en },
    lng: normalizeLocale(initialLocale),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export function setLocale(locale: string): void {
  void i18next.changeLanguage(normalizeLocale(locale));
}

export default i18next;

function normalizeLocale(locale: string): 'zh' | 'en' {
  const lower = (locale || '').toLowerCase();
  if (lower.startsWith('zh')) return 'zh';
  return 'en';
}
