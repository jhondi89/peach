/* 舞(ADR-0031 No. 11a 步): Detalles浮窗 `<dialog id="stage">`, 它进出场, 骨架y揭示, 两座Detalles, 
 * ReproducirDispositivoypequeño窗都Enesteuno面dentro. 
 *
 * 常驻组件 `stage`(`router/managed-routes.tsx` 常驻表): 路由树它画进 body último尾常驻宿主
 * `[data-stage-host]`, 宿主就esese节点本身, No包 `.peach-react`, No.uno次AbrirDetalles时由 `application-residents.ts` 
 * `loadStage` 建bien, En画出pequeño窗节点同unoTareadentro挂进Documentación. 舞盖En所Conpágina面之arriba, pequeño窗要En换página之posteriorcontinuar着放, 
 * 所以宿主No跟某unopágina走. 壳Solo拿 `configureStage` 给命令入口: 句柄写本模 store 再 `flushSync` 通知, 
 * `open`(含Original地换), `update` y `dispose` dentro每uno次绘制都En返回之anterior画完, 紧跟着读 DOM 代码(骨架量尺寸, 
 * `showModal`, Título揭示, 焦点交给CerrarClave)读到就es刚画bien结构. 
 *
 * 每次 `open` 换uno `generation`, 取数回来时代次No对就作废; pesado开时 dialog 按它pesado建, Original地换沿用开着ese. 
 * 两座Detallesesesteuno面子组件,  y página面共用路由树 QueryClient(`providers.tsx`). 两座Detalles画出来时报给壳 `present` 排到微Tareadentro: 壳收到posterior
 * 会画侧栏y顶栏, ese几座常驻组件句柄interior部 `flushSync`, En路由树提交阶段dentro画No出来. 微TareaEnExplorar dispositivo绘制anterior
 * 跑完; eseunoya经换走(Original地换或pesado开)或舞ya经收起就No报.  */
import { useLayoutEffect, useRef, useSyncExternalStore, type MouseEvent, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';

import { detailPosterUrl, releaseHoverPreviews } from '@peach/card-art';
import { fitSkeleton, revealTexts } from '@peach/legacy/ui';

import { detailSkeletonBody } from '../../board-skeleton';
import { applyTheaterMode, closePlayerMenu, type PlayerResume } from '../../player';
import { followItemKey, prefetchFollowDetail, type FollowDetailActions, type FollowDetailProps } from '../follow-detail/follow-detail';
import { FollowDetailPage } from '../follow-detail/follow-detail-page';
import { chooseItem, itemKey, prefetchItemDetail, queueKey, type DetailQueue, type ItemDetailActions, type ItemDetailProps } from '../item-detail/item-detail';
import { ItemDetailPage } from '../item-detail/item-detail-page';
import { javDetailKey, prefetchJavDetail, type JavDetailProps } from '../jav-detail/jav-detail';
import { queryClient } from '../query';
import { JavDetailPage } from '../jav-detail/jav-detail-page';
import { Miniplayer } from './miniplayer';
import * as player from './stage-player';
import type { StageApi, StageHost, StagePatch, StageRequest } from './stage-api';

type Phase = 'skeleton' | 'reveal' | 'content';

type Content =
  | { kind: 'item'; props: ItemDetailProps }
  | { kind: 'jav'; props: JavDetailProps }
  | { kind: 'follow'; props: FollowDetailProps };

interface View {
  generation: number;
  request: StageRequest;
  content: Content;
  /* 骨架 → 淡出(骨架抬成 `[data-stage-fade]` uno层, contenido同时清晰起来)→ contenido. 取得比显示门槛rápido时Omitir
     en proceso间eseuno段: 从no露面骨架No该再演uno次退场.  */
  phase: Phase;
}

let host: StageHost | null = null;
let view: View | null = null;
const listeners = new Set<() => void>();
let generation = 0;
let controller: AbortController | null = null;
/* CerrarClave, Escape, 点浮窗exterior面yOriginal生 `cancel` puede能En同unoabajodentro各来uno次: 退场动画期间再要uno次, 
   会让No.dos次CerrarOmitir动画直continuar拆.  */
let closeRequested = false;
/* 按abajoeseuno刻EnNoEn浮窗exterior面. DetallesdentroProgreso, Volumen y Cola都能拖, 从Controlesarriba拖出边界再松手同样会En
   dialog arriba收到uno次 click—eseesuno次拖动收尾, Noes要关窗.  */
let dismissArmed = false;

const stageDialog = (): HTMLDialogElement | null => {
  const el = document.getElementById('stage');
  return el instanceof HTMLDialogElement ? el : null;
};

function stageHost(): StageHost {
  if (!host) throw new Error('El escenario aún no está conectado al host (configureStage)');
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

function StageTree({ view: current }: { view: View | null }) {
  return (
    <>
      {current ? <StageDialog key={current.generation} view={current} /> : null}
      <Miniplayer />
    </>
  );
}

const DetailSkeleton = () => (
  <div data-skeleton="detail" role="status" aria-label="CargandoObraDetalles" dangerouslySetInnerHTML={{ __html: detailSkeletonBody() }} />
);

/* 点浮窗exterior面就Cerrar sesión. Original生模态dentro"exterior面"还eseste dialog 自己—遮罩归它, 落En遮罩en la事件 target
   就es它本人, 所以判据取坐标No取 target: 按 target 判, 浮窗身arriba任何unoNo属于contenido地方都会被算成
   点exterior面. Solover坐标也No够: ReproducirDispositivoPantalla completaposterior铺满Completo视口, 浮窗矩形仍esDetalles排版dentroese, 点Progresoderecha段
   或底部控制栏会落En矩形exterior. 所以两都要成立: target es dialog 本身, 坐标En浮窗exterior.  */
function outside(event: MouseEvent | PointerEvent): boolean {
  const dialog = event.currentTarget as HTMLElement;
  if (event.target !== dialog) return false;
  const box = dialog.getBoundingClientRect();
  return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
}

function StageDialog({ view: current }: { view: View }) {
  const ref = useRef<HTMLDialogElement>(null);
  /* Original生 `cancel`(Escape 之exteriorCerrarPor favor求, 例如安卓返回手势)yCerrarClave走同uno路. Escape 本身En
     keydown arriba就Procesar掉: esedentro `preventDefault` 之posteriorExplorar dispositivoNo再派 `cancel`.  */
  useLayoutEffect(() => {
    const dialog = ref.current!;
    // ArchivoSeleccionar框 cancel 会冒泡; DetallesSoloProcesar自己CerrarPor favor求. 
    const cancel = (event: Event) => { if (event.target === dialog) { event.preventDefault(); requestClose() } };
    dialog.addEventListener('cancel', cancel);
    return () => dialog.removeEventListener('cancel', cancel);
  }, []);
  const { phase, content } = current;
  /* Original地换时关注Detalles按Entradapesado建: 选en procesoese媒体, 写操作忙碌yFallo都Solo属于Anterior. ObrasDetalles
     自己按Entrada给 `Detail` 换Clave, Cola取数DejaEnexterior层Nopesado来.  */
  const body = content.kind === 'item'
    ? <ItemDetailPage {...content.props} />
    : content.kind === 'jav' ? <JavDetailPage key={content.props.code} {...content.props} />
    : <FollowDetailPage key={content.props.id} {...content.props} />;
  return (
    <dialog ref={ref} id="stage" data-stage="" data-stage-kind={content.kind} aria-label="ObraDetalles"
      onKeyDown={(event) => {
        /* dentro层弹层(EtiquetaBuscar框, derechaClave菜单)先Procesar Escape y `preventDefault`, esteunoabajo就No再关浮窗.  */
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        event.preventDefault();
        requestClose();
      }}
      onPointerDown={(event) => { dismissArmed = outside(event) }}
      onClick={(event) => { if (dismissArmed && outside(event)) requestClose() }}>
      {phase === 'skeleton' ? <DetailSkeleton key="skeleton" /> : null}
      {phase === 'reveal' ? <div key="fade" data-stage-fade="" aria-hidden="true"><DetailSkeleton /></div> : null}
      {phase === 'skeleton' ? null : (
        /* estrecho屏abajo滚es `[data-stage-scroll]`, Todo站ese覆盖滚动挂En它兄弟Ubicación(`<dialog>` En顶层, 
           轨道挂到它exterior面会落进遮罩底abajo); "Continuar viendo"es `[data-stage-grid]` 兄弟, 也得uno起装进来. dentro面ese层
           `.peach-react` No占盒子, token y Preflight 从它Empezar作用.  */
        <div key="content" data-stage-scroll=""><div className="peach-react">{body}</div></div>
      )}
    </dialog>
  );
}

function requestClose(): void {
  if (!view || closeRequested) return;
  closeRequested = true;
  view.request.actions.close();
}

function toggleStageModes(ambient: boolean, theater: boolean): void {
  const dialog = stageDialog();
  dialog?.toggleAttribute('data-ambient', ambient);
  dialog?.toggleAttribute('data-theater', theater);
}

/* 两座Detalles动作经舞包uno层: Cerrar走 `requestClose`; 画出来eseuno刻登记pequeño窗Metadatos, 切氛围光y剧场
   Modo; 媒体框交给舞ReproducirDispositivo. 续播时刻Solo给No.uno次挂en laeseuno.  */
function contentFor(request: StageRequest): Content {
  if (request.kind === 'jav') return { kind: 'jav', props: { code: request.code, readOnly: request.readOnly,
    actions: { ...request.actions, close: requestClose } } };
  let resume: PlayerResume | null = request.resume ?? null;
  const takeResume = (id: number) => {
    const hit = resume && (request.id == null || request.id === id) ? resume : null;
    resume = null;
    return hit;
  };
  const settings = () => stageHost().player.settings();
  /* Original地换沿用浮窗开着时代次(dialog Nopesado建), 所以按esteuno次Abrir request 认: 换ypesado开都换unoNuevo.  */
  const live = () => view?.request === request;
  if (request.kind === 'item') {
    const { kind: _kind, resume: _resume, actions: base, ...props } = request;
    const actions: ItemDetailActions = {
      ...base,
      close: requestClose,
      present: (item, queue) => {
        const performers = item.performers as string[] | undefined;
        player.setStageMeta({ kind: 'item', item, title: String(item.title || item.name || ''),
          sub: String(performers?.[0] || item.creator || 'Sin asignar') });
        toggleStageModes(settings().ambientMode, settings().theaterMode);
        queueMicrotask(() => { if (live()) base.present(item, queue) });
      },
      mountPlayer: (frame, item, _media, options) => player.attachStagePlayer(frame, {
        kind: 'item', item, autoplay: options?.autoplay, resume: takeResume(item.id), id: 'vid',
      }),
    };
    return { kind: 'item', props: { ...props, actions } };
  }
  const { kind: _kind, resume: _resume, actions: base, ...props } = request;
  const actions: FollowDetailActions = {
    ...base,
    close: requestClose,
    present: (item, kind) => {
      player.setStageMeta({ kind: 'follow', item, title: item.title || '', sub: item.author || item.source_label || '' });
      toggleStageModes(kind === 'video' && settings().ambientMode, kind === 'video' && settings().theaterMode);
      queueMicrotask(() => { if (live()) base.present(item, kind) });
    },
    mountPlayer: (frame, item, media, options) => player.attachStagePlayer(frame, {
      kind: 'follow', item, media, poster: item.thumb_url || undefined, onError: options.onError, resume: takeResume(item.id),
    }),
  };
  return { kind: 'follow', props: { ...props, actions } };
}

/* 骨架抬成uno层淡出, contenido同时从Difusodentro清晰起来; 走完(或 1s 兜底)摘掉eseuno层.  */
function startReveal(dialog: HTMLDialogElement, mine: number): void {
  const fade = dialog.querySelector<HTMLElement>(':scope > [data-stage-fade]');
  dialog.setAttribute('data-stage-reveal', '');
  dialog.getBoundingClientRect();
  dialog.setAttribute('data-stage-revealing', '');
  let timer = 0;
  const drop = () => {
    clearTimeout(timer);
    fade?.removeEventListener('transitionend', done);
    dialog.removeAttribute('data-stage-reveal');
    dialog.removeAttribute('data-stage-revealing');
    if (view?.generation === mine && view.phase === 'reveal') { view = { ...view, phase: 'content' }; paint() }
  };
  const done = (event: Event) => { if (event.target === fade) drop() };
  fade?.addEventListener('transitionend', done);
  timer = window.setTimeout(drop, 1000);
}

/** 浮窗开着同unoDetalles, NoEn退场: 换就Original地换contenido, No拆浮窗.  */
function swappable(kind: StageRequest['kind']): HTMLDialogElement | null {
  const dialog = stageDialog();
  if (!view || view.content.kind !== kind || closeRequested || !dialog?.open || dialog.hasAttribute('data-closing')) return null;
  return dialog;
}

async function open(request: StageRequest): Promise<void> {
  const current = swappable(request.kind);
  if (current) { await swap(request, current); return }
  if (view) dispose({ miniplayer: false });
  const mine = ++generation;
  const abort = new AbortController();
  controller = abort;
  closeRequested = false;
  dismissArmed = false;
  if (request.kind === 'jav') player.closeMiniplayer();
  else player.prepareStageFor(request.kind, request.id ?? Number.NaN);
  const content = contentFor(request);
  view = { generation: mine, request, content, phase: 'skeleton' };
  const waiting = content.kind === 'item' ? prefetchItemDetail(content.props, abort.signal)
    : content.kind === 'jav' ? prefetchJavDetail(content.props, abort.signal)
    : prefetchFollowDetail(content.props, abort.signal);
  if (mine !== generation || view?.request !== request) { await waiting.catch(() => {}); return }
  const cached = cachedContent(content);
  view = { ...view, phase: cached ? 'content' : 'skeleton' };
  paint();
  const dialog = stageDialog();
  if (!dialog) { await waiting.catch(() => {}); return }
  if (!cached) fitSkeleton(dialog);
  document.body.setAttribute('data-detail-open', '');
  if (!dialog.open) dialog.showModal();
  try {
    await waiting;
  } catch {
    // en proceso止就es用户ya经走开. 其余Fallo照画: Original因 y Reintentar节律都EnDetalles自己手dentro. 
    if (abort.signal.aborted) return;
  }
  if (mine !== generation || !view) return;
  if (cached) return;
  /* 还没到显示门槛就ya经取完: 直continuar落contenido, 隐藏en proceso占从no被人ver见.  */
  const direct = !!dialog.querySelector('.skeleton-awaiting');
  view = { ...view, phase: direct ? 'content' : 'reveal' };
  paint();
  if (!direct) startReveal(dialog, mine);
  /* 浮窗dentroese两行Título跟着esteuno次pesado画揭示uno遍. 绕开En curso淡出eseuno层: 骨架照着最终结构画, dentro面也Con
     uno `[data-stage-side-content]`, 按Documentación顺序找话拿到es它.  */
  revealTexts(dialog, ':scope>:not([data-stage-fade]) [data-reveal-line]');
  /* 骨架dentroSinpuede聚焦元素, `showModal()` Solo能焦点给 dialog 本身; contenido到交给CerrarClave.  */
  const active = document.activeElement;
  if (active === dialog || !dialog.contains(active)) dialog.querySelector<HTMLElement>('#closeStage')?.focus();
}

/** puede立即完Completo呈现Detalles沿用Consulta缓存, ActualizarSoloActualizarcontenido.  */
function cachedContent(content: Content): boolean {
  if (content.kind === 'jav') return !!queryClient.getQueryData(javDetailKey(content.props.code));
  if (content.kind === 'follow') return !!queryClient.getQueryData(followItemKey(content.props.id));
  const { queue: ref, id } = content.props;
  const queue = ref ? queryClient.getQueryData<DetailQueue>(queueKey(ref)) : null;
  if (ref && !queue) return false;
  const current = queue ? chooseItem(queue, id) : id;
  return current != null && !!queryClient.getQueryData(itemKey(current));
}

/* Detalles开着时换到同uno另uno(Cola换卷, 合集换Versión, 相关Obras, posterior退anterior进): 浮窗, 遮罩y进场都No
   pesado演, 也No回骨架. 先Nuevouno取齐, 取este段TiempoAnterior照antiguoEn放; 取到再换contenido, 媒体框按Entrada卸abajo, 
   AnteriorReproducirDispositivo随之拆掉(No进pequeño窗).  */
async function swap(request: StageRequest, dialog: HTMLDialogElement): Promise<void> {
  const mine = ++generation;
  controller?.abort();
  const abort = new AbortController();
  controller = abort;
  dismissArmed = false;
  const content = contentFor(request);
  try {
    if (content.kind === 'item') await prefetchItemDetail(content.props, abort.signal);
    else if (content.kind === 'jav') await prefetchJavDetail(content.props, abort.signal);
    else await prefetchFollowDetail(content.props, abort.signal);
  } catch {
    if (abort.signal.aborted) return;
  }
  if (mine !== generation || !view || swappable(request.kind) !== dialog) return;
  if (request.kind === 'jav') player.closeMiniplayer();
  else player.prepareStageFor(request.kind, request.id ?? Number.NaN);
  releaseHoverPreviews(dialog);
  closePlayerMenu();
  view = { ...view, request, content, phase: 'content' };
  paint();
  /* primero次揭示还没走完就换: 淡出eseuno层ya经卸abajo, etc.No到它 transitionend, Difuso要当场摘掉.  */
  dialog.removeAttribute('data-stage-reveal');
  dialog.removeAttribute('data-stage-revealing');
  dialog.querySelector<HTMLElement>(':scope > [data-stage-scroll]')?.scrollTo({ top: 0 });
  revealTexts(dialog, ':scope>:not([data-stage-fade]) [data-reveal-line]');
  /* 点abajo去eseuno行随Detallespesado建卸掉, 焦点落回 body: 交给ColadentroNuevo当anterior行, SinCola交给CerrarClave.  */
  const active = document.activeElement;
  if (active === dialog || !dialog.contains(active)) {
    (dialog.querySelector<HTMLElement>('[data-mix-item][aria-current="true"]')
      || dialog.querySelector<HTMLElement>('#closeStage'))?.focus({ preventScroll: true });
  }
}

/* Detalles浮窗退场跟Configuración弹层同uno: `data-closing` 让 `board-dialog-out`  y 遮罩淡出演完, 再拆. EsperandoCon
   arriba限: `animation` 被别Regla关掉时 animationend No会来.  */
function exit(): Promise<void> {
  const dialog = stageDialog();
  if (!dialog?.open || dialog.hasAttribute('data-closing') || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return Promise.resolve();
  }
  dialog.setAttribute('data-closing', '');
  return new Promise((resolve) => {
    let timer = 0;
    const done = () => { clearTimeout(timer); dialog.removeEventListener('animationend', onEnd); resolve() };
    // 浮窗en laControles也会冒泡出 animationend, Solo认目标就es舞本身eseuno. 
    const onEnd = (event: Event) => { if (event.target === dialog) done() };
    dialog.addEventListener('animationend', onEnd);
    timer = window.setTimeout(done, 380);
  });
}

function dispose({ miniplayer = true }: { miniplayer?: boolean } = {}): void {
  generation++;
  controller?.abort();
  controller = null;
  /* 离开Detalles时En curso放视频No销毁: CompletoReproducirDispositivo搬进pequeño窗continuar着放. 要En卸掉媒体框之anterior搬.  */
  player.handOffStage(miniplayer);
  if (!view) return;
  const dialog = stageDialog();
  // 舞拆掉之anterior收起挂En舞en laPasar el ratónVista previa("Continuar viendo"eseuno排卡). 
  if (dialog) releaseHoverPreviews(dialog);
  // derechaClave菜单开着时挪进舞: 先放回 body, 别跟着浮窗uno起被卸掉. 
  closePlayerMenu();
  if (dialog?.open) dialog.close();
  view = null;
  closeRequested = false;
  dismissArmed = false;
  paint();
  player.setStageMeta(null);
  document.body.removeAttribute('data-detail-open');
}

function update(patch: StagePatch): void {
  if (!view) return;
  view = { ...view, content: view.content.kind === 'item'
    ? { kind: 'item', props: { ...view.content.props, ...patch } }
    : view.content.kind === 'jav' ? view.content
    : { kind: 'follow', props: { ...view.content.props,
      ...(patch.relatedLimit === undefined ? {} : { relatedLimit: patch.relatedLimit }) } } };
  paint();
}

function repaintPoster(): void {
  const meta = player.stageMeta();
  const item = meta?.kind === 'item' ? meta.item : null;
  const poster = item ? detailPosterUrl(item, stageHost().player.settings().javImage) : '';
  if (!poster) return;
  const current = player.stagePlayer();
  if (current) current.poster(poster);
  else document.getElementById('vid')?.setAttribute('poster', poster);
}

const api: StageApi = {
  open, update, exit, dispose, requestClose, repaintPoster,
  isOpen: () => !!view,
  showing: () => (view && swappable(view.content.kind) ? view.content.kind : null),
  activeVideo: () => player.activeStageVideo(),
  mountWallPlayer: player.mountWallPlayer,
  toggleTheater: () => { if (view) applyTheaterMode(!stageHost().player.settings().theaterMode) },
  toggleMiniplayer: () => player.toggleMiniplayer(),
  closeMiniplayer: () => player.closeMiniplayer(),
  miniplayerActive: () => player.miniplayerActive(),
  miniplayerTakesCard: (item) => player.miniplayerTakesCard(item),
  miniplayerPlay: (id) => { void player.miniplayerPlay(id) },
};

/** continuararriba壳给宿主, 拿回舞命令入口. 先continuarReproducirDispositivo; pequeño窗节点En路由树Abriresteuno面时画出来, No.uno次进pequeño窗
 *  之anterior就En.  */
export function configureStage(next: StageHost): StageApi {
  host = next;
  player.configureStagePlayer(next, { isOpen: () => !!view, requestClose });
  return api;
}

/** 常驻组件 `stage` 组件: 订阅本模 store. pequeño窗节点SinCondición画着, ReproducirDispositivo搬进搬出都命令地落En它dentro面.  */
export function StageSurface() {
  const at = useSyncExternalStore(subscribe, () => view);
  return host ? <StageTree view={at} /> : null;
}
