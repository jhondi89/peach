/* 流会话y片源判据. 
 *
 * 每uno路Reproducir带uno会话号, 服务端按它登记En途读取; 切走, Cerrar, 离开página面时按会话Cancelar, 
 * ya经没人ver读取No再占着 115 或本地盘. DetallesyInmersivoModo共用esteuno套(InmersivoModo每格uno会话).  */
import { api } from '@peach/legacy/core';

import type { PlayerItem, PlayerSource } from './types';

export function newStreamSession(): string {
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function directStreamSource(item: PlayerItem, session: string): PlayerSource {
  return {
    src: `/stream?id=${item.id}&session=${encodeURIComponent(session)}`,
    type: String(item.name || '').toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4',
  };
}

/* En线Obras `path` es来源Obraspágina, Noespuede播地址. 能播eseProxyEn `/follow-stream?id=<follow_item>`, 
   Guardar时写 `follow_item.asset_id`, `/api/item` 反查posterior回传 `follow_item_id`.  */
function followStreamSource(item: PlayerItem): PlayerSource | null {
  return item.location === 'online' && item.follow_item_id
    ? { src: `/follow-stream?id=${item.follow_item_id}`, type: 'video/mp4' } : null;
}

/** 起播片源SoloConesteuno判据, Detalles y InmersivoModo共用: 服务端说要转码分片就给分片, 否则直读. 
 *  Con B 帧却缺 ctts  MP4 直读时Explorar dispositivo按错显示顺序丢帧, Completo片持续卡顿.  */
export async function playableStreamSource(item: PlayerItem, session: string): Promise<PlayerSource> {
  const proxied = followStreamSource(item);
  if (proxied) return proxied;
  try {
    const plan = await api(`/api/stream-plan?id=${item.id}&session=${encodeURIComponent(session)}`) as
      { protocol?: string; src?: string; mime_type?: string } | null;
    if (plan?.src) return { src: plan.src, type: plan.mime_type || (plan.protocol === 'hls' ? 'application/vnd.apple.mpegurl' : 'video/mp4') };
  } catch { /* 取No到计划就直读 */ }
  return directStreamSource(item, session);
}

/** 通知服务端放掉esteuno路读取. Resultado写到 `<html data-peach-stream-cancel>` arriba, e2e 据此核对.  */
export function cancelStreamSession(session: string): void {
  if (!session) return;
  fetch(`/api/stream-cancel?session=${encodeURIComponent(session)}`, {
    method: 'POST', credentials: 'same-origin', keepalive: true,
  }).then((response) => response.json()).then((result: unknown) => {
    document.documentElement.dataset.peachStreamCancel = JSON.stringify(result);
  }).catch(() => {});
}

/* ── Detallesesteuno路 ──
   舞ypequeño窗同uno时刻Solo放uno, 共用uno会话: 从Detalles进pequeño窗时读取continuar着用, pequeño窗dentro换片或关掉时
   才Cancelar.  */
let detailSession = '';

export function detailStreamSession(): string { return detailSession }

function ensureDetailSession(): string {
  if (!detailSession) detailSession = newStreamSession();
  return detailSession;
}

export const directDetailSource = (item: PlayerItem): PlayerSource => directStreamSource(item, ensureDetailSession());
export const detailStreamSource = (item: PlayerItem): Promise<PlayerSource> => playableStreamSource(item, ensureDetailSession());

export function cancelDetailStream(): void {
  const session = detailSession;
  if (!session) return;
  detailSession = '';
  cancelStreamSession(session);
}
