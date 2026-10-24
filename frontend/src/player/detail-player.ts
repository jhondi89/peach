/* DetallesReproducirDispositivo: 给舞Reproducir区 `<video>` 挂 Video.js yTodo Peach Controles. 
 *
 * - `mountDetailPlayer` 挂uno Video.js 实例: 片源解析, Duración校正, 出错时从分片退回直读, 脱盘判定, 
 *   ready 之posterior挂Configuración菜单, 拖动Vista previa, Media Session, 转圈ySubtítulos. 
 * - `attachPlayerChrome` Estadísticas面板, CargarVelocidad度角标y氛围光continuar到uno媒体框arriba. ReproducirDispositivo进pequeño窗时摘abajo, 
 *   展开回舞时continuar到Nuevo媒体框arriba, 实例本身Nopesado建. 
 * - `mountPlayer` es舞Reproducir区yInmersivoModo每uno格入口: 插氛围光画布yEstadísticas角标, 按Obras或关注Entrada
 *   给片源, 海报yarriba报, 返回拆掉esteunoReproducirDispositivo函数.  */
import { detailPosterUrl } from '@peach/card-art';
import { api, esc, fmtClock, fmtSize, icon, realDuration } from '@peach/legacy/core';

import {
  mountPlayerAmbient, mountPlayerMediaSession, mountPlayerQualityControl, mountPlayerSeekPreview,
  mountPlayerSpinner, mountPlayerSubtitles,
} from './controls';
import { disposePlayer } from './dispose';
import { playerHost } from './host';
import { mountImmersePlayer, type ImmersePlayerOptions } from './immerse-player';
import { wirePlayerContextMenu } from './menu';
import { detailPlayer, setDetailPlayer } from './registry';
import { playbackKey, playbackPosition, stopPlaybackPosition, trackPlaybackPosition } from './progress';
import {
  averageBitrate, bufferedAhead, createBufferMeter, fmtLoadRate, fmtSpeed, PLAYER_PANEL_EVENT,
  playerSpeedBits, playerStatsOverlayHtml, playerStatsPlot, pushPlayerStat, streamEntries,
} from './stats';
import { detailStreamSession, detailStreamSource, directDetailSource } from './stream';
import { stopTelemetry, wireFollowTelemetry, wireTelemetry } from './telemetry';
import type { MediaFacts, PlayerItem, PlayerSource, SourceQuality, VjsPlayer } from './types';
import { ensureVideojs } from './videojs';

/** 从pequeño窗展开回来或带 `?t=` profundo链进来时continuar着放eseuno刻.  */
export interface PlayerResume { time: number; autoplay: boolean }

export interface DetailPlayerOptions {
  /** 给定片源(关注Entrada `/follow-stream`); No给就按Obras来源解析.  */
  source?: PlayerSource;
  /** Reproducir出错时要No要查来源Estado判脱盘. 关注Entrada片源NoEn本机来源dentro, No查.  */
  checkSourceStatus?: boolean;
  size?: number | null | undefined;
  poster?: string | undefined;
  qualities?: SourceQuality[] | null;
  /** Nitidez表y字节数, 跟Predeterminado片源y行解析, 回来得比挂载晚.  */
  mediaPromise?: Promise<MediaFacts | null>;
  resume?: PlayerResume | null;
}

/** 媒体框dentroesetres读数: EstadísticasClave, Estadísticas面板yCargarVelocidad度角标(`playerStatsOverlayHtml`).  */
interface PlayerChrome {
  statsButton: HTMLElement | null;
  statsPanel: HTMLElement | null;
  netBadge: HTMLElement | null;
}

/** unoReproducirDispositivo实例读数来源. 面板画En哪uno框dentro由 `chrome` 决定, 换框时Solo换它.  */
interface PlayerSession {
  chrome: PlayerChrome | null;
  /** ready 之posteriorEstadísticasClave才露出来: Controles还没挂arriba时点它什么也读No到.  */
  ready: boolean;
  updateStats(): void;
}

const sessions = new WeakMap<VjsPlayer, PlayerSession>();

/* Estadísticas面板yCargarVelocidad度角标定时Dispositivo. 它们画En舞媒体框dentro, ReproducirDispositivo进pequeño窗时跟着舞uno起停.  */
let statsTimer: ReturnType<typeof setInterval> | null = null;
let netTimer: ReturnType<typeof setInterval> | null = null;
let netHideTimer: ReturnType<typeof setTimeout> | null = null;

/** 停掉Estadísticas面板y角标Actualizar. ReproducirDispositivo本身No动.  */
export function stopPlayerPanels(): void {
  if (statsTimer) { clearInterval(statsTimer); statsTimer = null }
  if (netTimer) { clearInterval(netTimer); netTimer = null }
  if (netHideTimer) { clearTimeout(netHideTimer); netHideTimer = null }
}

export async function mountDetailPlayer(
  item: PlayerItem, video: HTMLVideoElement, autoplay: boolean, options: DetailPlayerOptions = {},
): Promise<VjsPlayer | null> {
  const existing = detailPlayer();
  if (existing && !existing.isDisposed()) return existing;
  const host = playerHost();
  const resume = options.resume ?? null;
  if (resume?.autoplay) autoplay = true;
  const source = () => (options.source ? Promise.resolve(options.source) : detailStreamSource(item));
  /* 拉No到就退回Original生 video,  y "página面dentroSin videojs"es同uno兜底出口.  */
  let videojs;
  try { videojs = await ensureVideojs() } catch {
    video.controls = true;
    source().then((next) => {
      video.addEventListener('loadedmetadata', () => {
        if (resume && resume.time > 0) video.currentTime = Math.min(resume.time, realDuration(video.duration) || resume.time);
      }, { once: true });
      video.src = next.src; if (autoplay) video.play().catch(() => {});
    }).catch(() => {});
    return null;
  }
  const player = videojs(video, {
    controls: true, preload: 'metadata', language: 'zh-CN', responsive: true,
    /* 海报yObras当anteriorPortada偏bienuno致, 交给Original生视频显示.  */
    poster: options.poster || detailPosterUrl(item, host.settings().javImage),
    controlBar: {
      pictureInPictureToggle: true, currentTimeDisplay: false, timeDivider: false,
      durationDisplay: false, remainingTimeDisplay: false,
      // TiempoyPasar el ratónVista previa归 Peach Controles, ProgresoSolo保DejaReproduciry拖动所需组件. 
      progressControl: { seekBar: { mouseTimeDisplay: false, playProgressBar: { timeTooltip: false } } },
    },
  });
  setDetailPlayer(player);
  player.peachItem = item;
  wirePlayerContextMenu(player);
  /* Teléfonoen laImagen格按视频自己Relación排(`--peach-video-ratio`).  */
  player.on('loadedmetadata', () => {
    const tech = player.el()?.querySelector('video');
    if (tech?.videoWidth && tech.videoHeight) player.el().style.setProperty('--peach-video-ratio', `${tech.videoWidth}/${tech.videoHeight}`);
  });
  // 非正Duraciónuno律当no知. 
  const expected = realDuration(item.duration);
  const statsHistory = { speed: [] as number[], activity: [] as number[], buffer: [] as number[] };
  /* 关注Entrada字节数要回源 HEAD 才知道, 跟Nitidez表同uno趟回来, 比挂载晚. 码率esVelocidad度读数
     换算系数, 所以Dejaunopuede以posteriorIntroduce口子, 别它固定En挂载eseuno刻.  */
  let mediaSize = Number(options.size ?? item.size) || 0;
  const meter = createBufferMeter(averageBitrate(mediaSize, item.duration));
  let statsLoaded = 0;
  let correcting = false;
  const live = () => detailPlayer() === player && !player.isDisposed();
  const enforceDuration = () => {
    if (!expected || correcting || !live()) return;
    const reported = Number(player.duration());
    if (!Number.isFinite(reported) || Math.abs(reported - expected) > Math.max(2, expected * .001)) {
      correcting = true; player.duration(expected); queueMicrotask(() => { correcting = false });
    }
  };
  const segmentedNow = () => String(player.currentSource()?.type || '').includes('mpegurl');
  const session: PlayerSession = { chrome: null, ready: false, updateStats: () => {} };
  sessions.set(player, session);
  session.updateStats = () => {
    const statsPanel = session.chrome?.statsPanel;
    if (!statsPanel || statsPanel.hidden || !live()) return;
    const quality = video.getVideoPlaybackQuality ? video.getVideoPlaybackQuality() : null;
    const rect = video.getBoundingClientRect(), current = `${video.videoWidth || item.width || '?'}×${video.videoHeight || item.height || '?'}`;
    const segmented = segmentedNow();
    const stream = detailStreamSession();
    const resources = segmented ? streamEntries(item.id, stream) : [];
    const bytes = resources.reduce((n, entry) => n + (entry.transferSize || entry.encodedBodySize || 0), 0);
    const seconds = resources.reduce((n, entry) => n + (entry.duration || 0), 0) / 1000;
    meter.sample(video);
    const speed = playerSpeedBits(player, item.id, stream, segmented ? null : meter) || (seconds > 0 ? bytes * 8 / seconds : 0);
    /* 分片流按yaCompletadoPor favor求字节累计; 渐进源SinestePor favor求, 按anterior沿推进折算, 码率no知时退到秒.  */
    const loaded = segmented ? bytes : (meter.bitrate > 0 ? meter.bytes() : meter.seconds);
    const activity = Math.max(0, loaded - statsLoaded); statsLoaded = loaded;
    const buffer = bufferedAhead(video);
    pushPlayerStat(statsHistory.speed, speed);
    pushPlayerStat(statsHistory.activity, activity);
    pushPlayerStat(statsHistory.buffer, buffer);
    /* 关注EntradaSin落盘Archivo名, 容DispositivoFormatoSolo能从片源 MIME 反推; HLS ya经写En传输uno侧, NoRepetir.  */
    const named = String(item.name || '');
    const container = (named.includes('.') ? named.split('.').pop() || ''
      : segmented ? '' : String(player.currentSource()?.type || '').split('/').pop() || '').toUpperCase() || '—';
    const speedText = speed ? `${(speed / 1e6).toFixed(1)} Mbps` : '—';
    const byteScale = segmented || meter.bitrate > 0;
    const loadedRow: [string, string, string] = segmented
      ? ['Red活动', `${bytes ? fmtSize(bytes) : '—'} · ${resources.length} Por favor求`,
        `Recienteunosegundo(s)Red活动 ${activity ? fmtSize(activity) : '0 B'}`]
      : ['YaDescargas', byteScale ? `${fmtSize(loaded)}${mediaSize > 0 ? ` / ${fmtSize(mediaSize)}` : ''}` : `${loaded.toFixed(0)} segundo(s)`,
        byteScale ? `Recienteunosegundo(s)Descargas ${activity ? fmtSize(activity) : '0 B'}` : `Recienteunosegundo(s)Descargas ${activity.toFixed(1)} segundo(s)`];
    const rows: [string, string, string?][] = [
      ['Videos ID / 会话', stream && !options.source ? `${item.id} / ${stream.slice(0, 8)}` : `${item.id}`],
      ['Viewport / Fotograma', `${Math.round(rect.width)}×${Math.round(rect.height)} / ${quality ? `${quality.totalVideoFrames - quality.droppedVideoFrames} of ${quality.totalVideoFrames}` : '—'}`],
      ['Actual / 最佳Resolución', `${current} / ${item.width || video.videoWidth || '?'}×${item.height || video.videoHeight || '?'}`],
      ['Codificación / Transmisión', `${container} / ${segmented ? 'HLS' : 'HTTP Range'}`],
      ['ConectarVelocidad', speedText,
        playerStatsPlot(statsHistory.speed, 'speed', Math.max(10e6, ...statsHistory.speed), `ConectarVelocidad ${speedText === '—' ? 'Sin datos disponibles' : speedText}`)],
      [loadedRow[0], loadedRow[1],
        playerStatsPlot(statsHistory.activity, 'activity', Math.max(1, ...statsHistory.activity), loadedRow[2])],
      ['Buffering健康', `${buffer.toFixed(1)} segundo(s)`,
        playerStatsPlot(statsHistory.buffer, 'buffer', 30, `ActualpuedeReproducción continua ${buffer.toFixed(1)} segundo(s)`)],
      ['Tiempo de reproducción', `${fmtClock(video.currentTime)} / ${fmtClock(expected || player.duration())}`],
      ['Fecha', new Date().toLocaleString()],
    ];
    statsPanel.innerHTML = `<dl>${rows.map(([key, value, plot]) =>
      `<dt>${esc(key)}</dt><dd${plot ? ' data-player-stats-metric=""' : ''}>${plot || ''}<span>${esc(value)}</span></dd>`).join('')}</dl>`;
  };
  player.on(['loadstart', 'loadedmetadata', 'durationchange', 'error'], enforceDuration);
  let segmentedSource = false, fallbackUsed = false;
  const updateNet = () => {
    const netBadge = session.chrome?.netBadge;
    if (!netBadge || player.isDisposed()) return;
    const segmented = segmentedNow();
    if (!segmented) meter.sample(video);
    const bits = playerSpeedBits(player, item.id, detailStreamSession(), segmented ? null : meter);
    const rate = segmented ? fmtSpeed(bits) : fmtLoadRate(bits, bufferedAhead(video));
    netBadge.innerHTML = `${icon('gauge')}<span class="sr-only">CargarVelocidad</span><span>${esc(rate)}</span>`;
  };
  const showNet = () => {
    const netBadge = session.chrome?.netBadge;
    if (!netBadge || !netBadge.isConnected) return;
    netBadge.hidden = false; updateNet();
    if (netTimer) clearInterval(netTimer);
    netTimer = setInterval(updateNet, 500);
  };
  const hideNet = () => {
    const netBadge = session.chrome?.netBadge;
    if (!netBadge) return;
    if (netHideTimer) clearTimeout(netHideTimer);
    netHideTimer = setTimeout(() => { netBadge.hidden = true; if (netTimer) { clearInterval(netTimer); netTimer = null } }, 1400);
  };
  player.on(['loadstart', 'progress', 'waiting', 'stalled'], showNet);
  player.on(['canplay', 'playing'], () => { updateNet(); hideNet() });
  player.on('error', () => {
    if (segmentedSource && !fallbackUsed && !player.isDisposed()) {
      fallbackUsed = true; segmentedSource = false;
      player.src(directDetailSource(item));
      if (autoplay) player.play()?.catch(() => {});
      return;
    }
    // 播到unomedio掉盘时 video 元素Solo报通用Error; 来源Estado才分得清脱盘 y Archivo损坏. 
    if (options.checkSourceStatus === false) return;
    void host.loadSourceStatus().then((status) => {
      if (status[String(item.location)] !== false || player.isDisposed()) return;
      player.error({ code: 2, message: `Directorio de mediosNinguno法Acceso · ${host.offlineReason(String(item.location))}` });
    });
  });
  player.ready(() => {
    enforceDuration();
    const updateQualities = mountPlayerQualityControl(player, video, item.height, options.qualities ?? null);
    options.mediaPromise?.then((next) => {
      if (!live()) return;
      updateQualities?.(next?.qualities?.length ? next.qualities : null);
      const size = Number(next?.size) || 0;
      if (size > 0 && !mediaSize) { mediaSize = size; meter.bitrate = averageBitrate(size, item.duration) }
    }).catch(() => {});
    mountPlayerSeekPreview(player, item, { thumbnail: !options.source });
    mountPlayerMediaSession(player, item);
    mountPlayerSpinner(player);
    if (!options.source) mountPlayerSubtitles(player, item.id);
    session.ready = true;
    if (session.chrome?.statsButton) session.chrome.statsButton.hidden = false;
  });
  source().then((next) => {
    if (!live()) return;
    segmentedSource = String(next.type || '').includes('mpegurl');
    if (resume && resume.time > 0) player.one('loadedmetadata', () => {
      if (player.isDisposed()) return;
      const duration = realDuration(player.el().querySelector('video')?.duration) || realDuration(player.duration());
      player.currentTime(Math.min(resume.time, duration || resume.time));
    });
    player.src(next);
    enforceDuration(); setTimeout(enforceDuration, 0); setTimeout(enforceDuration, 250);
    if (autoplay) player.play()?.catch(() => {});
  }).catch(() => {});
  return player;
}

const AMBIENT_CANVAS = '<canvas data-ambient-canvas="" width="32" height="18"></canvas>';

/** 媒体框dentro氛围光画布ytres读数占: 画布es框No.uno子节点, 读数插En `before` anterior面(No给就
 *  放到最posterior). ya经Con就No再插.  */
export function preparePlayerFrame(frame: HTMLElement, before: Element | null = null): void {
  if (!frame.querySelector(':scope > [data-ambient-canvas]')) frame.insertAdjacentHTML('afterbegin', AMBIENT_CANVAS);
  if (frame.querySelector(':scope > #playerStatsBtn')) return;
  const overlay = document.createElement('template');
  overlay.innerHTML = playerStatsOverlayHtml();
  frame.insertBefore(overlay.content, before);
}

/** Estadísticas面板, CargarVelocidad度角标y氛围光continuar到 `frame` arriba(它先经过 `preparePlayerFrame`). 返回摘abajo
 *  函数: 进pequeño窗时摘, ReproducirDispositivo销毁时自己摘.  */
export function attachPlayerChrome(player: VjsPlayer, frame: HTMLElement): () => void {
  const session = sessions.get(player);
  if (!session || player.isDisposed()) return () => {};
  const find = (id: string) => frame.querySelector<HTMLElement>(`:scope > #${id}`);
  const chrome: PlayerChrome = { statsButton: find('playerStatsBtn'), statsPanel: find('playerStats'), netBadge: find('playerNet') };
  session.chrome = chrome;
  const { statsButton, statsPanel } = chrome;
  let offPanels = () => {};
  if (statsButton && statsPanel) {
    statsButton.hidden = !session.ready;
    const closeStats = () => {
      if (statsPanel.hidden) return;
      statsPanel.hidden = true; statsButton.setAttribute('aria-pressed', 'false');
      if (statsTimer) { clearInterval(statsTimer); statsTimer = null }
    };
    statsButton.onclick = () => {
      if (!statsPanel.hidden) { closeStats(); return }
      document.dispatchEvent(new CustomEvent(PLAYER_PANEL_EVENT, { detail: 'stats' }));
      statsPanel.hidden = false; statsButton.setAttribute('aria-pressed', 'true');
      session.updateStats();
      if (statsTimer) clearInterval(statsTimer);
      statsTimer = setInterval(session.updateStats, 1000);
    };
    const closeStatsForOtherPanel = (event: Event) => { if ((event as CustomEvent<string>).detail !== 'stats') closeStats() };
    document.addEventListener(PLAYER_PANEL_EVENT, closeStatsForOtherPanel);
    offPanels = () => document.removeEventListener(PLAYER_PANEL_EVENT, closeStatsForOtherPanel);
  }
  const tech = player.el().querySelector('video');
  const stopAmbient = tech ? mountPlayerAmbient(tech) : () => {};
  let attached = true;
  const detach = () => {
    if (!attached) return;
    attached = false;
    offPanels(); stopAmbient();
    if (session.chrome === chrome) { session.chrome = null; stopPlayerPanels() }
  };
  player.one('dispose', detach);
  return detach;
}

/** 关注Entradaen launo媒体(组en laNo.几视频).  */
export interface PlayerMedia { index: number; media_type?: string; size?: number | null }

export interface MountPlayerOptions {
  kind: 'item' | 'follow';
  item: PlayerItem;
  media?: PlayerMedia | null;
  /** No给就按Configuración(`detailAutoplay`).  */
  autoplay?: boolean | undefined;
  resume?: PlayerResume | null;
  /** 挂载之anteriorEn媒体框dentro插氛围光画布yEstadísticas角标. Predeterminado插; pequeño窗dentro换片No要este些.  */
  chrome?: boolean;
  /** 挂arriba之posterior实例交出去: pequeño窗y展开要认得esteuno. 挂Noarriba(Video.js 拉No到, 退回Original生 video)
   *  给 null. 拆得比挂载rápido时No回调.  */
  onPlayer?: (player: VjsPlayer | null) => void;
  /** esteReproducirDispositivoya经被pequeño窗continuar走: 拆Reproducir区时No销毁它.  */
  handedOff?: (player: VjsPlayer) => boolean;
}

/** 舞Reproducir区入口: 给Reproducir区en la `<video>` 挂ReproducirDispositivo, 返回拆掉它函数. 
 *
 *  氛围光画布yEstadísticas角标En挂载之anterior插进媒体框: Video.js uno包, `video` 父级就换成它自己ese层. 
 *  - Obras(`item`): 片源由 `mountDetailPlayer` 按来源解析, 海报es本地Imagen, esteuno次挂载No.uno次开播时
 *    记uno次Reproducir, 离开Ubicacióny真实观ver由 `wireTelemetry` 随Reproducir写回侧栏. 
 *  - 关注(`follow`): 片源es `/follow-stream`, Nitidezy字节数(`/follow-qualities`)跟Predeterminado片源y行
 *    解析—它要回源抓Detalles, 再 HEAD uno次正片, No能挡住ReproducirDispositivo挂载. 
 *  - InmersivoModouno格(`immerse`): 裸 Video.js, esteuno格自己流会话, 见 `immerse-player.ts`. 
 *  返回LimpiarEn舞卸abajoeste媒体区时调: 换uno媒体Solo拆esteunoReproducirDispositivo; 被pequeño窗continuar走Solo摘读数.  */
export function mountPlayer(video: HTMLVideoElement, options: MountPlayerOptions | ImmersePlayerOptions): () => void {
  if (options.kind === 'immerse') return mountImmersePlayer(video, options);
  const { kind, item, media = null, handedOff, onPlayer } = options;
  const host = playerHost();
  const frame = options.chrome === false ? null : video.parentElement;
  if (frame) preparePlayerFrame(frame, video);
  const key = playbackKey(kind, item, media?.index ?? null);
  let detail: DetailPlayerOptions = { resume: options.resume ?? { time: playbackPosition(key, item), autoplay: false } };
  if (kind === 'follow') {
    detail = {
      ...detail,
      source: { src: `/follow-stream?id=${item.id}${media ? `&media=${media.index}` : ''}`, type: media?.media_type || item.media_type || 'video/mp4' },
      checkSourceStatus: false, size: media?.size, poster: item.thumb_url,
      mediaPromise: (api(`/follow-qualities?id=${encodeURIComponent(item.id)}`) as Promise<MediaFacts | null>).catch(() => null),
    };
  } else {
    const poster = detailPosterUrl(item, host.settings().javImage);
    if (poster) video.poster = poster;
  }
  let player: VjsPlayer | null = null, released = false, detachChrome = () => {}, trackedVideo = video;
  const release = () => {
    detachChrome();
    if (player && handedOff?.(player)) return;
    stopPlaybackPosition(trackedVideo);
    if (!player) { stopTelemetry(trackedVideo); return }
    if (detailPlayer() === player) { setDetailPlayer(null); stopPlayerPanels() }
    disposePlayer(player);
  };
  void mountDetailPlayer(item, video, options.autoplay ?? host.settings().detailAutoplay, detail).then((mounted) => {
    player = mounted;
    // 挂载还没回来媒体区就换: esteunouno出来就拆掉. 
    if (released) { release(); return }
    trackedVideo = mounted?.el().querySelector('video') ?? video;
    trackPlaybackPosition(key, trackedVideo);
    if (kind === 'follow') wireFollowTelemetry(item, trackedVideo);
    else {
      trackedVideo.addEventListener('play', () => {
        void (api('/api/play', { method: 'POST', body: JSON.stringify({ id: item.id }) }) as Promise<unknown>).catch(() => {});
      }, { once: true });
      wireTelemetry(item, trackedVideo, { watched: '#watched', mark: '#mark', ratio: '#ratioTxt' });
    }
    if (!mounted) { onPlayer?.(null); return }
    if (frame) detachChrome = attachPlayerChrome(mounted, frame);
    onPlayer?.(mounted);
  });
  return () => { released = true; release() };
}
