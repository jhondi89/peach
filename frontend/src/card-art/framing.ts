/* Imagen片Llegar之posterior取景: Avatar按人脸放grande, Portada按人脸y正封框取景, 过pequeñoImagenOriginal尺寸摆, Cargaren proceso
 * 框铺微光. 
 *
 * este些Imagen都es模板字符串拼出来(`./markup.ts`), 没法逐挂监听, 所以由 `installCardArt`
 * En document arriba挂uno组捕obtener监听 y uno MutationObserver Unificadocontinuar管. 监听Solo能Conuno: este模
 * 由 Application y React página面共享源码, 启动时SoloInstalaruno次.  */
import { SKELETON_REVEAL_DELAY } from '@peach/legacy/ui';

import { PANEL_ASPECT, WIDE_PANEL_ASPECT, WIDE_SLEEVE_RATIO_MIN, WIDE_SLEEVE_RATIO_MAX, panelFrame, relayoutJavImages, type JavLayout } from '../jav-artwork';
import { faceFrame } from './face-frame';
import { faceSourceScale, markClamp, nativeImageFit } from './native-image';

const devicePixels = () => window.devicePixelRatio || 1;

/* 圆框dentroeseImagen按人脸取景. 放grande靠改 img 自己尺寸 y 偏移, No用 transform: 
   `object-position` Solo能En cover 裁掉ese部分dentro挪, 方Imagen根本没得挪, 而 transform
   Zoom会连圆框描边uno起放grande. 元素撑到"Imagen按 cover Zoom再乘倍数"ese么grande, 再用负偏移
   脸心拉到框心, 圆框 `overflow:hidden` 负责裁— y No放grande时es同uno套几何.  */
export function avatarFrame(img: HTMLImageElement): void {
  const ring = img.parentElement;
  if (!ring) return;
  ['position', 'right', 'bottom', 'left', 'top', 'width', 'height', 'max-width', 'max-height']
    .forEach(name => img.style.removeProperty(name));
  // 取景完才露面(`09-skeleton.css`): 本函数Sincronizar写完样, 先标arriba; SoloConetc.框Diseñoese路撤掉. 
  img.dataset.faceFramed = '';
  if (ring.dataset.nativeSmall === 'true') return;
  const rect = ring.getBoundingClientRect();
  /* ImagenCargar完时框还没Diseño, es真会发生unoCompleto类情况: 面板隐藏, `display:none` página签, 
     缓存直出. eseuno刻框es 0×0, 算出来倍数Solo能es 1, 而 `load` No会再来No.dos次—
     放grande于es静predetermina地永No生效, página面arribaverNo出 y "esteImagenNo需要放grande"Con任何区别. 
     实测En资料página复现过: 框ya经 160×160, Imagen也 complete, style dentro却SoloCon平移. 
     etc.到框拿到尺寸再算uno次, etc.No到就维持No放grande.  */
  if (!(rect.width > 0 && rect.height > 0)) {
    if (typeof ResizeObserver !== 'function') return;
    // 框es 0×0 时本来也verNo见; etc.它量到尺寸, 取完景再露面. 
    delete img.dataset.faceFramed;
    const watch = new ResizeObserver(() => {
      const now = ring.getBoundingClientRect();
      if (!(now.width > 0 && now.height > 0)) return;
      watch.disconnect();
      avatarFrame(img);
    });
    watch.observe(ring);
    return;
  }
  const [cx = NaN, cy = NaN, faceW = NaN, imgW = NaN, imgH = NaN] = String(img.dataset.facebox).split(' ').map(Number);
  /* 索引página取es实体Imagen派生件, 边车记esOriginal件像素: etc.比缩过仍es同unoImagen, 按Relación
     换算就对得arriba. 脸心es归uno化, No跟着缩; 脸框 y Imagen像素uno起乘, `faceZoom` dentroese
     Sin损arriba限才问得到手arribaeste真Conmásmenos像素. RelaciónComo 0 es换成别Imagen, ese时退回几何居en proceso.  */
  const scale = faceSourceScale(img.naturalWidth, img.naturalHeight, imgW, imgH);
  if (!scale) {
    img.style.objectPosition = '50% 50%';
    return;
  }
  const frame = faceFrame({ cx, cy, faceW: faceW * scale, imgW: imgW * scale, imgH: imgH * scale },
    { w: rect.width, h: rect.height }, devicePixels());
  // 放Nogrande就uno字都No写: Dejaabajoes CSS dentroese几何, `object-position` 照antiguo生效. 
  if (!frame) return;
  const s = img.style;
  // `inset:0` 定 right/bottom,  y esteen la left+width 过约束; 显撤掉, No靠Explorar dispositivo取舍. 
  s.position = 'absolute'; s.right = 'auto'; s.bottom = 'auto';
  s.left = `${frame.left}%`; s.top = `${frame.top}%`;
  s.width = `${frame.width}%`; s.height = `${frame.height}%`;
  /* ancho常常超过框ancho. React 岛 Tailwind 预检给每 img `max-width:100%`, 会anchocarpeta回框ancho, 
     alto照样放grande, 脸偏到izquierda边, derecha侧露出底色; interior联撤掉, Imagen落En哪容Dispositivodentro都No用再各补uno.  */
  s.maxWidth = 'none'; s.maxHeight = 'none';
}

/* OficialPortadaContres形态, 实测过: Completo封套约 1.48(izquierda侧es剧照拼贴, derecha侧才es正封), 
   竖版正封约 0.70(本身就es正封, Sinizquierdamedio边puede裁), 16:9 Oficial剧照约 1.78(Completo幅
   都esImagen, Sin"正封eseuno"puede推). 所以取景No能写死"取derecha边", 得etc.Imagen片Cargarposterior
   按它自己anchoalto比分流—服务端没存esteRelación, 也No该Como此再存uno. 
   剧照必须自成uno档:  1.78 归进 front 就会按写死 50% 取横向en proceso段, 人偏Enuno侧
   就Completo被切掉, 而grandeImagen容Dispositivo比所ConPortada都竖, 纵向锚点Enesedentro根本No生效.  */
export function coverAnchor(img: HTMLImageElement): void {
  img.closest<HTMLElement>('.pic,[data-media-pic]')?.style.removeProperty('--cover-blur');
  const r = img.naturalWidth / img.naturalHeight;
  if (!r) return;
  img.classList.remove('panel');
  ['--panel-aspect', '--panel-clip', '--panel-left', '--panel-top', '--panel-height', '--cover-x', '--cover-y']
    .forEach(name => img.style.removeProperty(name));
  const code = img.dataset.coverCode || new URL(img.currentSrc || img.src, location.href).searchParams.get('code') || '';
  // FC2 PortadaesCompleto幅Imagen, 横向取景跟随人脸; anchoalto比No代表Con DVD 正封. 
  img.dataset.frame = img.dataset.coverLayout === 'still' || /^FC2(?:-PPV)?-/i.test(code) ? 'still' : wideSleeve(img) ? 'sleeve' : r >= 1.65 ? 'still' : r > 1.2 ? 'sleeve' : 'front';
  /* `object-position` cien分比说es"Imagen片arribaeste点对齐puede见窗口同unocien分比Ubicación", 
     Noes"este点落到窗口正en proceso". 所以人脸en proceso心Original样当锚点Solo能保证脸还EnImagendentro: 0.81
     ese偏derecha脸会贴着窗口derecha缘, Imagen片derecha边还剩uno截永远露No出来. puede见窗口占Imagen片 w 时, 
     让人脸落到正en proceso锚点es (face - w/2) / (1 - w). carpeta回 0–1 es因Como脸离Imagen片边缘No足
     medio窗口时窗口ya经顶到边, 再往exterior推Solo会Imagen片exterior面推进来.  */
  const car = coverRatio(img);
  const center = (name: string, face: number | null, visible: number) => {
    // Solo给被裁ese轴算. `object-fit:cover` uno次Solo裁uno轴, 另uno轴Completo幅puede见
    // (visible>=1), eseen la object-position es死值, 算也No生效. 
    if (face == null || !(visible > 0 && visible < 1)) return;
    const pct = Math.min(1, Math.max(0, (face - visible / 2) / (1 - visible)));
    img.style.setProperty(name, `${Math.round(pct * 100)}%`);
  };
  center('--cover-x', coverFace(img, 'cx'), car / r);
  center('--cover-y', coverFace(img, 'cy'), r / car);
  posterPanel(img, car);
  // 传统PortadaCompletoImageny竖版正封保持完Completo, RelaciónNo同处用同Imagen补底; Completo幅grande封保持纯fondo de color. 
  if (img.dataset.frame !== 'still' && (img.classList.contains('whole') || img.dataset.frame === 'front')
    && Math.abs(r / car - 1) > .02) coverBackdrop(img);
}

/* Solo折痕derecha边ese正封摆进卡片, 封底uno像素都No露. 折痕UbicaciónEn `data-posterbox` dentro, 
   换算要容DispositivoRelaciónSoloConpágina面知道, 两边Enaquí才凑齐.  */
export function posterPanel(img: HTMLImageElement, ratio: number): void {
  if (img.dataset.frame === 'front' || img.dataset.coverLayout === 'still') return;
  let [x0 = NaN, imgW = NaN, imgH = NaN, y0 = NaN, x1 = NaN, y1 = NaN] = String(img.dataset.posterbox || '').split(' ').map(Number);
  /* Sin框双página封套按先验从derecha缘量回去, y服务端折痕找No到时Relación框uno致.  */
  if (!img.dataset.posterbox && img.dataset.frame === 'sleeve') {
    imgW = img.naturalWidth; imgH = img.naturalHeight;
    x0 = Math.round(imgW - (wideSleeve(img) ? WIDE_PANEL_ASPECT : PANEL_ASPECT) * imgH); y0 = 0; x1 = imgW; y1 = imgH;
  }
  /* 框es按eseuno版源Imagen像素算, 而Portada会被更grandeeseOriginal子Reemplazar. 尺寸对Noarriba就Descripción
     框Descripciónes另unoImagen, 落Enestearribaesuno错区域—而错Enpágina面arriba y "本来就该
     este么取景"verNo出区别, 所以宁puede退回回退值.  */
  // 卡片先取esetc.比缩pequeño派生档, 框cien分比Enetc.比ZoomabajoNo变, 所以认缩pequeño, No认别Imagen. 
  if (!faceSourceScale(img.naturalWidth, img.naturalHeight, imgW, imgH)) return;
  const panelAspect = (x1 - x0) / (y1 - y0);
  const sourceAspect = imgW / imgH;
  const widePanel = sourceAspect >= WIDE_SLEEVE_RATIO_MIN && sourceAspect < WIDE_SLEEVE_RATIO_MAX
    && Math.abs(panelAspect - WIDE_PANEL_ASPECT) <= .02;
  const frame = panelFrame({ x0, y0, x1, y1, px: [imgW, imgH] }, ratio, wideSleeve(img) || widePanel);
  if (!frame) return;
  img.style.setProperty('--panel-aspect', `${img.naturalWidth} / ${img.naturalHeight}`);
  img.classList.add('panel');
  img.style.setProperty('--panel-clip',
    `${frame.clip.top}% ${frame.clip.right}% ${frame.clip.bottom}% ${frame.clip.left}%`);
  img.style.setProperty('--panel-left', `${frame.left}%`);
  img.style.setProperty('--panel-top', `${frame.top}%`);
  img.style.setProperty('--panel-height', `${frame.height}%`);
  if (img.dataset.frame !== 'still' && img.classList.contains('front')
    && Math.abs(panelAspect / ratio - 1) > .02) coverBackdrop(img);
}

/** 传统正封Deja白使用同ImagenDifuso补底, 优先复用yaCargar派生档.  */
function coverBackdrop(img: HTMLImageElement): void {
  const src = (img.dataset.thumbSrc || img.currentSrc || img.src).replace(/"/g, '%22');
  img.closest<HTMLElement>('.pic,[data-media-pic]')?.style.setProperty('--cover-blur', `url("${src}")`);
}

function wideSleeve(img: HTMLImageElement): boolean {
  const code = img.dataset.coverCode || new URL(img.currentSrc || img.src, location.href).searchParams.get('code') || '';
  const ratio = img.naturalWidth / img.naturalHeight;
  return !/^FC2(?:-PPV)?-/i.test(code)
    && (img.dataset.wideSleeve === '1' || /^(CWPBD|SMBD)-/i.test(code))
    && ratio >= WIDE_SLEEVE_RATIO_MIN && ratio < WIDE_SLEEVE_RATIO_MAX;
}

/* 卡片先取Portada派生档(`/cover?thumb=1`): alto清Original件uno解码 38 MB, unopágina几diez挤爆
   解码缓存, 来Revertir动时滚走被清掉, 滚回来现解, eseuno段es空白. 取景落定之posterior量esteImagenEn
   屏幕arriba铺开másgrande: uno源像素要占No止uno设备像素, 就es派生档No够清楚, 换回Original件. 
   单列, grandeImageneste些真用得arriba像素地方照antiguoesOriginal件, más列时屏幕本来就放Noabajoese么más像素.  */
export function upgradeCover(img: HTMLImageElement): void {
  if (!/[?&]thumb=1(&|$)/.test(img.src) || !img.naturalWidth) return;
  const { width, height } = img.getBoundingClientRect();
  const pick = getComputedStyle(img).objectFit === 'contain' ? Math.min : Math.max;
  const scale = pick(width / img.naturalWidth, height / img.naturalHeight) * devicePixels();
  if (!(scale > 1.01)) return;
  img.dataset.thumbSrc = img.src;
  img.src = img.src.replace(/[?&]thumb=1(?=&|$)/, '');
}

/* 容DispositivoRelaciónSoloCon `.pic`  `--card-ratio` 知道: 竖屏开关, JAV grandeImagen y 普通卡片各写uno
   值, Enaquí按 layout pesado算迟早会 y 它分叉. 自定义属性会继承, 直continuar从Imagen片arriba读; 
   `aspect-ratio` 允许 `16/9` este写法, 所以两形都得认.  */
export function coverRatio(img: HTMLImageElement): number {
  const parts = getComputedStyle(img).getPropertyValue('--card-ratio').trim().split('/').map(Number);
  const r = parts.length === 2 ? Number(parts[0]) / Number(parts[1]) : Number(parts[0]);
  return Number.isFinite(r) && r > 0 ? r : 16 / 9;
}

export function coverFace(img: HTMLImageElement, axis: 'cx' | 'cy'): number | null {
  const face = parseFloat(img.dataset[axis] ?? '');
  return Number.isFinite(face) ? face : null;
}

/* PortadayAvatarCargar态,  y 换Avatareseuno格同uno形态: Imagen还En路arriba时框arriba铺uno层微光, 到手posterior
   微光淡出y糊掉(`09-skeleton.css`  `.imgwait`). Imagenes模板字符串拼进来, 逐挂
   监听做No到, 所以En插进página面时veruno眼: ya经 `complete` (缓存dentro直continuar解码ese)
   什么都No标, página面每次pesado绘都No会闪unoabajo微光. 标arriba之posterior `load` uno定会来—Imagenya经挂En
   Documentaciónarriba, 捕obtener阶段监听收得到; 取No到Imagen `error` 同样收尾, No让微光盖住primero字母. 
   收尾posterior类名unoy摘掉: 没到门槛就到手直continuar摘, 淡出过etc.淡出完再摘, Portadaarriba平时NoDeja
   ese层 `::after`. React 索引páginaAvatar框(`[data-person-ring]`)y资料卡grande, 同艺人
   (`[data-entity-portrait]`, `[data-hero-ring]`)dentroeseImagen同样由esteuno层拼, 插进página面时照样
   被aquíver见.  */
const PENDING_IMAGES = '.pic>img.poster,[data-media-art]>img,.ring>img,[data-tier-ring]>img,[data-person-ring]>img,[data-entity-portrait]>img,[data-hero-ring]>img';
const pendingSince = new WeakMap<Element, number>();

/** 插进página面时还没到手Imagen, En框arriba标 `imgwait`.  */
export function watchPendingImages(node: Element): void {
  const found = node.matches(PENDING_IMAGES) ? [node] : node.querySelectorAll(PENDING_IMAGES);
  for (const img of found) {
    if (!(img as HTMLImageElement).complete && img.parentElement) {
      img.parentElement.classList.add('imgwait'); pendingSince.set(img.parentElement, performance.now());
    }
  }
}

/** Imagen到手或取No到: 收掉框arribaese层微光. etc.得No够久直continuar摘, 否则淡出完再摘.  */
export function settleImage(img: HTMLImageElement): void {
  const box = img.parentElement;
  if (!box?.classList.contains('imgwait')) return;
  if (performance.now() - (pendingSince.get(box) ?? NaN) < SKELETON_REVEAL_DELAY) { box.classList.remove('imgwait'); return; }
  box.classList.replace('imgwait', 'ui-imgdone');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const drop = (event?: Event) => {
    if (event && (event.target !== box || (event as TransitionEvent).pseudoElement !== '::after')) return;
    box.removeEventListener('transitionend', drop); clearTimeout(timer); box.classList.remove('ui-imgdone');
  };
  box.addEventListener('transitionend', drop);
  // 兜底: 面板藏Enposterior或动效归cero时 `transitionend` No会来. 
  timer = setTimeout(drop, 1000);
}

/* 缓存Imagen插进página面No.uno帧就画出来, `load` 却排EnSiguienteTareadentro: NoEnaquí先取景, eseuno帧
   要么藏着(`09-skeleton.css`), 要么es几何居en proceso. 观察回调es微Tarea, 赶En绘制之anterior. 
   No限于 `PENDING_IMAGES` ese几框: 带脸框Avatar散En各página, 哪en la都uno样要先取景.  */
export function frameCachedImages(node: Element): void {
  const framed = 'img.cover,img[data-facebox]';
  const found = node.matches(framed) ? [node] : node.querySelectorAll(framed);
  for (const el of found) {
    const img = el as HTMLImageElement;
    if (!(img.complete && img.naturalWidth)) continue;
    if (img.classList.contains('cover')) coverAnchor(img);
    else { fitNativeImage(img); avatarFrame(img); }
  }
}

/* Imagen比框还pequeño时No再拉伸: Original尺寸居en proceso摆, 空出来uno圈拿同unoImagen放grandeDifuso补底. 

   Sello标识实测从 42 px 到 1378 px 都Con. `/logo?variant=large` ya经先挑过esteSello
   最清晰uno, 剩abajoes本来就SingrandeImagenSello— 112 px ese拉满 180 px 格子
   Soloes糊放grande给人ver, 而摆EnOriginal尺寸arriba, 它至menoses清楚. 

   度量Solo能En `load` 之posterior做: Imagen没Cargar完时 `naturalWidth` 读到es 0. 换过回落Imagenposterior
   `load` 会再来uno次, aquí读 `currentSrc` 也就跟着es当anterior真正显示ese. 
   允许适度放grande; 明显过pequeñoImagen片才按源尺寸补底.  */
export function fitNativeImage(img: HTMLImageElement): void {
  const box = img.closest<HTMLElement>('[data-fit-native]');
  if (!box || !img.naturalWidth) return;
  /* 超扁, 超alto标识另走uno: corto边撑到abajo限, largo边两头裁掉(`[data-native-clamp]` 换成 cover), 
     No补底—eseuno圈Difuso放grandeesuno道线, Solo会糊成unogrande.  */
  const clamp = box.dataset.fitNative === 'mark'
    ? markClamp(img.naturalWidth, img.naturalHeight, box.clientWidth, box.clientHeight) : null;
  box.dataset.nativeClamp = String(!!clamp);
  if (clamp) {
    box.dataset.nativeSmall = 'false';
    box.style.setProperty('--markw', clamp.width + 'px');
    box.style.setProperty('--markh', clamp.height + 'px');
    box.style.setProperty('--markbg', 'none');
    return;
  }
  // 版Cambiar会改变框Tamaño, 每次按屏幕像素密度pesadoNuevo判断. 
  const { small, width, height } = nativeImageFit(img.naturalWidth, img.naturalHeight, box.clientWidth, box.clientHeight, devicePixels());
  box.dataset.nativeSmall = String(small);
  box.style.setProperty('--markw', small ? width + 'px' : '100%');
  box.style.setProperty('--markh', small ? height + 'px' : '100%');
  const src = (img.currentSrc || img.src).replace(/"/g, '%22');
  box.style.setProperty('--markbg', small ? `url("${src}")` : 'none');
}

/** ya经Cargar完ImagenNo会再发 `load`, 容Dispositivo换尺寸就得自己pesado量uno遍.  */
export function refitNativeImages(root?: ParentNode | null): void {
  (root || document).querySelectorAll<HTMLImageElement>('[data-fit-native] img').forEach(img => {
    fitNativeImage(img);
    if (img.dataset.facebox) avatarFrame(img);
  });
}

/** Portada格换版: 格en laCódigo JAVPortadaOriginal地换取景类名, ya经到手按Nuevo卡片RelaciónpesadoNuevo取景, 派生档
 *  No够清楚换回Original件.  */
export function relayoutCovers(root: ParentNode, layout: JavLayout): void {
  for (const img of relayoutJavImages(root, layout)) { coverAnchor(img); upgradeCover(img); }
}

let installed = false;

/** 取景y微光ese组Todo站监听. 壳启动时调uno次; Repetir调用No会再挂No.dos.  */
export function installCardArt(): void {
  if (installed) return;
  installed = true;
  /* Portadaes模板字符串拼出来, 没法逐挂监听; interior联 `onload` 属性Solo能调Todo局函数, 而
     模en la取景函数Enesedentro取No到—página面会每Imagen报uno次 ReferenceError, PortadaTodo按回落
     取景. `load` No冒泡, pero捕obtener阶段照样收得到.  */
  document.addEventListener('load', event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    settleImage(img);
    fitNativeImage(img);
    if (img.classList.contains('cover')) { coverAnchor(img); upgradeCover(img); }
    // Avatar走同uno路, 理由也同uno: 倍数要etc.Imagen y 框都Llegar才算得出来. 
    else if (img.dataset.facebox) avatarFrame(img);
  }, true);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes)
      if (node.nodeType === Node.ELEMENT_NODE) { watchPendingImages(node as Element); frameCachedImages(node as Element); }
  }).observe(document.body, { childList: true, subtree: true });
  // 挂En document arriba, 比 body arribaese兜底链先收到: Imagen被摘掉之anterior框还找得到. 兜底链dentro还Con
  // Siguiente时微光Deja着, 换en laese到手才收. 
  document.addEventListener('error', event => {
    const img = event.target;
    if (img instanceof HTMLImageElement && !img.dataset.fallbacks) settleImage(img);
  }, true);
}
