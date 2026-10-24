/* 用户触发Por favor求: 同uno分区同uno时刻Solo跑uno, 离开página面CancelarEsperando, ResultadoSolo交给仍挂载组件. 
 * 忙态落En触发它ese按钮arriba, 同uno分区en la几按 key 区分.  */
import { useEffect, useRef, useState } from 'react';

import { errorMessage } from '../../api';

export function useAction(initialError = '') {
  const pending = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState(initialError);
  useEffect(() => () => pending.current?.abort(), []);

  async function run<T>(key: string, work: (signal: AbortSignal) => Promise<T>, done: (result: T) => void,
    failed?: (cause: unknown) => void) {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(key);
    setError('');
    try {
      const result = await work(controller.signal);
      if (!controller.signal.aborted) done(result);
    } catch (cause) {
      if (controller.signal.aborted) return;
      if (failed) failed(cause); else setError(errorMessage(cause));
    } finally {
      if (pending.current === controller) pending.current = null;
      if (!controller.signal.aborted) setBusy('');
    }
  }

  return { run, busy, error, setError };
}

export { busyProps } from './busy-props';
