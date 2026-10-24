/* 拆uno Video.js 实例. Detalles, pequeño窗yInmersivoModo每uno格都走esteuno.  */
import type { VjsPlayer } from './types';
import { stopPlaybackPosition } from './progress';
import { stopTelemetry } from './telemetry';

/** 拆掉unoReproducirDispositivo: PausarposteriorSincronizarGuardarUbicación, 冲掉观verúltimo段yLimpiar定时Dispositivoy监听, 再销毁实例.  */
export function disposePlayer(player: VjsPlayer | null): void {
  if (!player || player.isDisposed()) return;
  const video = player.el()?.querySelector('video');
  try { player.pause() } catch { /* ya拆 */ }
  if (video) {
    stopPlaybackPosition(video);
    stopTelemetry(video);
  }
  try { player.dispose() } catch { /* ya拆 */ }
}
