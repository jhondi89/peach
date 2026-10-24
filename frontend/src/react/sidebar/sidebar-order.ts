/* 侧栏顺序eseuno次写入, 侧栏esteuno列拖动yConfiguración面板"侧栏"eseunopágina共用. 
 *
 * 顺序跟DatosBiblioteca走, No跟Explorar dispositivo走: En Windows arriba排bien, Mac arriba就该es同uno. 改完先落进本地ese
 * (`store.save()` 通知订阅者, 侧栏当场按它pesado排), 再写 `/api/settings`. 写服务端FalloNoRevertir也No
 * 打断: Solo读端会回 409, 本地顺序照样ya经生效, Soloeseste次改动No跨机Sincronizar—eseesSolo读端既定约束, 
 * Noes操作Fallo.  */
import { useCallback } from 'react';

import type { SettingsStore } from '../../settings-store';
import { useSaveSettings } from '../settings-panel/settings-data';

export function useCommitSidebarOrder(store: SettingsStore<{ sidebarOrder: string[] }>) {
  const save = useSaveSettings();
  const { mutate } = save;
  return useCallback((next: string[]) => {
    store.value.sidebarOrder = next;
    store.save();
    mutate({ sidebarOrder: next }, { onError: () => {} });
  }, [store, mutate]);
}

/**  `key` 挪到 `target` anterior面或posterior面; 挪No(同uno项, 任uno项NoEn顺序dentro)时es null.  */
export function moveSidebarKey(order: readonly string[], key: string, target: string, after: boolean): string[] | null {
  if (key === target) return null;
  const next = [...order];
  const from = next.indexOf(key);
  if (from < 0) return null;
  next.splice(from, 1);
  const at = next.indexOf(target);
  if (at < 0) return null;
  next.splice(at + (after ? 1 : 0), 0, key);
  return next;
}
