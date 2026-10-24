/* 舞ypequeño窗共用eseunoReproducirDispositivo(ADR-0031 No. 11a 步). No含 React: 舞岛媒体框En layout effect
 * dentro调 `attachStagePlayer`, pequeño窗组件自己节点登记进来, 其余都es命令. 
 *
 * 照 YouTube 桌面版 miniplayer(docs/reference-snapshots/youtube-miniplayer-measured.md): 离开Detalles
 * 时En curso放视频No销毁, Video.js 壳Completo搬进pequeño窗continuar着放; pequeño窗开着时点别卡片就Enpequeño窗dentro换片; 
 * 点Título或"展开"回到Detalles, 同uno实例搬回舞媒体框, Nopesado建; 拖到哪象限就吸附到哪角. 
 * arriba游SoloReproducirListainteriorCambiarDejaEnpequeño窗dentro, Peach 按用户要求卡片点击也收进来. 
 *
 * 舞ypequeño窗同uno时刻Solo放uno, 所以SoloCon两Ubicación: `attached` es舞媒体框en laeseuno, `held`
 * espequeño窗en laeseuno. uno实例从 `attached` 交到 `held`(离开Detalles), 或从 `held` 认领回
 * `attached`(展开), No会同时En两处.  */
import { api, fmtClock, realDuration } from '@peach/legacy/core';
import { iconSwapHtml, setIconSwap } from '@peach/legacy/ui';

import {
  attachPlayerChrome, cancelDetailStream, closePlayerMenu, configurePlayer, configurePlayerMenu, detailPlayer,
  disposePlayer, mountPlayer, preparePlayerFrame, resizeSoon, setDetailPlayer,
  type PlayerHost, type PlayerItem, type PlayerMedia, type PlayerResume, type VjsPlayer,
} from '../../player';

export type StageKind = 'item' | 'follow';

/** 舞此刻画着eseuno: pequeño窗Títuloy来源, derechaClave菜单Copiar网址用类都从aquí取.  */
export interface StageMeta { kind: StageKind; item: PlayerItem; title: string; sub: string }

/** 舞ypequeño窗向壳要东西. ReproducirDispositivo宿主en la舞元素由舞自己补arriba.  */
export interface StagePlayerHost {
  player: Omit<PlayerHost, 'stage'>;
  /** este来源此刻esNoes脱盘.  */
  sourceOffline(location: string): boolean;
  /** pequeño窗en la"展开": 回到esteunoDetalles, 壳负责地址y来处.  */
  expand(kind: StageKind, id: number, mediaIndex: number | null): void;
  /** pequeño窗continuarNo卡片照常AbrirDetalles.  */
  openItem(id: number): void;
}

/** pequeño窗组件画bien之posterior登记进来节点; Reproducir态, TiempoyRelación随ReproducirDispositivo事件直continuar写En它们身arriba.  */
export interface MiniplayerDom {
  root: HTMLElement;
  frame: HTMLElement;
  play: HTMLElement;
  time: HTMLElement;
  back: HTMLElement;
  ahead: HTMLElement;
  title: HTMLElement;
  sub: HTMLElement;
  info: HTMLElement;
}

interface Slot {
  player: VjsPlayer;
  kind: StageKind;
  item: PlayerItem;
  mediaIndex: number | null;
  key: string;
}

interface Held extends Slot { meta: StageMeta; off: (() => void)[]; pending: boolean }

interface Attached {
  player: VjsPlayer | null;
  kind: StageKind;
  item: PlayerItem;
  mediaIndex: number | null;
  key: string;
}

let host: StagePlayerHost | null = null;
let held: Held | null = null;
let attached: Attached | null = null;
let meta: StageMeta | null = null;
let dom: MiniplayerDom | null = null;
/* derechaClave菜单y i Clave"迷你ReproducirDispositivo": 越过Reproducir态判定, 舞arribaesteuno送进pequeño窗. 关窗Con退场动画, 
   所以它uno直Deja到舞真正拆掉eseuno刻才消费.  */
let requested = false;
let token = 0;
let requestClose: (() => void) | null = null;
let stageOpen: () => boolean = () => false;

export const playerKey = (kind: StageKind, id: number, mediaIndex: number | null): string =>
  `${kind}:${id}:${mediaIndex ?? ''}`;

export function configureStagePlayer(next: StagePlayerHost, stage: {
  isOpen(): boolean; requestClose(): void;
}): void {
  host = next;
  stageOpen = () => stage.isOpen();
  requestClose = () => stage.requestClose();
  configurePlayer({ ...next.player, stage: () => document.getElementById('stage') });
  configurePlayerMenu({
    inMiniplayer: (player) => held?.player === player,
    kind: (player) => (held?.player === player ? held.kind : attached?.kind ?? meta?.kind ?? 'item'),
    expand: () => expandMiniplayer(),
    toMiniplayer: () => toggleMiniplayer(),
  });
  // 离开página面时收掉Detallesesteuno路Nitidez探测y转码会话, 服务端NoDejaHuérfano进程. 
  if (!pagehideWired) { pagehideWired = true; addEventListener('pagehide', () => cancelDetailStream()) }
}
let pagehideWired = false;

function stageHost(): StagePlayerHost {
  if (!host) throw new Error('舞ReproductorAún no haycontinuararriba宿主(configureStagePlayer)');
  return host;
}

/** 舞画出uno时登记它Títuloy来源; 舞拆掉时清掉.  */
export function setStageMeta(next: StageMeta | null): void { meta = next }
export const stageMeta = (): StageMeta | null => meta;

/* ── 舞媒体框 ── */

export interface StagePlayerOptions {
  kind: StageKind;
  item: PlayerItem;
  media?: PlayerMedia | null | undefined;
  autoplay?: boolean | undefined;
  resume?: PlayerResume | null | undefined;
  /** `<video>`  id: ObrasDetalleseseunoes `vid`, Clave盘y e2e 按它找Reproducir区.  */
  id?: string | undefined;
  poster?: string | undefined;
  /** Original生 `<video>` 报错(关注Entrada据此Descripción片源Fallo).  */
  onError?: (() => void) | undefined;
}

/** 给舞dentrouno媒体框挂ReproducirDispositivo, 返回卸abajo它函数. 
 *
 *  pequeño窗正放着同uno(同类, 同 id, 同uno媒体)就eseuno实例认领回来: Video.js 壳Completo搬进
 *  este框, 读数pesadoNuevocontinuararriba, ReproducirNo断. 否则Nuevouno `<video>` 交给 `mountPlayer`. 卸abajo时este实例
 *  ya经被pequeño窗continuar走就Solo摘读数, 没被continuar走就连流会话uno起拆掉.  */
export function attachStagePlayer(frame: HTMLElement, options: StagePlayerOptions): () => void {
  const { kind, item, media = null } = options;
  const key = playerKey(kind, item.id, media?.index ?? null);
  if (held && held.key === key) return claimHeld(frame, held);
  if (held) closeMiniplayer();
  const slot: Attached = { player: null, kind, item, mediaIndex: media?.index ?? null, key };
  attached = slot;
  const video = document.createElement('video');
  if (options.id) video.id = options.id;
  video.className = 'video-js vjs-big-play-centered';
  video.controls = false;
  video.setAttribute('playsinline', '');
  video.preload = 'metadata';
  if (options.poster) video.poster = options.poster;
  if (options.onError) video.addEventListener('error', options.onError);
  frame.append(video);
  const release = mountPlayer(video, {
    kind, item, media, autoplay: options.autoplay, resume: options.resume ?? null,
    onPlayer: (player) => { if (attached === slot) slot.player = player },
    handedOff: (player) => held?.player === player,
  });
  return () => {
    const handed = !!slot.player && held?.player === slot.player;
    if (attached === slot) attached = null;
    release();
    if (handed) return;
    /* Video.js 没拉到时es裸 `<video>` En放: 节点离开Documentación照样出声, 先停abajo再清掉片源.  */
    if (!slot.player) { video.pause(); video.removeAttribute('src'); video.load() }
    cancelDetailStream();
  };
}

/** Muro面Recibirya选定本地视频Entrada; 计费yEn线Obras使用Detalles来源门槛.  */
export async function mountWallPlayer(summary: PlayerItem, frame: HTMLElement, signal: AbortSignal): Promise<(continuePlaying?: boolean) => void> {
  const item = await api(`/api/item?id=${summary.id}`, { signal }) as PlayerItem & { error?: string };
  signal.throwIfAborted();
  if (!item || item.error) throw new Error(item?.error || 'ObraNo disponible');
  if (item.medium && item.medium !== 'video') throw new Error('esteResultadoObraSinpuedeReproducirVideos');
  if (item.location === 'online') throw new Error('Por favorAbrir detallesReproducirObras en línea');
  if (item.cost === 'metered') throw new Error('Por favorAbrir detallesConfirmar计费Fuente');
  const sources = await stageHost().player.loadSourceStatus();
  signal.throwIfAborted();
  if (sources[String(item.location || '')] === false) throw new Error(stageHost().player.offlineReason(String(item.location || '')));
  const metadata: StageMeta = { kind: 'item', item, title: String(item.title || item.name || ''),
    sub: String((item.performers as string[] | undefined)?.[0] || item.creator || 'Sin asignar') };
  setStageMeta(metadata);
  const release = attachStagePlayer(frame, { kind: 'item', item, autoplay: true });
  let released = false;
  return (continuePlaying = false) => {
    if (released) return;
    released = true;
    if (continuePlaying && meta === metadata) handOffStage(true);
    release();
    if (meta === metadata) setStageMeta(null);
  };
}

function claimHeld(frame: HTMLElement, from: Held): () => void {
  const { player } = from;
  unbindHeld(from);
  held = null;
  hideMiniplayer();
  player.el().classList.remove('vjs-peach-mini');
  preparePlayerFrame(frame);
  frame.append(player.el());
  setDetailPlayer(player);
  const slot: Attached = { player, kind: from.kind, item: from.item, mediaIndex: from.mediaIndex, key: from.key };
  attached = slot;
  const detachChrome = attachPlayerChrome(player, frame);
  resizeSoon(player);
  return () => {
    if (attached === slot) attached = null;
    detachChrome();
    if (held?.player === player) return;
    if (detailPlayer() === player) setDetailPlayer(null);
    disposePlayer(player);
    cancelDetailStream();
  };
}

/** 舞此刻挂着eseReproducirDispositivo(derechaClave菜单, i Clavey剧场Modo要).  */
export const stagePlayer = (): VjsPlayer | null => {
  const player = attached?.player;
  return player && !player.isDisposed() ? player : null;
};

/** 舞要拆: 舞arribaEn curso放esteuno该No该进pequeño窗. `allow` eseste次离开允No允许进pequeño窗—显
 *  Cerrar(叉, Escape), 换成别Detallesy删掉当anteriorEntrada都No允许; derechaClave菜单y i ClavePor favor求过例exterior. 
 *  展开之posterior还没来得及认领eseuno(取数改道, 盘没挂arriba)Enaquíuno起收掉.  */
export function handOffStage(allow: boolean): void {
  const wanted = requested;
  requested = false;
  if (held?.pending) closeMiniplayer();
  const slot = attached;
  const player = slot?.player;
  const current = meta;
  if (!slot || !player || player.isDisposed() || !current || !dom) return;
  const settings = stageHost().player.settings();
  const eligible = wanted || (allow && settings.miniplayer && !player.paused() && !player.ended() && !player.error());
  if (!eligible) return;
  enterMiniplayer({ player, kind: slot.kind, item: slot.item, mediaIndex: slot.mediaIndex, key: slot.key }, current);
}

/** 舞Abriresteuno之anterior: pequeño窗放着Noes它就先关掉, 两ReproducirDispositivoNo同时出声; es它就先藏起来, 
 *  etc.媒体框画出来再认领.  */
export function prepareStageFor(kind: StageKind, id: number): void {
  requested = false;
  if (!held) return;
  if (held.kind === kind && held.item.id === id) {
    held.pending = true;
    hideMiniplayer();
    return;
  }
  closeMiniplayer();
}

/* ── pequeño窗 ── */

export function registerMiniplayer(next: MiniplayerDom | null): void {
  dom = next;
  if (dom) syncSeekLabels();
}

export const miniplayerActive = (): boolean => !!held && !held.pending && !held.player.isDisposed();

export function miniplayerVideo(): HTMLVideoElement | null {
  return miniplayerActive() ? dom?.frame.querySelector('video') ?? null : null;
}

/** 此刻该RespuestaReproducirrápido捷Clave video: 舞开着取舞en la, 否则取pequeño窗en la. 直continuar操作Original生元素而Noes
 *  Video.js 实例: 挂载posterior `#vid` es Video.js  div, 真正媒体元素es `#vid_html5_api`.  */
export function activeStageVideo(): HTMLVideoElement | null {
  if (stageOpen()) return document.getElementById('stage')?.querySelector('video') ?? null;
  return stagePlayer()?.el().querySelector('video') ?? miniplayerVideo();
}

function paintMeta(next: { title: string; sub: string }): void {
  if (!dom) return;
  dom.title.textContent = next.title || '';
  dom.sub.textContent = next.sub || '';
  dom.info.setAttribute('aria-label', next.title ? `Expandir a detalles: ${next.title}` : 'Expandir a detalles');
}

/* Imagen区按视频Relación给alto: arriba游 4:3 片子pequeño窗就es 400×300. 竖片压到 1:1 以interior, 400 ancho 9:16
   会alto过视口.  */
function syncAspect(item: PlayerItem | undefined = held?.item): void {
  if (!dom) return;
  const video = dom.frame.querySelector('video');
  const width = video?.videoWidth || Number(item?.width) || 16;
  const height = video?.videoHeight || Number(item?.height) || 9;
  dom.frame.style.setProperty('--miniplayer-aspect', `${Math.max(width, height)}/${height}`);
}

function syncPlayState(): void {
  const player = held?.player;
  if (!player || player.isDisposed() || !dom) return;
  const paused = player.paused();
  dom.play.setAttribute('aria-label', paused ? 'Reproducir' : 'Pausar');
  /* 主ReproducirDispositivoeseuno走es path 形变, 迷你arribaesteunoSoloCon 20px, 形变verNo出来, 走两字形叠着换. 
     换Soloes容DispositivoEstado, No改 `use`  href—改 href esGrave切.  */
  if (!dom.play.querySelector('[data-icon-swap]')) dom.play.innerHTML = iconSwapHtml('player-pause', 'player-play', paused ? 'b' : 'a');
  setIconSwap(dom.play, paused ? 'b' : 'a');
}

function syncTime(): void {
  const player = held?.player;
  if (!player || player.isDisposed() || !dom) return;
  const total = realDuration(held?.item.duration) || realDuration(player.duration());
  dom.time.textContent = `${fmtClock(player.currentTime())} / ${total ? fmtClock(total) : '0:00'}`;
}

const seekStep = (): number => Math.max(1, Number(stageHost().player.settings().seekSeconds) || 10);

/* 步largo跟Configuración走, Etiquetadentro带着este数: 读屏用户按之anterior听得到自己会跳más远. 每次continuar手ReproducirDispositivo时pesado写
   uno遍, Configuración改完开Siguientepequeño窗就esNuevo秒数.  */
function syncSeekLabels(): void {
  if (!dom || !host) return;
  const step = seekStep();
  for (const [button, text] of [[dom.back, `posterior退 ${step} segundo(s)`], [dom.ahead, `anterior进 ${step} segundo(s)`]] as const) {
    button.setAttribute('aria-label', text);
    button.title = text;
  }
}

function bindHeld(slot: Held): void {
  const on = (events: string | string[], handler: () => void) => {
    slot.player.on(events, handler);
    slot.off.push(() => { try { slot.player.off(events, handler) } catch { /* ya拆 */ } });
  };
  on(['play', 'pause', 'ended'], syncPlayState);
  on(['timeupdate', 'durationchange', 'loadedmetadata'], syncTime);
  on('loadedmetadata', () => syncAspect());
  syncPlayState(); syncTime(); syncAspect(); syncSeekLabels();
}

function unbindHeld(slot: Held): void { slot.off.forEach((off) => off()); slot.off = [] }

function showMiniplayer(): void {
  const root = dom?.root;
  if (!root) return;
  const entering = root.hidden;
  root.hidden = false;
  if (!entering) return;
  root.setAttribute('data-miniplayer-enter', '');
  const settle = () => root.removeAttribute('data-miniplayer-enter');
  root.addEventListener('animationend', settle, { once: true });
  setTimeout(settle, 500);
}

function hideMiniplayer(): void {
  const root = dom?.root;
  if (!root) return;
  root.hidden = true;
  for (const state of ['data-miniplayer-drag', 'data-miniplayer-snap', 'data-miniplayer-enter']) root.removeAttribute(state);
  root.style.transform = '';
}

function enterMiniplayer(slot: Slot, next: StageMeta): void {
  if (!dom) return;
  const entry: Held = { ...slot, meta: next, off: [], pending: false };
  held = entry;
  token++;
  slot.player.el().classList.add('vjs-peach-mini');
  dom.frame.prepend(slot.player.el());
  paintMeta(next);
  bindHeld(entry);
  showMiniplayer();
  resizeSoon(slot.player);
}

export function closeMiniplayer(): void {
  const slot = held;
  if (slot) unbindHeld(slot);
  held = null;
  token++;
  const player = slot?.player ?? null;
  if (player && detailPlayer() === player) setDetailPlayer(null);
  disposePlayer(player);
  if (player) cancelDetailStream();
  dom?.frame.querySelectorAll('.video-js,video').forEach((el) => el.remove());
  closePlayerMenu();
  hideMiniplayer();
}

export function expandMiniplayer(): void {
  if (!miniplayerActive() || !held) return;
  const { kind, item, mediaIndex } = held;
  stageHost().expand(kind, item.id, mediaIndex);
}

/** i Clavey YouTube 同义: Detallesdentro进pequeño窗, pequeño窗dentro展开回Detalles.  */
export function toggleMiniplayer(): void {
  if (miniplayerActive() && !stageOpen()) { expandMiniplayer(); return }
  if (stageOpen() && stagePlayer() && requestClose) { requested = true; requestClose() }
}

export function playMiniplayer(): void {
  const player = held?.player;
  if (!player || player.isDisposed()) return;
  if (player.paused()) player.play()?.catch(() => {}); else player.pause();
}

/* Duración取No到时No封顶: En vivo y 还没读到Metadatos片子 `duration()` es NaN, 拿它去 `Math.min` 会Progreso
   直continuar扔成 NaN, 视频停EnOriginal地No动.  */
export function seekMiniplayer(side: 1 | -1): void {
  const player = held?.player;
  if (!player || player.isDisposed()) return;
  const total = realDuration(player.duration()) || realDuration(held?.item.duration) || 0;
  const at = Math.max(0, (Number(player.currentTime()) || 0) + seekStep() * side);
  player.currentTime(total ? Math.min(total, at) : at);
}

/** pequeño窗dentro能直continuar换SoloCon普通视频卡: 分卷/版次组要先选卷, 计费, 脱盘 y 反查No到关注EntradaEn线
 *  资产都要先过Detallesdentroese道门.  */
export function miniplayerTakesCard(item: PlayerItem | null | undefined): boolean {
  if (!miniplayerActive() || !item) return false;
  if (item.part_group || item.edition_group) return false;
  if (item.medium && item.medium !== 'video') return false;
  if (item.cost === 'metered' && item.location !== 'online') return false;
  if (item.location === 'online' && !item.follow_item_id) return false;
  if (stageHost().sourceOffline(String(item.location ?? ''))) return false;
  return true;
}

/** Enpequeño窗dentro换unoObras. 换片就esunoNuevo视频, pesadoNuevo挂unoReproducirDispositivo最干净: AnteriorError兜底, 观ver
 *  arriba报 y Nitidez表都绑Enantiguo实例闭包dentro, 复用它Solo会Nuevo片行Como记到antiguo片头arriba.  */
export async function miniplayerPlay(id: number): Promise<void> {
  if (!miniplayerActive() || !held || !dom) return;
  const mine = ++token;
  const item = await (api(`/api/item?id=${id}`) as Promise<(PlayerItem & { error?: unknown }) | null>).catch(() => null);
  if (mine !== token || !miniplayerActive() || !held || !dom) return;
  if (!item || item.error) return;
  if (!miniplayerTakesCard(item)) { stageHost().openItem(id); return }
  const previous = held;
  unbindHeld(previous);
  if (detailPlayer() === previous.player) setDetailPlayer(null);
  disposePlayer(previous.player);
  cancelDetailStream();
  dom.frame.querySelectorAll('.video-js,video').forEach((el) => el.remove());
  const video = document.createElement('video');
  video.className = 'video-js';
  video.setAttribute('playsinline', '');
  video.preload = 'metadata';
  dom.frame.prepend(video);
  const nextMeta: StageMeta = { kind: 'item', item, title: String(item.title || item.name || ''),
    sub: String((item.performers as string[] | undefined)?.[0] || item.creator || 'Sin asignar') };
  /* 换片期间 `held` 仍指着antiguoeseuno格(标成ya拆), pequeño窗No因Como挂载要etc.uno拍而收起.  */
  paintMeta(nextMeta);
  mountPlayer(video, {
    kind: 'item', item, autoplay: true, chrome: false,
    onPlayer: (player) => {
      if (mine !== token) {
        if (player && detailPlayer() === player) setDetailPlayer(null);
        disposePlayer(player);
        return;
      }
      if (!player) { closeMiniplayer(); stageHost().openItem(id); return }
      player.el().classList.add('vjs-peach-mini');
      const slot: Held = { player, kind: 'item', item, mediaIndex: null, key: playerKey('item', item.id, null),
        meta: nextMeta, off: [], pending: false };
      held = slot;
      bindHeld(slot);
        },
  });
  syncAspect(item);
}
