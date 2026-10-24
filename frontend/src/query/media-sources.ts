/* 来源puede达性(/api/sources): 地址, ConsultaClavey取数函数SoloEn本模声明. 
 * Application  loadSourceStatus, DatosGestionarpágina, 资源SincronizaryRepetirArchivopágina共读此Clave. 
 * No设 staleTime, 显Actualizary进入página面按服务端最Nuevorápido照读取. 
 * Application Solo读调用返回值, No订阅; página面pesado取No会改变DirectorioPredeterminado来源y脱盘Sugerencia.  */
import { isCancelledError } from '@tanstack/query-core';

import { apiGet } from '../api';
import { queryClient } from './client';

export const MEDIA_SOURCES_URL = '/api/sources';
export const MEDIA_SOURCES_KEY = ['media-sources'] as const;

/** `/api/sources` uno行. 字段y `routes_api.source_health` 对齐.  */
export interface MediaSourceStatus {
  location: string;
  online: boolean | null;
  state?: string;
  message?: string;
  roots?: unknown[];
}

export interface MediaSourcesData {
  sources: MediaSourceStatus[];
}

export const fetchMediaSources = (signal?: AbortSignal) =>
  apiGet<MediaSourcesData>(MEDIA_SOURCES_URL, signal);

const stopped = (error: unknown) => (error as { name?: unknown } | null)?.name === 'AbortError' || isCancelledError(error);

/** 壳来源检测: 启动, Detallesen la"ActualizarEstado"yReproducirDispositivo报错时各调uno次, 每次都向服务端问uno遍. 
 *
 *  Consulta函数No读 Query 交给它 `signal`: 读它, página面arriba最posterioruno观察者Desinstalar时 Query 会撤回esteuno趟, 
 *  壳拿到esAnteriorantiguoDatos. 同时En途同unoPor favor求由 Query 合y成uno次; 合yen la若espágina面eseuno趟, 
 *  它带着página面自己 `signal`, página面en proceso止时esteuno趟以en proceso止收场, 壳就自己再发uno次.  */
export async function loadMediaSources(signal?: AbortSignal): Promise<MediaSourcesData> {
  signal?.throwIfAborted();
  const fetchOnce = () => queryClient.fetchQuery({ queryKey: MEDIA_SOURCES_KEY, queryFn: () => fetchMediaSources(signal) });
  try {
    const data = await fetchOnce();
    signal?.throwIfAborted();
    return data;
  } catch (error) {
    signal?.throwIfAborted();
    if (!stopped(error)) throw error;
    return await fetchOnce();
  }
}
