/* Configuración偏bieny Peach Configuracióntres服务端Datos, 各uno Query Clave. 
 *
 * - `['settings']`: 跟DatosBiblioteca走, 所ConAcceder端同unoese几项(`/api/settings`, `src/peach/web_settings.py`). 
 *   面板每次Abrir都pesado取uno次, 取回来交给壳对账(`host.syncRemote`): 界面偏bien真相仍es壳dentroeseuno
 *   `appSettings`, esteClaveSoloesDatosBibliotecaese边rápido照. 写入同样走este端点, Éxitoposterior回来Completo写回esteClave. 
 * - `['follow-schedule']`: este机Dispositivoarriba关注自动Actualizar档yÚltima vez运行Estado. 
 * - `['thumbnail-jobs']`: 视频缩略ImagenRecolectar档yEstado. 档跟着机Dispositivo走, No存EnExplorar dispositivodentro. 
 *
 * 面板常驻NoDesinstalar, 每次Abrirpesado取Configuración; Peach ConfiguraciónEn挂载时pesado取各自Datos.  */
import { useMutation, type QueryClient } from '@tanstack/react-query';

import { apiGet, apiSend } from '../../api';
import { queryClient } from '../query';

export const SETTINGS_URL = '/api/settings';
export const FOLLOW_SCHEDULE_URL = '/api/follow/schedule';
export const THUMBNAIL_JOBS_URL = '/api/thumbnail-jobs';

export const SETTINGS_KEY = ['settings'] as const;
export const FOLLOW_SCHEDULE_KEY = ['follow-schedule'] as const;
export const THUMBNAIL_JOBS_KEY = ['thumbnail-jobs'] as const;

/** `q_settings` 返回Completo; 写入时Solo送改ese几Clave, 回来仍esCompleto.  */
export interface SyncedSettings {
  sidebarOrder?: string[];
  followInitialDays?: number;
  postSetupTutorialDone?: boolean;
  feedHideGroupCompilations?: boolean;
  feedHideSoloCompilations?: boolean;
  feedHideExcerpts?: boolean;
  /** DatosBibliotecadentro还没存过时es null: este设备本地ese数替所ConAcceder端先定abajo来.  */
  searchHistoryLimit?: number | null;
}

export interface FollowScheduleStatus {
  available: boolean;
  enabled: boolean;
  interval_minutes: number;
  running?: boolean;
  last_error?: string | null;
  last_finished_at?: string | null;
  last_added?: number | null;
  next_run_at?: string | null;
}

export interface ThumbnailJobStatus {
  mode: string;
  status: 'idle' | 'running' | 'failed' | 'complete' | string;
  stopped?: string;
}

export const fetchSettings = (signal?: AbortSignal) => apiGet<SyncedSettings>(SETTINGS_URL, signal);
export const fetchFollowSchedule = (signal?: AbortSignal) =>
  apiGet<FollowScheduleStatus>(FOLLOW_SCHEDULE_URL, signal);
export const fetchThumbnailJobs = (signal?: AbortSignal) =>
  apiGet<ThumbnailJobStatus>(THUMBNAIL_JOBS_URL, signal);

/** Abrir偏bien弹窗时pesado取共享Configuración; RecolectarEstado由 Peach Configuraciónen procesoControles读取.  */
export function refreshPanelData(client: QueryClient = queryClient): Promise<SyncedSettings | null> {
  return client.fetchQuery({
    queryKey: SETTINGS_KEY, queryFn: ({ signal }) => fetchSettings(signal), staleTime: 0,
  }).catch(() => null);
}

/** 写跟DatosBiblioteca走ese几项. 回来es合y之posteriorCompleto, 写回 `['settings']`.  */
export function useSaveSettings() {
  return useMutation({
    mutationFn: (patch: SyncedSettings) => apiSend<SyncedSettings>(SETTINGS_URL, patch),
    onSuccess: (saved) => queryClient.setQueryData(SETTINGS_KEY, saved),
  });
}

export function useSaveFollowSchedule() {
  return useMutation({
    mutationFn: (minutes: number) => apiSend<FollowScheduleStatus>(FOLLOW_SCHEDULE_URL,
      { enabled: minutes > 0, interval_minutes: minutes || 60 }),
    onSuccess: (status) => queryClient.setQueryData(FOLLOW_SCHEDULE_KEY, status),
  });
}

export function useSaveThumbnailMode() {
  return useMutation({
    mutationFn: (mode: string) => apiSend<ThumbnailJobStatus>(THUMBNAIL_JOBS_URL, { mode }),
    onSuccess: (status) => queryClient.setQueryData(THUMBNAIL_JOBS_KEY, status),
  });
}
