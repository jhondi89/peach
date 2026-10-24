/* Configuraciónpáginaprimero屏Datos. 
 *
 * Completopáginay各分区读同uno `queryKey`: 挂载Estadoeseuno按abajo"Actualizar"pesado取回来也esCompletoConfiguración, 
 * 换进esteunoClave, 屏幕arriba就SoloConuno真相. 端点字符串En `frontend/src` dentroSolo声明uno次, 
 * En `../../configuration-endpoints`(`tests/test_frontend_build.py` 盯着).  */
import { apiGet } from '../../api';
import { CONFIGURATION_URL } from '../../configuration-endpoints';
import type { ConfigurationData } from '../bundle';
import { queryClient } from '../query';

export const CONFIGURATION_KEY = ['configuration'] as const;

export const fetchConfiguration = (signal?: AbortSignal) =>
  apiGet<ConfigurationData>(CONFIGURATION_URL, signal);

/** primero屏: 取回来才画. en proceso止时 `fetchQuery`  `AbortError` 抛回给挂载方, 它据此放弃esteuno次.  */
export async function prefetchConfiguration(signal: AbortSignal): Promise<void> {
  await queryClient.fetchQuery({
    queryKey: CONFIGURATION_KEY, queryFn: () => fetchConfiguration(signal),
  });
}
