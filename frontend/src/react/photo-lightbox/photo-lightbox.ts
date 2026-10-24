/* Imagen片灯箱(ADR-0031 No. 10f 步): Datos形状, Swiper 按需CargaryZoom换算. 
 *
 * 灯箱服务资料página照片Muro(本地Imagen片yCódigo JAV样) y 关注páginaEn线Imagen集. 每调用方自己
 * 形状换成 `LightboxSlide` 再交进来; tres边共用Información面板, 动作No同: 本地Imagenpuede按 asset id
 * 定源Archivo, 样 y En线ImagenSolo展示来源, 序号, 尺寸 y puede取得Tamaño.  */
import { fmtSize, LOC } from '@peach/legacy/core';

/** 本地Imagen片EnDatosBibliotecaen laese几样. 定Solo `id` 交给服务端, Ruta绝No进Explorar dispositivo.  */
export interface LightboxAsset {
  id: number;
  name?: string;
  location?: string;
  size?: number;
  [field: string]: unknown;
}

/** 灯箱en launo. `src` esgrandeImagen, `thumb` es缩略Imageneseuno格, grandeImagen取No到时也退到它.  */
export interface LightboxSlide {
  src: string;
  thumb: string;
  name?: string;
  /** 本地Imagen片才Con; Con它才出"En资源GestionarDispositivoen proceso显示".  */
  asset?: LightboxAsset | null;
  /** Sin asset 时Información面板No.uno段: 站名或"Oficial样", 缺省es"En线Imagen片".  */
  source?: string;
  size?: number;
}

/** 灯箱要回壳办事. 定Éxito由壳发回执, Fallo回uno句Original因, 写En按钮abajo面.  */
export interface LightboxHost {
  revealSource(id: number): Promise<string>;
}

/* ── Swiper ──
 * grandeImagen轮播, 底部缩略Imagen y Clave盘izquierdaderechaClave都es Swiper 自带模, 没必要自己写uno遍; pero它SoloCon
 * ver照片时才用得arriba, No该进primero屏. Solo用它核心 API, No用它 React 封装: eseuno层自带uno套
 * 渲染,  y aquí"DOM 由 React 画, Swiper Solocontinuar管移yEstado类"分工对Noarriba.  */

/** 用到eseuno截 Swiper 实例Interfaz.  */
export interface SwiperInstance {
  activeIndex: number;
  destroyed: boolean;
  slides: HTMLElement[];
  zoom: { in(ratio?: number): void; out(): void };
  on(event: string, handler: (swiper: SwiperInstance, ...args: number[]) => void): void;
  slideTo(index: number, speed?: number): void;
  update(): void;
  destroy(deleteInstance?: boolean, cleanStyles?: boolean): void;
}
export type SwiperConstructor = new (el: HTMLElement, options: Record<string, unknown>) => SwiperInstance;

const SWIPER = '/vendor/swiper/14.3.0/';
let loader: Promise<SwiperConstructor> | null = null;

/** 样y脚本uno起etc.: 样晚到uno拍, 所Con slide 会先当普通元素同时画出来.  */
export const loadSwiper = (): Promise<SwiperConstructor> => loader ??= Promise.all([
  new Promise<void>((resolve, reject) => {
    const href = `${SWIPER}swiper-bundle.min.css`;
    const existing = document.querySelector<HTMLLinkElement>(`link[href="${href}"]`);
    if (existing?.sheet) { resolve(); return }
    const style = existing ?? document.createElement('link');
    style.rel = 'stylesheet';
    style.href = href;
    style.addEventListener('load', () => resolve(), { once: true });
    style.addEventListener('error', () => reject(new Error('swiper styles unavailable')), { once: true });
    if (!existing) document.head.append(style);
  }),
  new Promise<SwiperConstructor>((resolve, reject) => {
    const loaded = (window as { Swiper?: SwiperConstructor }).Swiper;
    if (loaded) { resolve(loaded); return }
    const script = document.createElement('script');
    script.src = `${SWIPER}swiper-bundle.min.js`;
    script.onload = () => resolve((window as { Swiper?: SwiperConstructor }).Swiper!);
    script.onerror = () => reject(new Error('swiper unavailable'));
    document.head.append(script);
  }),
]).then(([, Swiper]) => Swiper).catch((error: unknown) => { loader = null; throw error });

/* ── Zoom ──
 * 显示相对OriginalImagen像素cien分比, 而Noes相对"适应窗口"变换倍数. 因此grandeImagen初始puede能es 34%, 
 * Tamaño original才es 100%; Swiper 14  zoom.in(number) 能直continuarRecibir目标倍数, 既puedebajo于 1 也puedealto于 1.  */
export const PHOTO_ZOOM_MIN = 10;
export const PHOTO_ZOOM_MAX = 400;
export const PHOTO_ZOOM_STEP = 10;

export interface PhotoZoom {
  /** `'fit'` es适应窗口; 数字es目标cien分比, carpetaEnarribaabajo限之间.  */
  apply(raw: number | 'fit'): void;
  /** 灯箱量过uno次尺寸: 按Anterior次目标pesado算.  */
  resize(): void;
  /** unograndeImagen到: es当anterioreste就按目标pesado算, 适应窗口cien分比要etc.它自然尺寸.  */
  loaded(img: HTMLImageElement): void;
}

/** `box` es灯箱本身, 它NoEnDocumentacióndentro(ya经关掉)就什么都No做; `show` cien分比交给读数y滑杆.  */
export function photoZoom(box: Element, main: SwiperInstance, show: (percent: number) => void): PhotoZoom {
  let target: number | 'fit' = 'fit';
  const image = () => main.slides?.[main.activeIndex]?.querySelector('img');
  const fitPercent = () => {
    const img = image();
    if (!img?.naturalWidth || !img.naturalHeight) return 100;
    return Math.min(100, img.offsetWidth / img.naturalWidth * 100, img.offsetHeight / img.naturalHeight * 100);
  };
  const apply = (raw: number | 'fit') => {
    if (main.destroyed || !box.isConnected) return;
    const fit = fitPercent();
    const percent = raw === 'fit' ? fit : Math.min(PHOTO_ZOOM_MAX, Math.max(PHOTO_ZOOM_MIN, Number(raw) || fit));
    target = raw === 'fit' ? 'fit' : percent;
    show(Math.round(percent));
    const ratio = percent / fit;
    if (Math.abs(ratio - 1) < .001) main.zoom.out();
    else main.zoom.in(ratio);
  };
  const reset = () => requestAnimationFrame(() => apply('fit'));
  main.on('slideChange', reset);
  main.on('zoomChange', (_swiper, scale) => { if (scale) show(Math.round(fitPercent() * scale)) });
  reset();
  return {
    apply,
    resize: () => apply(target),
    loaded: (img) => { if (img === image()) apply(target) },
  };
}

/* ── Información面板 ── */

/** unomil字节以abajo也写 1 KB; 数 y 单之间esNo换行空格, estrecho面板dentroNo拆成两行.  */
export const fmtPhotoSize = (raw: unknown): string => {
  const size = Number(raw) || 0;
  if (!size) return 'Tamaño desconocido';
  return (size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : fmtSize(size)).replace(' ', ' ');
};

export const photoTitle = (slide: LightboxSlide): string => (slide.asset?.name || slide.name) || 'No命名Imágenes';

/** 面板No.dos行. 本地Imagenes来源yTamaño; 别es来源, 分辨率(grandeImagen到才Con) y Tamaño. No.几SoloCon底栏eseuno编号.  */
export function photoMeta(slide: LightboxSlide, natural: readonly [number, number] | undefined): string {
  const asset = slide.asset;
  if (asset) return [LOC[asset.location ?? ''] || asset.location || 'FuenteDesconocido', fmtPhotoSize(asset.size)].join(' · ');
  const resolution = natural?.[0] && natural[1] ? `${natural[0]} × ${natural[1]}` : '';
  return [slide.source || 'Imagen en línea', resolution, slide.size ? fmtPhotoSize(slide.size) : '']
    .filter(Boolean).join(' · ');
}
