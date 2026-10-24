/* 卡片Pasar el ratónVista previa: SoloCon本地Archivo拉真视频. 115 / PikPak etc.远端源Solo扫本地continuar触印相, 避免página面Quitarposterior
 * ContinuarDescargar或Introduce满缓存. 
 *
 * 卡片Con两: 壳拼 `.card`,  y  React Cuadrículaen la `[data-media-card]`/`[data-mix-card]`. 
 * Pasar el ratón态写En卡en la `data-previewing`/`data-longhover`: 卡类名归 React 管, 壳No往arriba加. 
 *
 * 要No要起Vista previa, 判据En壳dentro(más选, 遮挡, Pasar el ratón延时Configuración), 由 `configureHoverPreview` 以取值函数
 * 交进来: 延时En计时Dispositivodentro还要再读uno次, Configuraciónen proceso途改, Siguiente拍读到就esNuevo值, 所以No能抄uno
 * rápido照. 没Configuración时按"No拦, No延时"Procesar.  */

/** 起Vista previaanterior要问壳tres件事. 都es取值函数, 每次用时现读.  */
export interface HoverPreviewConfig {
  /** más选Modo开着: este时No起Vista previa.  */
  selecting(): boolean;
  /** 遮挡开着: este时No起Vista previa, ya经排en laeseuno段到点也No放.  */
  censored(): boolean;
  /** 停够másmenos秒进入"largoPasar el ratón"(倒计时走完, tresrápido退rápido进出现); 0 es关掉.  */
  delaySeconds(): number;
}

/** 卡片arribaese几要用到字段.  */
export interface HoverItem { id: number; location?: string; has_thumb?: boolean }

type HoverCard = HTMLElement & { _stopHover?: () => void };
type HoverVideo = HTMLVideoElement & { _hop?: ReturnType<typeof setInterval> };

const HOVER_CARDS = '.card,[data-media-card],[data-mix-card]';

let config: HoverPreviewConfig = { selecting: () => false, censored: () => false, delaySeconds: () => 0 };

export function configureHoverPreview(next: HoverPreviewConfig): void {
  config = next;
}

const scrolling = () => !!(window as Window & { __scrolling?: unknown }).__scrolling;

/** 收掉 `root` abajo所ConPasar el ratónVista previa, `except` ese卡Deja着.  */
export function releaseHoverPreviews(root: ParentNode | null = document, except: Element | null = null): void {
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll<HoverCard>(HOVER_CARDS).forEach(card => {
    if (card !== except && card._stopHover) card._stopHover();
  });
  root.querySelectorAll<HoverVideo>('video.hv').forEach(v => {
    if (v.closest(HOVER_CARDS) === except) return;
    if (v._hop) clearInterval(v._hop); v.pause(); v.removeAttribute('src'); v.load(); v.remove();
  });
  // 远端源eseuno层 y 视频同样要兜uno遍: 卡片被pesado画过话, antiguo元素en la `_stopHover`
  // ya经跟着antiguo DOM 走, Solo靠arriba面ese轮回调收No到它DejaEnImagenen la扫视Imagen. 
  root.querySelectorAll('img.ui-hvframes').forEach(im => {
    if (im.closest(HOVER_CARDS) === except) return;
    im.removeAttribute('src'); im.remove();
  });
}

/** uno卡要拆abajo来之anterior: 它自己En curso放eseuno段 y 它dentro面所ConVista previauno起收掉.  */
export function releaseHover(card: HTMLElement): void {
  (card as HoverCard)._stopHover?.();
  releaseHoverPreviews(card);
}

export function setHoverState(el: HTMLElement, name: 'previewing' | 'longhover', on: boolean): void {
  if (on) el.dataset[name] = ''; else delete el.dataset[name];
}

/** 给uno卡挂arribaPasar el ratónVista previa. Imagen格es卡en la `[data-media-pic]`, Sin就No挂.  */
export function wireHover(el: HTMLElement, it: HoverItem): void {
  const card = el as HoverCard;
  const pic = el.querySelector('[data-media-pic]'); if (!pic) return;
  el.dataset.hoverMode = it.location === 'local' ? 'video' : 'frames';
  let longTimer: ReturnType<typeof setTimeout> | undefined;
  const armLong = () => {
    clearTimeout(longTimer); if (!config.delaySeconds()) return; setHoverState(el, 'previewing', true);
    longTimer = setTimeout(() => { if (config.delaySeconds()) setHoverState(el, 'longhover', true); }, config.delaySeconds() * 1000);
  };
  const clearLong = () => { clearTimeout(longTimer); setHoverState(el, 'previewing', false); setHoverState(el, 'longhover', false); };
  if (it.location !== 'local') {        // 远端源: SoloEncontinuar触印相格子间扫视, cero网络流量
    /* 扫视Imagenes叠EnImagen之arribaNuevouno层, No改任何yaCon `<img>`  src. JAV grandeImagen y pequeñoImagen
       版dentroImagen就esPortada本身(`.poster.cover`), 改它 src etc.于Portada当场换掉; 
       按类名Portada排掉又etc.于este两版CompletoSinPasar el ratónVista previa, 连 `data-longhover` 都No进, 
       rápido退rápido进esetres也跟着永远No出现. 叠uno层对tres版es同uno路. 
       esteuno层用 contain 加黑底: grandeImagen版容Dispositivoes 0.75 竖Relación, 16:9 continuar触印相格子
       Endentro面居en proceso, arribaabajoDeja黑,  y 本地视频 `.hv` 同uno口径.  */
    if (!it.has_thumb) return;        // Sincontinuar触印相就Sinpuede扫格子
    let t: ReturnType<typeof setInterval> | undefined, i = 4, layer: HTMLImageElement | null = null, loading = false;
    el.addEventListener('mouseenter', () => {
      if (config.selecting() || config.censored()) return; armLong();
      if (!layer) {
        layer = document.createElement('img');
        layer.className = 'ui-hvframes'; layer.alt = '';
        layer.src = `/poster?id=${it.id}&c=${i}`;
        pic.appendChild(layer);
      }
      clearInterval(t);
      t = setInterval(() => {
        if (!layer || loading) return;
        const next = (i + 1) % 9, pre = new Image(); loading = true;
        pre.onload = () => { if (layer) { layer.src = pre.src; i = next; } loading = false; };
        pre.onerror = () => { loading = false; };
        pre.src = `/poster?id=${it.id}&c=${next}`;
      }, 430);
    });
    const stop = () => {
      clearLong(); clearInterval(t); t = undefined;
      if (layer) { layer.remove(); layer = null; } i = 4;
    };
    card._stopHover = stop; el.addEventListener('mouseleave', stop);
    return;
  }
  let timer: ReturnType<typeof setTimeout> | undefined, v: HoverVideo | null = null;
  el.addEventListener('mouseenter', () => {
    if (config.selecting() || config.censored() || scrolling()) return;   // más选, 遮挡或滚动en procesoNo启动Vista previa
    timer = setTimeout(() => {
      if (scrolling() || config.censored()) return;
      releaseHoverPreviews(document, el);   // 同unoTiempoSolo保Dejauno本地视频Vista previa
      const video = document.createElement('video') as HoverVideo;
      v = video;
      video.className = 'hv'; video.muted = true; video.playsInline = true; video.loop = true; video.preload = 'metadata';
      video.src = '/stream?id=' + it.id;
      // 分段跳跃: 每段放 1.4 秒就跳到Siguiente段, 扫完Todo片, 而Noes从uno点连续播
      const SEG = [0.08, 0.22, 0.36, 0.50, 0.64, 0.78, 0.90]; let si = 0;
      const seek = () => { try { video.currentTime = (video.duration || 0) * (SEG[si] ?? 0); } catch { /* Metadatos还没到 */ } };
      video.addEventListener('loadedmetadata', () => {
        seek(); video.classList.add('on'); video.dataset.playing = ''; armLong();
        video._hop = setInterval(() => { si = (si + 1) % SEG.length; seek(); }, 1400);
      }, { once: true });
      pic.appendChild(video); video.play().catch(() => {});
    }, 340);                         // 340ms 防抖, 鼠标划过No触发
  });
  const stop = () => {
    clearLong();
    clearTimeout(timer); timer = undefined;
    if (v) { if (v._hop) clearInterval(v._hop); v.pause(); v.removeAttribute('src'); v.load(); v.remove(); v = null; }
  };
  card._stopHover = stop; el.addEventListener('mouseleave', stop);
}
