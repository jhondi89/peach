/* ReproducirEstadísticas: 缓冲读数, CargarVelocidad度yEstadísticas面板pequeñoImagen. 
 *
 * 渐进Descargar(HTTP Range)量No到网络: Explorar dispositivo用unolargoConectar边abajo边播, Por favor求EnReproducir期间NoTerminar, 
 * resource timing dentro就uno直No出现NuevoEntrada. 实测本地 MP4 播到 37 秒时仍SoloCon挂载ese两, 字节数停En
 * 862 KB, 面板于es显示"— · 0 Por favor求". HLS es另uno回事, 每分片都esuno次IndependienteCompletadoPor favor求, VHS
 * 自己也报 bandwidth, resource timing ese套口径Solo对它成立. 
 * 渐进源改ver缓冲anterior沿推进: 每秒Nuevo推进秒数 × 平均码率就es字节Velocidad率. 码率要ConArchivoTamaño才算得
 * 出来, 关注EntradaTamaño由 `/follow-qualities` 回源 HEAD 带回; 连arriba游都No给 content-length 时Sin
 * 任何办法秒换成字节, 角标改报还能往anterior放más久. 缓冲吃满posteriorExplorar dispositivo停拉, 增量归cero, 此时保DejaAnterior次
 * 读数而Noes跳回 0—eseNoesVelocidad度掉, esSinEnDescargar.  */
import { esc, icon, realDuration } from '@peach/legacy/core';

import type { VjsPlayer } from './types';

export function bufferedAhead(video: HTMLVideoElement): number {
  const at = video.currentTime || 0;
  for (let i = 0; i < video.buffered.length; i++) {
    if (video.buffered.start(i) <= at && video.buffered.end(i) >= at) return Math.max(0, video.buffered.end(i) - at);
  }
  return 0;
}

/* 缓冲anterior沿: 当anteriorReproducirUbicación所Enese段缓冲último端. veresanterior沿而Noes缓冲区Totallargo—Reproducir时Explorar dispositivo会驱逐
   播过部分, Totallargo几乎恒定, 拿它当Descargar量会得出"uno直es 0".  */
function bufferedFrontier(video: HTMLVideoElement): number {
  const at = video.currentTime || 0;
  for (let i = 0; i < video.buffered.length; i++) {
    if (video.buffered.start(i) <= at + .25 && video.buffered.end(i) >= at) return video.buffered.end(i);
  }
  return video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0;
}

const BUFFER_METER_WINDOW_MS = 3000;

export function averageBitrate(size: unknown, duration: unknown): number {
  const bytes = Number(size) || 0, seconds = realDuration(duration) || 0;
  return bytes > 0 && seconds > 0 ? bytes * 8 / seconds : 0;
}

export interface BufferMeter {
  bitrate: number;
  readonly bits: number;
  readonly seconds: number;
  bytes(): number;
  sample(video: HTMLVideoElement | null): number;
}

export function createBufferMeter(bitrate: number): BufferMeter {
  const samples: { at: number; advanced: number }[] = [];
  let last: { at: number; frontier: number; ct: number } | null = null, advanced = 0, bits = 0;
  return {
    bitrate: Number(bitrate) || 0,
    get bits() { return bits },
    get seconds() { return advanced },
    bytes() { return this.bitrate > 0 ? advanced * this.bitrate / 8 : 0 },
    sample(video) {
      if (!video) return bits;
      const at = performance.now(), frontier = bufferedFrontier(video), ct = video.currentTime || 0;
      if (last) {
        const gap = (at - last.at) / 1000;
        /* seek 会anterior沿Completo段挪走, eseNoesesteuno秒Descargar几diez分钟; 判据esReproducirUbicación自己跳.  */
        const seeked = Math.abs(ct - last.ct) > gap * 4 + 1;
        const step = frontier - last.frontier;
        if (!seeked && step > 0) advanced += step;
        /* 面板 y 角标都关着时没人采样, 再Abrir时两点隔几分钟, 窗口要pesadoNuevo起算.  */
        if (gap * 1000 > BUFFER_METER_WINDOW_MS * 2) samples.length = 0;
      }
      last = { at, frontier, ct };
      samples.push({ at, advanced });
      while (samples.length > 2 && at - samples[0]!.at > BUFFER_METER_WINDOW_MS) samples.shift();
      const first = samples[0]!;
      const span = (at - first.at) / 1000, gained = advanced - first.advanced;
      if (span >= .5 && gained > 0 && this.bitrate > 0) bits = gained * this.bitrate / span;
      return bits;
    },
  };
}

const PLAYER_STATS_HISTORY = 24;

export function pushPlayerStat(samples: number[], value: number): void {
  samples.push(Number.isFinite(value) && value > 0 ? value : 0);
  if (samples.length > PLAYER_STATS_HISTORY) samples.splice(0, samples.length - PLAYER_STATS_HISTORY);
}

/** Configuración面板 y ReproducirEstadísticas都盖EnImagenarriba, 同时开就互相遮挡. 开哪都往 document 广播uno次, 另uno
 *  自己收起: 两面板挂EnNo同作用域dentro, 共享uno事件名比互相持Con引用干净.  */
export const PLAYER_PANEL_EVENT = 'peach-player-panel';

export function playerStatsPlot(samples: number[], kind: 'speed' | 'activity' | 'buffer', ceiling: number, label: string): string {
  const values: (number | null)[] = [...Array<null>(Math.max(0, PLAYER_STATS_HISTORY - samples.length)).fill(null), ...samples];
  const top = Math.max(1, ceiling || 0);
  const bars = values.map((value) => {
    if (value === null) return '<i aria-hidden="true"></i>';
    const level = value <= 0 ? 0 : Math.max(.08, Math.min(1, value / top));
    const state = kind === 'buffer' ? (value < 5 ? 'low' : value < 15 ? 'mid' : 'good') : 'on';
    return `<i data-bar="${state}" style="height:${(level * 100).toFixed(1)}%" aria-hidden="true"></i>`;
  }).join('');
  return `<span data-player-stats-plot="${kind}" role="img" aria-label="${esc(label)}">${bars}</span>`;
}

/** EstadísticasClave, CargarVelocidad度角标yEstadísticas面板. ObrasDetallesy关注Detalles共用esteuno组; 挂载En Video.js 包住
 *  `<video>` 之anterior插到它anterior面, Video.js uno包, `video` 父级就换成它自己ese层.  */
export function playerStatsOverlayHtml(): string {
  return `<button data-player-stats-button="" id="playerStatsBtn" aria-label="Estadísticas de reproducción" title="Estadísticas de reproducción" aria-pressed="false" hidden>${icon('chart')}</button>
       <div data-player-net="" id="playerNet" role="status" aria-live="polite" hidden></div>
       <div data-player-stats="" id="playerStats" role="status" hidden></div>`;
}

export function streamEntries(id: number, session = ''): PerformanceResourceTiming[] {
  const encoded = session ? encodeURIComponent(session) : '';
  return (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter((entry) => entry.name.includes('/stream')
    && (entry.name.includes(`/stream?id=${id}`) || entry.name.includes(`/stream/hls/${id}/`))
    && (!encoded || entry.name.includes(`session=${encoded}`)));
}

export function streamSpeedBits(id: number, session = ''): number {
  const entries = streamEntries(id, session);
  const bytes = entries.reduce((n, entry) => n + (entry.transferSize || entry.encodedBodySize || 0), 0);
  const seconds = entries.reduce((n, entry) => n + (entry.duration || 0), 0) / 1000;
  return bytes > 0 && seconds > 0 ? bytes * 8 / seconds : 0;
}

export function playerSpeedBits(player: VjsPlayer | null, id: number, session = '', meter: BufferMeter | null = null): number {
  let bandwidth = 0;
  try { bandwidth = Number(player?.bandwidth?.()) || 0 } catch { /* Reproducir引擎Sin带ancho读数 */ }
  if (bandwidth > 0) return bandwidth;
  /* 传 meter 就es渐进源: 它 resource timing 本来就量No到, No能拿别Entrada顶arriba.  */
  return meter ? Number(meter.bits) || 0 : streamSpeedBits(id, session);
}

export function fmtSpeed(bits: number): string {
  if (!Number.isFinite(bits) || bits <= 0) return 'Cargando...';
  const bytes = bits / 8;
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB/s` : `${Math.max(1, Math.round(bytes / 1024))} KB/s`;
}

/** 码率no知时字节Velocidad率Sin从换算, 退回ya经缓冲秒数: eseeseste情况abajo唯uno还能直continuar用读数
 *  —现En断网还能往anterior放más久.  */
export function fmtLoadRate(bits: number, ahead: number): string {
  if (bits > 0) return fmtSpeed(bits);
  return ahead > 0 ? `Cargado ${Math.round(ahead)} segundo(s)` : fmtSpeed(0);
}
