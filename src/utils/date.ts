import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export const dayjsLocal = dayjs;

export const getToday = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const getCurrentTime = (): string => {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
};

export const getMonthStart = (): string => {
  return dayjs().startOf('month').format('YYYY-MM-DD');
};

export const getMonthEnd = (): string => {
  return dayjs().endOf('month').format('YYYY-MM-DD');
};

export const getDateBeforeDays = (days: number): string => {
  return dayjs().subtract(days, 'day').format('YYYY-MM-DD');
};

export const getDateAfterDays = (days: number): string => {
  return dayjs().add(days, 'day').format('YYYY-MM-DD');
};

export const getDateAfterMonths = (months: number): string => {
  return dayjs().add(months, 'month').format('YYYY-MM-DD');
};

export const getDaysBetween = (start: string | Date, end: string | Date): number => {
  return dayjs(end).diff(dayjs(start), 'day');
};

export const getMinutesBetween = (start: string | Date, end: string | Date): number => {
  return Math.ceil(dayjs(end).diff(dayjs(start), 'minute', true));
};

export const isDateExpired = (date: string | Date): boolean => {
  return dayjs().isAfter(dayjs(date));
};

export const isDateWithinDays = (date: string | Date, days: number): boolean => {
  const target = dayjs(date);
  const now = dayjs();
  return target.isAfter(now) && target.isBefore(now.add(days, 'day'));
};

export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

export const getDateRangeArray = (start: string | Date, end: string | Date): string[] => {
  const result: string[] = [];
  let current = dayjs(start);
  const last = dayjs(end);
  while (current.isBefore(last) || current.isSame(last, 'day')) {
    result.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }
  return result;
};

export const getLastNDays = (n: number): string[] => {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    result.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return result;
};

export const getCurrentMonth = (): string => {
  return dayjs().format('YYYY-MM');
};

export const getMonthList = (count: number): string[] => {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
  }
  return result;
};

export const daysUntil = (date: string | Date): number => {
  return dayjs(date).diff(dayjs(), 'day');
};
