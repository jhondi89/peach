/* 来源puede达性En React página面uno侧用法. DatosGestionarpágina要知道este次会扫哪几来源, 资源Sincronizareseuno出No出现, 
 * RepetirArchivopágina要知道哪些网盘值得给uno"优先保Deja". 
 *
 * 地址, ConsultaClavey取数函数 y 壳共用, 声明En `src/query/media-sources.ts`, 按 `@peach/query` 引用, 
 * 主包en la实例SoloConuno. 服务端定期探测; página面进入时读取最Nuevorápido照.  */
import { fetchMediaSources, MEDIA_SOURCES_KEY, type MediaSourcesData, type MediaSourceStatus } from '@peach/query';

import { queryClient } from './query';
import { CLOUD_LOCATIONS, SCANNABLE_LOCATIONS } from '../core/media-sources';

export { fetchMediaSources, MEDIA_SOURCES_KEY } from '@peach/query';
export type { MediaSourcesData, MediaSourceStatus } from '@peach/query';

export async function prefetchMediaSources(signal: AbortSignal): Promise<void> {
  await queryClient.fetchQuery({ queryKey: MEDIA_SOURCES_KEY, queryFn: () => fetchMediaSources(signal) });
}

/** 挂载存储来源. `online` este类En线来源No落盘, No参yescaneary对账.  */
export { SCANNABLE_LOCATIONS } from '../core/media-sources';

export const scannableSources = (data: MediaSourcesData | undefined): MediaSourceStatus[] =>
  (data?.sources ?? []).filter((source) => SCANNABLE_LOCATIONS.includes(source.location));

/** 配根Directorio网盘. 离线网盘仍然属于yaConfiguración来源: 它arriba面Repetir副本照样能挑着Deja.  */
export const cloudLocations = (data: MediaSourcesData | undefined): string[] =>
  (data?.sources ?? []).filter((source) => CLOUD_LOCATIONS.includes(source.location)
    && (source.roots === undefined || source.roots.length > 0)).map((source) => source.location);
