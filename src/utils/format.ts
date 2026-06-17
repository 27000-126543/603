import dayjs from 'dayjs';

export const formatPlateNumber = (plate: string): string => {
  if (!plate) return '';
  return plate.toUpperCase().replace(/\s/g, '');
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatDuration = (minutes: number): string => {
  if (!minutes) return '0分钟';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
  }
  return `${mins}分钟`;
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm:ss');
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    expired: '已过期',
    waiting: '等待中',
    available: '空闲',
    occupied: '已占用',
    reserved: '已预留',
    maintenance: '维护中',
    pending_deduction: '待扣除',
    deducted: '已扣除',
    exempted: '已减免',
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    expired: 'danger',
    waiting: 'warning',
    available: 'success',
    occupied: 'danger',
    reserved: 'primary',
    maintenance: 'neutral',
    pending_deduction: 'warning',
    deducted: 'success',
    exempted: 'neutral',
  };
  return colorMap[status] || 'neutral';
};

export const getRoleText = (role: string): string => {
  const roleMap: Record<string, string> = {
    employee: '员工',
    admin: '行政管理员',
    finance: '财务人员',
  };
  return roleMap[role] || role;
};

export const getSpaceTypeText = (type: string): string => {
  return type === 'fixed' ? '固定车位' : '临时车位';
};

export const getNotificationTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    renewal: '续期提醒',
    approval: '审批通知',
    parking: '车位分配',
    overtime: '超时警告',
    system: '系统通知',
  };
  return typeMap[type] || type;
};

export const generateId = (prefix: string): string => {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export const validatePlateNumber = (plate: string): boolean => {
  const pattern = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]$/;
  return pattern.test(plate.toUpperCase());
};

export const validateIdCard = (id: string): boolean => {
  const pattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  return pattern.test(id);
};

export const validatePhone = (phone: string): boolean => {
  const pattern = /^1[3-9]\d{9}$/;
  return pattern.test(phone);
};

export const getCurrentTime = (): string => {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
};

export const exportToExcel = (
  data: Record<string, any> | any[],
  fileName: string
): void => {
  const { utils, writeFile } = require('xlsx');

  if (Array.isArray(data)) {
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, '数据');
    writeFile(wb, `${fileName}.xlsx`);
  } else {
    const wb = utils.book_new();
    Object.keys(data).forEach((sheetName) => {
      const ws = utils.json_to_sheet(data[sheetName]);
      utils.book_append_sheet(wb, ws, sheetName);
    });
    writeFile(wb, `${fileName}.xlsx`);
  }
};
