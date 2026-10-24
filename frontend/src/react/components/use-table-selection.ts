import { useCallback, useEffect, useId, useRef } from 'react';

const tables = new Map<string, () => void>();

/** 同unopágina面Solo让当anterior表格保DejaSeleccionar, 批量操作栏因此SoloConuno.  */
export function useTableSelection(clear: () => void) {
  const id = useId();
  const latest = useRef(clear);
  latest.current = clear;
  useEffect(() => {
    tables.set(id, () => latest.current());
    return () => { tables.delete(id); };
  }, [id]);
  return useCallback(() => {
    for (const [other, reset] of tables) if (other !== id) reset();
  }, [id]);
}
