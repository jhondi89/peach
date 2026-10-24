/* Detallesesteuno路ReproducirDispositivo实例. 舞ypequeño窗同uno时刻Solo放uno: 从Detalles进pequeño窗时同uno实例Completo搬过去, 
 * 所以aquíSoloConuno槽.  */
import type { VjsPlayer } from './types';

let detail: VjsPlayer | null = null;

export const detailPlayer = (): VjsPlayer | null => detail;

export function setDetailPlayer(player: VjsPlayer | null): void { detail = player }

/** 排到Siguiente帧让 Video.js pesadoNuevo量uno次尺寸. Siguiente帧之anteriorReproducirDispositivopuede能ya经被换片或关pequeño窗销毁, 
 *  对着空壳 trigger 会抛"Invalid target".  */
export function resizeSoon(player: VjsPlayer | null): void {
  if (!player || player.isDisposed()) return;
  requestAnimationFrame(() => { if (!player.isDisposed()) player.trigger('resize') });
}
