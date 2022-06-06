import type { RequestInit } from 'node-fetch';

export interface RequestConfig extends RequestInit {
  url?: string;
  // 是否忽略取消
  ignoreCancel?: boolean;
  // 重试次数
  retry?: number;
  // 重试间隔，单位：ms
  retryDelay?: number;
  // 重试的零时次数
  __retryCount?: number;
}
