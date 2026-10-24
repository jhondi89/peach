/* InmersivoModo(ADR-0031 No. 11e 步): `/immerse` Pantalla completa连播. 片单, 每uno格ReproducirDispositivo, CargarSugerencia, 手势, 
 * 动作Clave, 作者yTítulo都Enesteuno面dentro. 
 *
 * 常驻组件 `immerse`(`router/managed-routes.tsx` 常驻表): 路由树它画进 body último尾常驻宿主
 * `[data-immerse-host]`, 宿主就esese节点本身, No.uno次AbrirInmersivoModo时由 `application-residents.ts`  `loadImmerse` 建bien, 
 * En画primero帧同unoTareadentro挂进Documentación. primero帧就es藏着exterior框. 壳Solo拿 `configureImmerse` 给命令入口: Inmersivo
 * Modo盖En所Conpágina面之arriba, 壳Clave盘, 换批yReproducirrápido捷Clave要随时Sincronizar问它开没开, 当anteriores哪uno video. 句柄写本模
 *  store 再 `flushSync` 通知, `open(startId)` dentro骨架, ListayReproducirDispositivoese几次绘制都En返回之anterior画完, 紧跟着读
 * DOM 代码读到就es刚画bien结构. 
 *
 * exterior框, 动作列, 作者TítuloyProgreso由 React 画; 每uno格(`[data-immerse-slide]` ydentro面 `<video>`)
 * 由控制DispositivoEn空轨道dentro命令建, 拆: Video.js 要占着ese DOM, arribaabajo滑动移按帧写En格子
 * `style.transform` arriba, Progresoancho度随 timeupdate 写, estetres样都No能etc.uno次pesado画. 
 *
 * 方向Clave, 改窗口Tamañoy离开página面estetres监听挂En模arriba, No挂En组件arriba: Error边界卸掉esteuno面之posterior, 壳照antiguo能
 * 开关它, 离开página面时还开着格照antiguo按会话Cancelar读取. 
 *
 * 宿主No包 `.peach-react`: estePantalla completa层排版uno直En Preflight 之exterior, 按钮, 链continuaryTamaño de fuente继承es遗Deja层
 * Todo局Regla, 样TodoEn `immerse.css`, No用工具类.  */
import { useLayoutEffect, useRef, useSyncExternalStore, type MouseEvent, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';
import { useMutation, useQuery } from '@tanstack/react-query';

import { avatarInner, representativeOf } from '@peach/card-art';
import { fmtDur, realDuration } from '@peach/legacy/core';
import { spinnerHtml } from '@peach/legacy/ui';

import { apiSend } from '../../api';
import {
  cancelStreamSession, fmtSpeed, mountPlayer, newStreamSession, seekVideoBy, streamSpeedBits, toggleVideoPlayback,
} from '../../player';
import { replaceCatalogItem } from '../catalog-grid/catalog-grid';
import {
  FEEDBACK_URL, feedbackReceipt, fetchItem, ItemGone, itemKey, type DetailItem,
} from '../item-detail/item-detail';
import { queryClient } from '../query';
import {
  AXIS_LOCK_PX, DISLIKE_ADVANCE_MS, DOUBLE_TAP_MS, READY_TIMEOUT_MS, SLIDE_MS, SWIPE_PX, SYNTHETIC_CLICK_MS,
  TAP_SLOP_PX, WHEEL_GAP_MS, ensureDetail, extendList, fetchImmerseList, fitMode, immerseListKey, immerseQuery,
  isWide, ownerOf, type ImmerseItem,
} from './immerse';
import type { ImmerseApi, ImmerseHost } from './immerse-api';

/* ── Estado ── */

interface Shown { item: ImmerseItem; index: number; length: number }

interface View {
  open: boolean;
  /** No.uno片子出画anteriorSoloDejaCargarSugerencia: 框, 动作列, 作者Título y Progreso按出画时形状uno起出现, No会先按
   *  竖屏摆uno遍再跳. 片子En隐藏舞dentro照常缓冲.  */
  idle: boolean;
  /** 舞形状SoloEnuno片子真正出画时换. Nuevo片预Cargar时antiguo片还En屏arriba, 形状提anterior翻过去, antiguo片就被塞进
   *  另unoRelación框dentro.  */
  wide: boolean;
  /** CargarSugerenciaCompleto句(带读取Velocidad度); null es收起.  */
  loading: string | null;
  shown: Shown | null;
}

/** uno格: exterior层负责arribaabajo滑动, dentro面 video 交给 Video.js. 当anterior格用变量持Con, No按 id 查: Video.js
 *  挂载posterior会 video  id 挪到exterior包 div arriba.  */
interface Slide {
  el: HTMLDivElement;
  video: HTMLVideoElement;
  session: string;
  release: () => void;
  disposed: boolean;
  /** 拆掉时兑现: 还Enetc.片源或etc.出画eseuno步No再干etc..  */
  gone: Promise<void>;
  leave: () => void;
}

interface Dom { root: HTMLElement; track: HTMLElement; bar: HTMLElement; progress: HTMLElement }

const CLOSED: View = { open: false, idle: false, wide: false, loading: null, shown: null };

let host: ImmerseHost | null = null;
let dom: Dom | null = null;
let view: View = CLOSED;
const listeners = new Set<() => void>();
/* 每次Abrir, Cerrar各换uno代: 取数yEsperando回来时代次No对就作废.  */
let generation = 0;
let seed = 0;
let draw = 0;
let query = '';
let list: ImmerseItem[] = [];
let index = 0;
let switching = false;
let extending = false;
let current: Slide | null = null;
const slides = new Set<Slide>();
let loadingLabel = '';
let loadingItem: ImmerseItem | null = null;
let ticker = 0;
/** Progreso拖动作用En哪uno格arriba; No.uno出画anteriory关掉之posteriorSin.  */
let scrubTarget: { video: HTMLVideoElement; duration: () => number } | null = null;
let scrubbing = false;

function immerseHost(): ImmerseHost {
  if (!host) throw new Error('Modo inmersivoAún no haycontinuararriba宿主(configureImmerse)');
  return host;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener) };
}

function notify(): void {
  for (const listener of [...listeners]) listener();
}

/* 返回时ya经画完. esteuno面抛错, 被Error边界卸掉之posterior没人订阅, `view` 照antiguo写进 store, No画, No抛.  */
function paint(): void {
  flushSync(notify);
}

/* ── CargarSugerencia ── */

function loadingText(): string {
  const speed = loadingItem ? streamSpeedBits(loadingItem.id) : 0;
  return speed ? `${loadingLabel} · ${fmtSpeed(speed)}` : loadingLabel;
}

/** Abrir, 收起CargarSugerencia. 开着时每 500ms 按当anterioreseunoActualizar读取Velocidad度.  */
function setLoading(label: string | null, item: ImmerseItem | null = null): void {
  clearInterval(ticker);
  ticker = 0;
  if (label === null) { view = { ...view, loading: null }; paint(); return }
  loadingLabel = label;
  loadingItem = item;
  view = { ...view, loading: loadingText() };
  paint();
  ticker = window.setInterval(() => {
    loadingItem = list[index] ?? null;
    view = { ...view, loading: loadingText() };
    paint();
  }, 500);
}

/* ── 每uno格 ── */

function createSlide(offset: number): Slide {
  const el = document.createElement('div');
  el.dataset.immerseSlide = '';
  if (offset) el.style.transform = `translateY(${offset}%)`;
  // `video-js` 类要写En挂载anterior video arriba, Video.js 才会它带到exterior包 div arriba. 
  const video = document.createElement('video');
  video.className = 'video-js';
  video.playsInline = true;
  video.preload = 'auto';
  el.append(video);
  dom!.track.append(el);
  const session = newStreamSession();
  let leave = () => {};
  const gone = new Promise<void>((resolve) => { leave = resolve });
  const slide: Slide = { el, video, session, release: () => cancelStreamSession(session), disposed: false, gone, leave };
  slides.add(slide);
  return slide;
}

/** 挂arribaesteuno格ReproducirDispositivo; 片源交给 video 之posterior兑现(拆得更早就随拆兑现).  */
function loadSlide(slide: Slide, item: ImmerseItem): Promise<void> {
  return new Promise((resolve) => {
    slide.release = mountPlayer(slide.video, {
      kind: 'immerse', item, session: slide.session, onLoaded: resolve,
      onEnded: () => { if (view.open) void step(1) },
    });
    void slide.gone.then(resolve);
  });
}

/** 拆uno格: 按会话Cancelar读取, 拆ReproducirDispositivo, 摘节点.  */
function disposeSlide(slide: Slide | null): void {
  if (!slide || slide.disposed) return;
  slide.disposed = true;
  slides.delete(slide);
  slide.leave();
  slide.release();
  slide.el.remove();
  if (current === slide) current = null;
}

const READY_EVENTS = ['loadeddata', 'canplay', 'error'] as const;

function waitReady(slide: Slide): Promise<void> {
  const { video } = slide;
  if (video.readyState >= 3) return Promise.resolve();
  return new Promise((resolve) => {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      READY_EVENTS.forEach((event) => video.removeEventListener(event, done));
      resolve();
    };
    READY_EVENTS.forEach((event) => video.addEventListener(event, done, { once: true }));
    const timer = setTimeout(done, READY_TIMEOUT_MS);
    void slide.gone.then(done);
  });
}

/* ── 铺满还es完Completo显示 ── */

function fitVideo(video: HTMLVideoElement): void {
  const track = video.closest<HTMLElement>('[data-immerse-track]');
  const box = track && track.clientWidth && track.clientHeight
    ? track.clientWidth / track.clientHeight
    : window.innerWidth / window.innerHeight;
  const mode = fitMode(video.videoWidth, video.videoHeight, box);
  if (mode === 'contain') video.dataset.fit = 'contain';
  else if (mode) delete video.dataset.fit;
}

const fitAll = () => dom?.track.querySelectorAll('video').forEach(fitVideo);

function applyFit(video: HTMLVideoElement): void {
  delete video.dataset.fit;
  if (video.readyState >= 1) fitVideo(video);
  else video.addEventListener('loadedmetadata', () => fitVideo(video), { once: true });
}

/** 换舞形状, 框dentro每片子铺满判定跟着pesado算.  */
function setStage(wide: boolean): void {
  view = { ...view, wide };
  paint();
  fitAll();
}

/* ── 片单y换 ── */

const fetchDraw = (): Promise<ImmerseItem[]> => {
  const at = query;
  return queryClient.fetchQuery({
    queryKey: immerseListKey(at, seed, draw),
    queryFn: () => fetchImmerseList(at, immerseHost().sourceOffline),
    staleTime: Infinity,
  });
};

function wireProgress(video: HTMLVideoElement, item: ImmerseItem): void {
  const duration = () => realDuration(video.duration) || realDuration(item.duration);
  video.addEventListener('timeupdate', () => {
    const total = duration();
    if (total && dom) dom.progress.style.width = `${(video.currentTime / total * 100).toFixed(2)}%`;
  });
  scrubTarget = { video, duration };
}

async function show(direction = 0): Promise<void> {
  const item = list[index];
  if (!item || switching) return;
  const mine = generation;
  /* 当anterioresteuno交给壳写进地址栏: 竖划diez之posteriorActualizarpágina面, 落回来该es同uno片子, 而NoespesadoNuevo抽uno批.  */
  immerseHost().route(item.id);
  switching = true;
  setLoading(direction ? 'Cambiando en proceso...' : 'Cargando...', item);
  let incoming: Slide | null = null;
  try {
    // esteuno刚被删掉(Detalles回 `{error}`)照样放: 作者y动作ClaveSoloesSinpuede画. 
    await ensureDetail(item.id).catch((error: unknown) => { if (!(error instanceof ItemGone)) throw error });
    if (mine !== generation) return;
    const old = current, sliding = !!(direction && old);
    if (!sliding) disposeSlide(old);
    const next = createSlide(sliding ? (direction > 0 ? 100 : -100) : 0);
    incoming = next;
    applyFit(next.video);
    await loadSlide(next, item);
    await waitReady(next);
    if (next.disposed) return;
    setStage(isWide(next.video, item));
    if (sliding && old) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        old.el.style.transform = `translateY(${direction > 0 ? -100 : 100}%)`;
        next.el.style.transform = '';
      }));
      await new Promise((resolve) => setTimeout(resolve, SLIDE_MS));
      // 动画帧没跑到(página面Enposterior)也要落, 否则Nuevo片停En屏幕exterior. 
      disposeSlide(old);
      next.el.style.transform = '';
    }
    if (next.disposed) return;
    current = next;
    incoming = null;
    next.video.play()?.catch(() => {});
    view = { ...view, idle: false, shown: { item, index, length: list.length } };
    wireProgress(next.video, item);
    void apiSend('/api/play', { id: item.id }).catch(() => {});
    setLoading(null);
  } catch {
    disposeSlide(incoming);
    if (mine === generation) setLoading(null);
  } finally {
    if (mine === generation) switching = false;
  }
}

async function step(direction: number): Promise<void> {
  if (switching || !view.open) return;
  const mine = generation;
  index += direction;
  setLoading('Cambiando en proceso...', list[index] ?? null);
  // 滚到尾部就续取Siguiente批: Sin限流. 每次都esNuevoAleatorio抽样, 按 id 去pesadocontinuarEnposterior面. 
  if (index >= list.length - 3 && !extending) {
    extending = true;
    try {
      draw += 1;
      const more = await fetchDraw();
      if (mine === generation) list = extendList(list, more);
    } catch {
      // 续取Fallo就EnyaConeseuno批dentro绕回. 
    } finally {
      extending = false;
    }
  }
  if (mine !== generation) return;
  if (index >= list.length) index = 0;
  if (index < 0) index = list.length - 1;
  await show(direction);
}

async function open(startId: number | null): Promise<void> {
  const mine = ++generation;
  teardown();
  seed += 1;
  draw = 0;
  query = immerseQuery(immerseHost().filters());
  queryClient.removeQueries({ queryKey: ['immerse-list'] });
  view = { ...view, open: true, idle: true, shown: null };
  document.body.setAttribute('data-immerse-open', '');
  setLoading('Cargando contenido...');
  try {
    let next = await fetchDraw();
    if (startId && !next.some((item) => item.id === startId)) {
      const selected = await ensureDetail(startId).catch((error: unknown) => {
        if (error instanceof ItemGone) return null;
        throw error;
      });
      if (selected?.id) next = [selected as ImmerseItem, ...next.filter((item) => item.id !== startId)];
    }
    if (mine !== generation) return;
    list = next;
    if (!list.length) {
      close();
      immerseHost().warn('ActualFiltrarabajoSinpuede直continuarReproducircontenido');
      return;
    }
    index = Math.max(0, list.findIndex((item) => item.id === startId));
    await show();
  } catch {
    if (mine !== generation) return;
    setLoading(null);
    close();
  }
}

/** 拆掉所Con格, 收起Sugerenciay手势en proceso间态.  */
function teardown(): void {
  clearInterval(ticker);
  ticker = 0;
  clearTap();
  touch = null;
  scrubTarget = null;
  scrubbing = false;
  [...slides].forEach(disposeSlide);
  switching = false;
}

function close(): void {
  if (!view.open) return;
  generation++;
  teardown();
  view = CLOSED;
  document.body.removeAttribute('data-immerse-open');
  paint();
  immerseHost().closed();
}

/* ── 单击, 双击y触屏手势 ──
   Teléfonoarriba竖划切片, 横划拖Progreso. 横划En哪儿起手都行—屏幕最abajo沿eseProgresoEnTeléfonoarriba几乎摸No到. 
   移按屏ancho换算成Duración相对量, 所以从任何Ubicación起手都es"往derecha = 往posterior".  */

let tapTimer = 0;
let lastTap: { side: number; at: number } | null = null;
let ignoreClickUntil = 0;
let touch: { x: number; y: number; axis: '' | 'x' | 'y'; from: number; to?: number } | null = null;
let lastWheel = 0;

function clearTap(): void {
  clearTimeout(tapTimer);
  tapTimer = 0;
  lastTap = null;
}

/** izquierdaderechamedio区: 同侧两abajorápido退rápido进, unoabajo切Reproducir(etc.双击窗口过去才兑现).  */
function handleTap(clientX: number): void {
  const video = current?.video;
  if (!video) return;
  const side = clientX < window.innerWidth / 2 ? -1 : 1;
  const now = Date.now();
  if (lastTap && lastTap.side === side && now - lastTap.at <= DOUBLE_TAP_MS) {
    clearTap();
    seekVideoBy(video, immerseHost().seekSeconds() * side);
    return;
  }
  // 两次点EnNo同medio区时, No.unoabajo仍esuno次完Completo单击; 立即兑现posterior再etc.当anterior点击. 
  if (tapTimer) { clearTimeout(tapTimer); tapTimer = 0; toggleVideoPlayback(video) }
  lastTap = { side, at: now };
  tapTimer = window.setTimeout(() => {
    tapTimer = 0;
    lastTap = null;
    if (view.open) toggleVideoPlayback(current?.video);
  }, DOUBLE_TAP_MS);
}

function clickTrack(): void {
  // 触屏合成 click 会紧跟 touchend; eseunoabajoya经由单击/双击判定continuar管, No能再切uno次. 
  if (Date.now() < ignoreClickUntil) return;
  toggleVideoPlayback(current?.video);
}

const setBarScrubbing = (on: boolean) => dom?.bar.toggleAttribute('data-scrubbing', on);

function paintProgress(ratio: number): void {
  if (dom) dom.progress.style.width = `${(ratio * 100).toFixed(2)}%`;
}

function onTouchStart(event: TouchEvent): void {
  const target = event.target as Element | null;
  if (event.touches.length !== 1 || !target?.closest('[data-immerse-track]')) { touch = null; return }
  const video = current?.video;
  touch = { x: event.touches[0]!.clientX, y: event.touches[0]!.clientY, axis: '', from: video ? video.currentTime || 0 : 0 };
}

function onTouchMove(event: TouchEvent): void {
  if (!touch || event.touches.length !== 1) return;
  const dx = event.touches[0]!.clientX - touch.x, dy = event.touches[0]!.clientY - touch.y;
  if (!touch.axis) {
    if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
    touch.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (touch.axis === 'x') setBarScrubbing(true);
  }
  if (touch.axis !== 'x') return;
  const video = current?.video, total = video ? video.duration || 0 : 0;
  if (!total) return;
  event.preventDefault(); // 横划归Progreso, No交给página面滚动
  touch.to = Math.min(total, Math.max(0, touch.from + dx / window.innerWidth * total));
  paintProgress(touch.to / total);
}

function onTouchEnd(event: TouchEvent): void {
  if (!touch) return;
  const gesture = touch;
  touch = null;
  ignoreClickUntil = Date.now() + SYNTHETIC_CLICK_MS;
  setBarScrubbing(false);
  if (gesture.axis === 'x') {
    const video = current?.video;
    if (video && gesture.to != null) video.currentTime = gesture.to;
    return;
  }
  const end = event.changedTouches[0]!, dx = end.clientX - gesture.x, dy = gesture.y - end.clientY;
  if (Math.abs(dy) > SWIPE_PX) { clearTap(); void step(dy > 0 ? 1 : -1); return }
  if (Math.abs(dx) <= TAP_SLOP_PX && Math.abs(dy) <= TAP_SLOP_PX) {
    event.preventDefault();
    handleTap(end.clientX);
  }
}

function onTouchCancel(): void {
  touch = null;
  setBarScrubbing(false);
}

function onWheel(event: WheelEvent): void {
  const now = Date.now();
  if (now - lastWheel < WHEEL_GAP_MS) return;
  lastWheel = now;
  void step(event.deltaY > 0 ? 1 : -1);
}

/* Progreso拖动. pointer uno套同时盖鼠标 y 触控, 捕obtener指针posterior手滑出Progreso也No会断. 拖动en procesoSolo画Progreso, 
   松手才 seek—每帧都 seek 会让远程源uno直pesadoNuevo缓冲. 没拖动单击走同uno路: pointerdown ya经
   画Progreso, pointerup Llegar.  */
function barRatio(event: PointerEvent): number {
  const box = dom!.bar.getBoundingClientRect();
  return Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
}

function scrubStart(event: PointerEvent<HTMLDivElement>): void {
  if (!scrubTarget?.duration()) return;
  scrubbing = true;
  setBarScrubbing(true);
  event.currentTarget.setPointerCapture(event.pointerId);
  paintProgress(barRatio(event));
  event.preventDefault();
}

function scrubMove(event: PointerEvent): void {
  if (scrubbing) paintProgress(barRatio(event));
}

function scrubEnd(event: PointerEvent): void {
  if (!scrubbing) return;
  scrubbing = false;
  setBarScrubbing(false);
  const total = scrubTarget?.duration();
  if (scrubTarget && total) scrubTarget.video.currentTime = total * barRatio(event);
}

function scrubCancel(): void {
  scrubbing = false;
  setBarScrubbing(false);
}

/* ── 动作Clave ── */

type FeedbackKind = 'dislike' | 'seen' | 'o';
interface FeedbackResult { feedback?: string | null; disposal?: string | null; o_count?: number }

/** 写uno次Comentarios, 回执换进 `['item', id]`, Directoriodentro同uno卡跟着换.  */
export async function sendFeedback(id: number, kind: string): Promise<FeedbackResult> {
  const result = await apiSend<FeedbackResult>(FEEDBACK_URL, { id, kind });
  const before = queryClient.getQueryData<DetailItem>(itemKey(id));
  if (!before) {
    replaceCatalogItem(id, { feedback: result.feedback ?? undefined, o_count: result.o_count });
    return result;
  }
  const next: DetailItem = { ...before, feedback: result.feedback ?? undefined, o_count: result.o_count };
  queryClient.setQueryData(itemKey(id), next);
  replaceCatalogItem(id, {
    feedback: next.feedback, disposal: next.disposal, watch_later: next.watch_later, rating: next.rating, o_count: next.o_count,
  });
  return result;
}

const ACTIONS: { kind: FeedbackKind; glyph: string; label: string }[] = [
  { kind: 'dislike', glyph: 'thumbs-down', label: '标ComoNo me gusta' },
  { kind: 'seen', glyph: 'eye', label: '标ComoVisto' },
  { kind: 'o', glyph: 'heart', label: 'Registrar un orgasmo' },
];

/** 当anterior出画eseunoDetalles: 出画anteriorya经取过(`ensureDetail`), aquíSolo读缓存, 跟着写回pesado画.  */
function useDetail(id: number | null) {
  return useQuery({
    queryKey: itemKey(id ?? 0),
    queryFn: ({ signal }) => fetchItem(id!, signal),
    enabled: id != null,
    staleTime: Infinity,
  }).data;
}

function ImmerseAction({ kind, glyph, label, id }: { kind: FeedbackKind; glyph: string; label: string; id: number | null }) {
  const full = useDetail(id);
  const mutation = useMutation({
    mutationFn: async (target: number) => {
      const before = queryClient.getQueryData<DetailItem>(itemKey(target))?.feedback || null;
      return { result: await sendFeedback(target, kind), before };
    },
    onSuccess: ({ result, before }, target) => {
      immerseHost().toast(feedbackReceipt(kind, result), {
        undo: async () => {
          if (kind === 'o') await sendFeedback(target, 'o-undo');
          else {
            if (result.feedback) await sendFeedback(target, result.feedback);
            if (before) await sendFeedback(target, before);
          }
        },
      });
      if (kind === 'dislike' && result.feedback === 'dislike') setTimeout(() => { void step(1) }, DISLIKE_ADVANCE_MS);
    },
    onError: (error) => immerseHost().failure('ActualizarComentarios', error),
  });
  const busy = mutation.isPending;
  const pressed = kind !== 'o' && full ? (full.feedback === kind ? 'true' : 'false') : undefined;
  return (
    <div data-immerse-action="">
      <button type="button" data-immerse-circle="" title={label} aria-label={label} aria-pressed={pressed}
        {...(busy ? { 'aria-busy': true, 'aria-disabled': true } as const : {})}
        onClick={() => { if (id != null && !mutation.isPending) mutation.mutate(id) }}>
        <svg viewBox="0 0 24 24"><use href={`#i-${glyph}`} /></svg>
      </button>
      <span data-immerse-label="">
        {kind === 'dislike' ? 'No me gusta' : null}
        {kind === 'seen' ? (full?.feedback === 'seen' ? 'Ya visto' : 'Visto') : null}
        {kind === 'o' ? <>Orgasmo <b>{full?.o_count || 0}</b></> : null}
      </span>
    </div>
  );
}

/* ── 作者yTítulo ── */

function Caption({ shown }: { shown: Shown | null }) {
  const item = shown?.item ?? null;
  const full = useDetail(item?.id ?? null);
  const owner = full ? ownerOf(full) : null;
  const helpers = immerseHost();
  /* 点作者或Avatar: 先关掉, 再进Primero出镜者(Sin就es创作者)资料página.  */
  const openOwner = (event: MouseEvent) => {
    event.preventDefault();
    if (!full) return;
    close();
    if (full.performers?.[0]) helpers.openEntity('performer', full.performers[0]);
    else if (full.creator) helpers.openEntity('creator', full.creator);
    else helpers.openUnowned();
  };
  /* Título进Detallespágina. InmersivoMododentroSolover得到Archivo名, 想verEtiqueta, 相关Recomendado或改东西都得先Cerrar sesión再去Listadentro
     它找回来. Ruta y 旁边作者链continuaruno致: 先关, 再开.  */
  const openTitle = () => {
    if (!item) return;
    close();
    helpers.openItem(item.id);
  };
  const avatar = owner ? avatarInner(owner.name, owner.ref, representativeOf(owner.name), owner.kind || 'performer') : '';
  return (
    <div data-immerse-ui="">
      <div data-immerse-author="">
        <button type="button" data-immerse-avatar="" aria-label="AbrirDetalles" onClick={openOwner}
          dangerouslySetInnerHTML={{ __html: avatar }} />
        <a href="#" onClick={openOwner}>{owner?.who ?? ''}</a>
        <span>{shown && item ? `· ${fmtDur(item.duration)} · ${item.ctx_orient || ''} · ${shown.index + 1}/${shown.length}` : ''}</span>
      </div>
      <button type="button" data-immerse-title="" onClick={openTitle}>{item ? helpers.displayName(item).trim() || 'Video sin nombre' : ''}</button>
    </div>
  );
}

/* ── exterior框 ── */

const SPINNER = { __html: spinnerHtml('MediosCargarEn proceso') };

function ImmerseView({ view: at }: { view: View }) {
  const frame = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = frame.current!;
    dom = { root: el, track: track.current!, bar: bar.current!, progress: progress.current! };
    /* 横划要 `preventDefault`, React 触摸y滚轮事件挂En根arribaes被动, 拦No住página面滚动: este几直continuar挂
       En节点arriba.  */
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
      el.removeEventListener('wheel', onWheel);
      dom = null;
    };
  }, []);
  const id = at.shown?.item.id ?? null;
  const flag = (on: boolean) => (on ? '' : undefined);
  return (
    <div ref={frame} data-immerse="" data-idle={flag(at.idle)} data-wide={flag(at.wide)} hidden={!at.open}>
      <div data-immerse-stage="" data-wide={flag(at.wide)}>
        <div ref={track} data-immerse-track="" onClick={clickTrack} />
        <div data-immerse-actions="">
          {ACTIONS.map((action) => <ImmerseAction key={action.kind} {...action} id={id} />)}
        </div>
      </div>
      <div data-immerse-loader="" role="status" aria-live="polite" hidden={at.loading === null}>
        <span data-immerse-spinner="" dangerouslySetInnerHTML={SPINNER} />
        <span>{at.loading ?? ''}</span>
      </div>
      <button type="button" data-immerse-close="" title="Desactivar" aria-label="Desactivar" onClick={close}>
        <svg viewBox="0 0 24 24"><use href="#i-x" /></svg>
      </button>
      <div ref={bar} data-immerse-bar="" onPointerDown={scrubStart} onPointerMove={scrubMove}
        onPointerUp={scrubEnd} onPointerCancel={scrubCancel}>
        <i ref={progress} />
      </div>
      <Caption shown={at.shown} />
    </div>
  );
}

/* ── 对壳入口 ── */

const api: ImmerseApi = {
  open,
  close,
  isOpen: () => view.open,
  activeVideo: () => (view.open ? current?.video ?? null : null),
};

function onKeyDown(event: KeyboardEvent): void {
  if (!view.open) return;
  // Introducir态No抢Clave: Buscar框, Etiqueta弹窗 y 任何puedeEditar区域en la按Clave归它们自己Procesar. 
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  // 纵向切片,  y 竖屏corto视频手势方向保持uno致. 
  if (event.key === 'ArrowDown') void step(1);
  if (event.key === 'ArrowUp') void step(-1);
}

/** continuararriba壳给宿主, 拿回InmersivoModo命令入口. Solo调uno次; 壳 `loadImmerse` continuar着En路由树dentroAbriresteuno面, 
 *  藏着exterior框画arriba之posterior才交出句柄, No.uno次Abrir之anterior它就En.  */
export function configureImmerse(next: ImmerseHost): ImmerseApi {
  const first = !host;
  host = next;
  if (first) {
    document.addEventListener('keydown', onKeyDown);
    // RotarTeléfono或改窗口Tamañoposterior, 同uno视频铺满/完Completo显示判定puede能Voltear. 
    addEventListener('resize', () => { if (view.open) fitAll() });
    addEventListener('pagehide', () => { slides.forEach((slide) => cancelStreamSession(slide.session)) });
  }
  return api;
}

/** 常驻表en laeseuno面: 读本模 store, 宿主还没continuararriba时No画.  */
export function ImmerseSurface() {
  const at = useSyncExternalStore(subscribe, () => view);
  return host ? <ImmerseView view={at} /> : null;
}
