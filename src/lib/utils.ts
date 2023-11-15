import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { CustomEventService } from '@/lib/event-source';
import { OPENAI_COMPLETION_API_ENDPOINT } from '@/lib/urls';
import {} from '@/lib/constants';
import { AbortSignal } from '@/lib/abort-controller';

export interface XHRParams {
  payload: any;
  signal?: AbortSignal;
  onMessage: (d?: any) => any;
  onEnd: (d?: any) => any;
  onError: (d?: any) => any;
  xhr?: XMLHttpRequest;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const schemaFinder = (schemaStr: string) => {
  const firstIndex = schemaStr.indexOf('{');
  const lastIndex = schemaStr.lastIndexOf('}');

  if (firstIndex == -1 || lastIndex == -1 || firstIndex >= lastIndex) {
    throw new Error('Invalid schema string');
  }

  const extractedSchema = schemaStr.substring(firstIndex, lastIndex + 1);
  return JSON.parse(extractedSchema);
};
export const getGPTResponseSSE = ({
  payload,
  onMessage,
  onEnd,
  onError,
  signal,
  xhr,
}: XHRParams) => {
  return new Promise((resolve, reject) => {
    const se = new CustomEventService(OPENAI_COMPLETION_API_ENDPOINT, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
      xhr,
    });

    se.addEventListener('message', async (msg: any) => {
      if (msg.data === '[DONE]') {
        await onEnd(msg);
        se.close();

        resolve(se);
        return;
      }
      onMessage(msg);
    });

    se.addEventListener('error', (msg: any) => {
      onError(msg);
      se.close();
      reject();
    });

    se.stream();
  });
};
