/* 观verarriba报: Obras走 `/api/activity`, 关注Entrada走 `/api/follow/activity`, 都esdiez秒uno次加Pausar, Terminar
 * y换源时各冲uno次.  */
import { api, realDuration } from '@peach/legacy/core';

import type { PlayerItem } from './types';

const cleanup = new WeakMap<HTMLVideoElement, () => void>();

export function stopTelemetry(video: HTMLVideoElement): void {
  cleanup.get(video)?.();
  cleanup.delete(video);
}

function lifecycle(video: HTMLVideoElement, flush: (ended: boolean) => void, stop: () => void, seeking: () => void): void {
  const leave = () => flush(false);
  const empty = () => { stop(); flush(false) };
  video.addEventListener('seeking', seeking);
  video.addEventListener('emptied', empty);
  window.addEventListener('pagehide', leave);
  cleanup.set(video, () => {
    stop(); flush(false);
    video.onplay = null; video.ontimeupdate = null; video.onpause = null; video.onended = null;
    video.removeEventListener('seeking', seeking);
    video.removeEventListener('emptied', empty);
    window.removeEventListener('pagehide', leave);
  });
}

export interface TelemetryOptions {
  /** 侧栏"离开Ubicación"esetres节点(Progreso, 刻度ycien分比); No给就No画.  */
  watched?: string;
  mark?: string;
  ratio?: string;
  /** 放完之posterior要做事(InmersivoModocontinuar着放Siguiente).  */
  onEnded?: () => void;
}

/** Obras观verarriba报. 
 *
 *  同uno -1 哨兵: `it.duration||v.duration||0` 对 -1 求值仍es -1, 通过真值判断, 于es
 *  currentTime/-1 得到负Relación, 面板arriba就es"离开Ubicación -3320%". posterior端 w_activity Con `dur > 0` 守卫, 
 *  脏RelaciónNo会进DatosBiblioteca; 坏Soloes显示. 
 *
 *  diez秒uno次arriba报SoloConuno定时Dispositivo. onplay 每次Nuevo起uno而SoloCon onpause 清话, "Reproducir→拖动→Reproducir"
 *  este类No经过 pause 序列会定时Dispositivo叠起来; 更要紧es离开Detalles时既No pause 也No ended, 
 *  setInterval 连着ya被销毁 video uno直跑, 每diez秒往 /api/activity 打uno发. 所以 `emptied` 收尾, 
 *  拆ReproducirDispositivo时 `disposePlayer` Sincronizar冲掉最posterioruno段再Completo组摘掉. ProcesarDispositivo挂En `on*`
 *  属性arriba, ReproducirDispositivo从舞搬进pequeño窗时表No停.  */
export function wireTelemetry(item: PlayerItem, video: HTMLVideoElement | null, options: TelemetryOptions = {}): void {
  if (!video) return;
  let last = 0, acc = 0, seeks = 0, timer: ReturnType<typeof setInterval> | null = null;
  const node = (selector?: string) => (selector ? document.querySelector<HTMLElement>(selector) : null);
  const paint = () => {
    const duration = realDuration(item.duration) || realDuration(video.duration); if (!duration) return;
    const ratio = Math.min(video.currentTime / duration, 1);
    const watched = node(options.watched), mark = node(options.mark), text = node(options.ratio);
    if (watched) watched.style.width = `${(ratio * 100).toFixed(1)}%`;
    if (mark) mark.style.left = `${(ratio * 100).toFixed(1)}%`;
    if (text) text.textContent = `${(ratio * 100).toFixed(0)}%`;
  };
  const flush = (ended: boolean) => {
    const duration = realDuration(item.duration) || realDuration(video.duration);
    if (!acc && !ended && !seeks) return;
    (api('/api/activity', { method: 'POST', keepalive: true, body: JSON.stringify(
      { id: item.id, position: video.currentTime, duration, delta: acc, ended: !!ended, seeks }) }) as Promise<{ real_ratio?: number | null } | null>)
      .then((result) => { // 回Introduce面板真实观ver率
        const real = document.getElementById('realTxt');
        if (real && result && result.real_ratio != null) {
          const percent = Math.min(result.real_ratio, 1) * 100;
          real.textContent = `${percent.toFixed(0)}%`;
          const bar = document.getElementById('realBar'); if (bar) bar.style.width = `${percent.toFixed(1)}%`;
        }
      }).catch(() => {});
    acc = 0; seeks = 0;
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = null } };
  video.onplay = () => { last = video.currentTime; stop(); timer = setInterval(() => flush(false), 10000) };
  video.ontimeupdate = () => { const delta = video.currentTime - last; if (!video.paused && !video.seeking && delta > 0 && delta < 2) acc += delta; last = video.currentTime; paint() };
  video.onpause = () => { stop(); flush(false) };
  video.onended = () => { stop(); flush(true); options.onEnded?.() };
  lifecycle(video, flush, stop, () => { seeks++ });
  paint();
}

/** 关注Entrada观verarriba报; No.uno次开播另记uno次Reproducir, Estado随回执改写EnEntradaarriba.  */
export function wireFollowTelemetry(item: PlayerItem & { status?: string | undefined }, video: HTMLVideoElement): void {
  let last = 0, acc = 0, started = false, timer: ReturnType<typeof setInterval> | null = null;
  const flush = (ended: boolean) => {
    const duration = realDuration(item.duration) || realDuration(video.duration);
    if (!acc && !ended) return;
    (api('/api/follow/activity', { method: 'POST', keepalive: true, body: JSON.stringify({
      item: item.id, position: video.currentTime, duration, delta: acc, ended: !!ended,
    }) }) as Promise<unknown>).catch(() => {});
    acc = 0;
  };
  const stop = () => { if (timer) clearInterval(timer); timer = null };
  video.onplay = () => {
    if (!started) {
      started = true;
      (api('/api/follow/play', { method: 'POST', body: JSON.stringify({ item: item.id }) }) as Promise<{ status?: string } | null>)
        .then((result) => { item.status = result?.status || item.status }).catch(() => {});
    }
    last = video.currentTime;
    stop(); timer = setInterval(() => flush(false), 10000);
  };
  video.ontimeupdate = () => {
    const delta = video.currentTime - last; if (!video.paused && !video.seeking && delta > 0 && delta < 2) acc += delta; last = video.currentTime;
  };
  video.onpause = () => { stop(); flush(false) };
  video.onended = () => { stop(); flush(true) };
  lifecycle(video, flush, stop, () => {});
}
