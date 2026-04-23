import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const zh = {
  translation: {
    todo: {
      viewCalendar: '日历',
      viewList: '列表',
      listEmpty: '这一段时间没有待办',
      listEmptyHint: '切到日历视图右键空白就能新建。',
      listSectionTimed: '有具体时间',
    },
    calendar: {
      allDay: '全天',
      todoTitle: '待办',
      titlePlaceholder: '标题',
      color: '配色',
      confirmDeleteTodo: '确定删除此待办？',
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
      gridCreateTodo: '新建待办',
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
    },
    calendar: {
      allDay: 'All day',
      todoTitle: 'Todo',
      titlePlaceholder: 'Title',
      color: 'Color',
      confirmDeleteTodo: 'Delete this todo?',
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
      gridCreateTodo: 'Create todo',
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

function normalizeLocale(locale: string): 'zh' | 'en' {
  const lower = (locale || '').toLowerCase();
  if (lower.startsWith('zh')) return 'zh';
  return 'en';
}
