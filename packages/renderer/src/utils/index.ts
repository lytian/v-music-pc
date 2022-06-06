const encodeNames: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#039;': "'",
};
export const decodeName = (str = '') =>
  str?.replace(/(?:&amp;|&lt;|&gt;|&quot;|&apos;|&#039;)/gm, (s) => encodeNames[s]) || '';

export const sizeFormate = (size: number) => {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const number = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, Math.floor(number))).toFixed(2)} ${units[number]}`;
};

export const formatPlayTime = (time: number) => {
  const m = Math.floor(time / 60);
  const s = time % 60;
  return m === 0 && s === 0 ? '--/--' : (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
};

export const formatPlayCount = (num: number) => {
  if (num > 100000000) return (num / 100000000).toFixed(2) + '亿';
  if (num > 10000) return (num / 10000).toFixed(2) + '万';
  return num.toString();
};
