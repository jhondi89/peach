/* 卡片版y照片Muro尺寸: 存es哪uno档, 读回来按哪uno档算, 写进去之posterior落盘. 
 *
 * primeropáginay JAV 各存uno卡片版(`homeLayout` / `javLayout`). "现EnEnprimeropágina还esEn JAV"es路由yDirectorioEstado
 * 判据, 归壳(`application/layout.js`  `javActive` / `homeLayoutActive`), aquíSolo收它算bien布尔值.  */
import { normalizeJavLayout, type JavLayout } from '../jav-artwork';
import type { SettingsStore } from '../settings-store';
import { allowedSetting, appSettingsStore, type AppSettings } from './settings';

/** `[值, 显示名, 字形]`: 版开关EnConfiguración面板yFiltrarabajo排各Conuno组, 读都esesteuno表.  */
export const JAV_LAYOUTS: readonly (readonly [value: string, label: string, icon: string])[] = [
  ['big', 'Imagen grande', 'maximize'], ['small', 'Imagen pequeña', 'layout-grid'],
];
/* Imagen片Muroesetc.anchoCuadrícula, 改es列数. PredeterminadopequeñoImagen—uno套Imagen几diezarribacien, 先ver得见Todo貌, 挑en proceso哪uno再点开vergrande.  */
type Choice = readonly [value: string, label: string, icon: string];
export const PHOTO_SIZES: readonly [big: Choice, small: Choice] = [
  ['big', 'Imagen grande', 'maximize'], ['small', 'Imagen pequeña', 'layout-grid'],
];
export const PHOTO_LAYOUTS: readonly (readonly [value: string, label: string, icon: string])[] = [
  ['fixed', 'Proporción fija', 'layout-grid'], ['masonry', 'Cascada', 'columns-2'],
];
/* grandeImagen卡片固定Como 3:4; 传统正封完Completo居en proceso, RelaciónDeja白使用同ImagenDifuso补底, Completo幅grande封按主体取景.  */
export const COVER_FRONT_RATIO = 0.75;

type LayoutSettings = Pick<AppSettings, 'javLayout' | 'homeLayout' | 'photoSize' | 'photoLayout' | 'javImage'>;
type LayoutStore = SettingsStore<LayoutSettings>;
const current = (): LayoutSettings => appSettingsStore().value;

export const javLayout = (settings: LayoutSettings = current()): JavLayout => normalizeJavLayout(settings.javLayout);
export const homeLayout = (settings: LayoutSettings = current()): JavLayout => normalizeJavLayout(settings.homeLayout);
/** 当anterioresteunopágina卡片版: primeropágina读primeropáginaeseuno, 其余读 JAV eseuno.  */
export const cardLayoutFor = (home: boolean, settings: LayoutSettings = current()): JavLayout =>
  home ? homeLayout(settings) : javLayout(settings);

const PHOTO_SIZE_KEYS = PHOTO_SIZES.map(([key]) => key);
const PHOTO_LAYOUT_KEYS = PHOTO_LAYOUTS.map(([key]) => key);
export const photoSize = (settings: LayoutSettings = current()): string => allowedSetting(settings.photoSize, PHOTO_SIZE_KEYS, 'small');
export const photoLayout = (settings: LayoutSettings = current()): string =>
  allowedSetting(settings.photoLayout, PHOTO_LAYOUT_KEYS, 'masonry');

/** uno屏卡片版. `active` Como假Ruta(Etiquetapágina, BuscarResultado...)卡片No分TamañoImagen.  */
export interface GridLayout { active: boolean; size: JavLayout; portrait: boolean; javImage: string }

/* SoloEn真变时候换Nuevo对象: 卡片按引用比较, 版对象每次都Nuevo话, 选uno卡也会让Completo屏每uno都pesado画uno遍.  */
let gridLayoutValue: GridLayout | null = null;
export function gridLayout(
  context: { active: boolean; home: boolean; portrait: boolean }, settings: LayoutSettings = current(),
): GridLayout {
  const next: GridLayout = {
    active: context.active, size: cardLayoutFor(context.home, settings), portrait: context.portrait, javImage: settings.javImage,
  };
  const previous = gridLayoutValue;
  if (!previous || (Object.keys(next) as (keyof GridLayout)[]).some((key) => next[key] !== previous[key])) gridLayoutValue = next;
  return gridLayoutValue!;
}

/** ObrasCuadrícula骨架y真卡共享Relación: 显竖屏Como 9:16, grandeImagenComo正封Relación, 其余Como 16:9.  */
export function cardRatio(layout: GridLayout): number {
  if (layout.portrait) return 9 / 16;
  return layout.active && layout.size === 'big' ? COVER_FRONT_RATIO : 16 / 9;
}

/* 写入都es"归uno化, 落盘"两步. 落盘之posterior要pesado画哪uno(Cuadrícula, Filtrar, 照片Muro)es壳事: 哪些岛正挂着, 
   停En哪unopágina, SoloCon壳知道.  */
export function storeHomeLayout(value: unknown, store: LayoutStore = appSettingsStore()): void {
  store.value.homeLayout = normalizeJavLayout(value); store.save();
}
export function storeJavLayout(value: unknown, store: LayoutStore = appSettingsStore()): void {
  store.value.javLayout = normalizeJavLayout(value); store.save();
}
/** Configuración面板eseuno组"视频PortadaPredeterminadoTamaño": primeropáginay JAV uno起改.  */
export function storeVideoLayout(value: unknown, store: LayoutStore = appSettingsStore()): void {
  store.value.homeLayout = store.value.javLayout = normalizeJavLayout(value); store.save();
}
export function storePhotoSize(value: unknown, store: LayoutStore = appSettingsStore()): void {
  store.value.photoSize = allowedSetting(value, PHOTO_SIZE_KEYS, 'small'); store.save();
}
export function storePhotoLayout(value: unknown, store: LayoutStore = appSettingsStore()): void {
  store.value.photoLayout = allowedSetting(value, PHOTO_LAYOUT_KEYS, 'masonry'); store.save();
}
