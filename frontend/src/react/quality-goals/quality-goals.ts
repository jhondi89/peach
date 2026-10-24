/* alto清版目标Datos契约y折算: `/api/quality-goals` uno次Por favor求供Completopágina使用. 
 *
 * 端点En `frontend/src` dentroSoloEnaquí声明uno次(`tests/test_frontend_build.py` 盯着). 
 * DatosGestionarpáginaese"alto清版"卡片要es同uno真相 `total`, 它随eseunopágina迁到 React 时读
 * abajo面este `QUALITY_GOALS_KEY`, 而Noes另发uno次Por favor求—同uno真相取两次, 两处显示数
 * 就puede能对Noarriba.  */
import { coverUrl } from '@peach/card-art';

import { apiGet } from '../../api';
import { queryClient } from '../query';

/** arriba限沿用服务端 200: `limit` 也钉En 200, 再grandeSolo会被截.  */
export const QUALITY_GOALS_URL = '/api/quality-goals?limit=200';
/** Completopágina共用esteunoClave.  */
export const QUALITY_GOALS_KEY = ['quality-goals'] as const;

/** `/api/quality-goals` 单Entrada. 字段y `web_contract.q_quality_goals` 对齐.  */
export interface QualityGoal {
  id: number;
  name: string;
  code: string | null;
  location: string;
  size: number | null;
  duration: number | null;
  reason: string | null;
  cost: string;
  has_thumb: boolean;
  has_cover: boolean;
  cover_version?: string;
}

export interface QualityGoalsData {
  total: number;
  items: QualityGoal[];
  offset: number;
  has_more: boolean;
}

export const fetchQualityGoals = (signal?: AbortSignal) =>
  apiGet<QualityGoalsData>(QUALITY_GOALS_URL, signal);

/** primero屏: 取完数才画. 
 *
 * No给 `staleTime`, 所以每次进esteunopágina都pesadoNuevo取. 路由表dentro `/quality-goals` es
 * `refresh:'reopen'`—Actualizar就espesadoNuevo进来uno次, ese时要esNuevoDatos, Noes几分钟anterior缓存. 
 * en proceso止时 `fetchQuery`  `AbortError` 抛回给挂载方, 它据此放弃esteuno次.  */
export async function prefetchQualityGoals(signal: AbortSignal): Promise<void> {
  await queryClient.fetchQuery({
    queryKey: QUALITY_GOALS_KEY,
    queryFn: () => fetchQualityGoals(signal),
  });
}

/** Portada优先用Código JAVPortada, Sin就退回No. 4 海报. 两者都取No到时由卡片 img 摘掉.  */
export const previewUrl = (item: QualityGoal): string => item.has_cover
  ? coverUrl(item)
  : `/poster?id=${item.id}&c=4`;
