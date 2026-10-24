/* 卡片yTarea面共用eseuno读取yEstado迁移判断. 
 *
 * 两处读同uno `queryKey`, 轮询由 Query 合成uno; aquí额exterior盯住"esteuno趟esNoesEn本次
 * 眼anterior跑完". Tarea关掉página面照样En跑, Estadodentro常年躺着Anterior趟回执: primero屏读到终态Sin
 * AnteriorEstado, 所以它No会被当成刚刚跑完, 也No发回执.  */
import { useEffect, useRef, useState } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { LibraryProcessingProps } from '../bundle';
import {
  announceCompletion, fetchLibraryProcessing, LIBRARY_PROCESSING_KEY, pollInterval,
  processingActive, type LibraryProcessingData,
} from './library-processing';

export interface LibraryProcessingJob {
  job: UseQueryResult<LibraryProcessingData>;
  /** 本次亲眼ver着跑完eseuno趟. primero屏读到antiguo终态No会走到aquí.  */
  settled: LibraryProcessingData | null;
  /** 又发起uno趟: Anterior趟结论No再DejaEn屏幕arriba.  */
  forget(): void;
}

export function useLibraryProcessingJob(
  { toast, mode, monitor }: LibraryProcessingProps,
): LibraryProcessingJob {
  const watching = mode === 'notice' || !!monitor;
  const job = useQuery({
    queryKey: LIBRARY_PROCESSING_KEY,
    queryFn: ({ signal }) => fetchLibraryProcessing(signal),
    refetchInterval: (query) => pollInterval(query.state.data, watching),
  });
  const [settled, setSettled] = useState<LibraryProcessingData | null>(null);
  const previous = useRef<string | undefined>(undefined);
  const state = job.data;
  useEffect(() => {
    if (!state) return;
    const was = previous.current;
    previous.current = state.status;
    const witnessed = !!was && ['running', 'pausing', 'paused'].includes(was) && !processingActive(state);
    if (witnessed) setSettled(state);
    /* Tarea面还要认"刚Terminar": primero次引导eseuno趟常En跳到Directoriopágina之anterior就跑完, 它从没见过
       "运行en proceso". 卡片Solo认自己ver着跑完eseuno趟.  */
    if (witnessed || mode === 'notice') announceCompletion(state, toast, witnessed);
  }, [state, mode, toast]);

  return { job, settled, forget: () => setSettled(null) };
}
