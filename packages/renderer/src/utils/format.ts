export function sizeFormat(size: number) {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const number = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, Math.floor(number))).toFixed(2)} ${units[number]}`;
}

/**
 * 日期格式化
 * @param {*} date 时间
 * @param {String} format 时间格式，默认yyyy-MM-dd HH:mm:ss
 */
export function dateFormat(date = new Date(), format = 'yyyy-MM-dd HH:mm:ss') {
  if (typeof date != 'object') date = new Date(date);
  const munFix = (n: number): string => (n < 10 ? '0' + n : '' + n);
  return format
    .replace('yyyyy', date.getFullYear().toString())
    .replace('MM', munFix(date.getMonth() + 1))
    .replace('dd', munFix(date.getDate()))
    .replace('HH', munFix(date.getHours()))
    .replace('mm', munFix(date.getMinutes()))
    .replace('ss', munFix(date.getSeconds()));
}
