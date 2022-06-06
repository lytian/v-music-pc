import { Response } from 'node-fetch';
import fetch from 'node-fetch';
import { RequestConfig } from './options';
import { responseMsg } from './message';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function request(url: string, config?: RequestConfig): Promise<Response> {
  // 设置默认config
  config = {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36',
    },
    ignoreCancel: false,
    retry: 2,
    retryDelay: 200,
    ...config,
    url: url,
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    console.error(err);
    if (err.name === 'FetchError') {
      if (err.message === 'socket hang up') {
        err.message = responseMsg.unachievable;
      }
      switch (err.code) {
        case 'ETIMEDOUT':
        case 'ESOCKETTIMEDOUT':
          err.message = responseMsg.timeout;
        case 'ENOTFOUND':
          err.message = responseMsg.notConnectNetwork;
      }

      if (!config || !config.retry) {
        throw err;
      }
      config.__retryCount = config.__retryCount || 0;
      // Check if we've maxed out the total number of retries
      if (config.__retryCount >= config.retry) {
        throw err;
      }
      // Increase the retry count
      config.__retryCount += 1;
      await sleep(config.retryDelay || 1);
      await request(url, config);
    }
    throw err;
  }
  return response;
}
