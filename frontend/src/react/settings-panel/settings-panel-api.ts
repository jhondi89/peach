/* Configuración面板(常驻组件 `settings-panel`, `settings-panel.tsx`)y壳之间continuar缝. 
 *
 * 界面偏bienSoloConuno: 壳En启动时归uno化bien `appSettings`, 经 `createSettingsStore` 递进来
 * (`frontend/src/settings-store.ts`). 面板读 `store.value`, Original地改字段, `store.save()` 落盘, 
 * 再用 `changed(effect)` 告诉壳esteunoabajo要跟着做什么—pesado画Cuadrícula, pesado取Directorio, 换Tema, este些都还es壳事; 
 * 侧栏顺序No经它, 侧栏自己订阅esteuno store. 跟DatosBiblioteca走ese几项(侧栏顺序, 合集开关, primero次RecolectarRango, AvatarActualizar, BuscarRegistro
 * 数)由面板经 `/api/settings` 写, Éxitoposterior同样落进esteuno对象.  */
import type { HomeGlow } from '@peach/appearance';

import type { SettingsStore } from '../../settings-store';
import type { SyncedSettings } from './settings-data';

/** 面板读写ese几项; 对象本身还Con别字段, 面板No碰.  */
export interface PanelSettings {
  theme: string;
  uiSounds: boolean;
  homeGlow: HomeGlow;
  /** 预设格选uno档时连强调色uno起换(`@peach/appearance`  `chooseGlowPreset`).  */
  accent: string;
  sidebarOrder: string[];
  batchSize: number;
  defaultSort: string;
  defaultSortDirection: string;
  groupCollapse: boolean;
  javImage: string;
  feedAutoScroll: boolean;
  feedHideGroupCompilations: boolean;
  feedHideSoloCompilations: boolean;
  feedHideExcerpts: boolean;
  hoverDelaySeconds: number;
  detailAutoplay: boolean;
  miniplayer: boolean;
  seekSeconds: number;
  relatedLimit: number;
  searchHistoryLimit: number;
  followInitialDays: number;
  avatarRefreshDays: number;
  faviconRefreshDays: number;
}

/** 改完uno项之posterior壳要跟着做事, uno项uno名字; 落盘ya经由面板做过.  */
export type SettingsEffect =
  | 'theme' | 'uiSounds'
  /** 拖光晕拉每uno步: Solo排uno帧pesado画侧栏eseuno层, No碰根.  */
  | 'glowFrame'
  /** 光晕开关, Color, RestaurarPredeterminadoy松手: 侧栏eseuno层, 其余玻璃面 y 侧栏配色钮uno起对齐.  */
  | 'glow'
  | 'batchSize' | 'defaultSort' | 'sortDirection' | 'hoverDelay' | 'seekSeconds'
  | 'groupCollapse' | 'feedAutoScroll' | 'feedCompilations' | 'miniplayer' | 'javImage'
  | 'searchHistoryLimit';

/** `[值, 显示名, 字形]`, y壳dentro各Opciones表同形.  */
export type Choice = readonly [value: string, label: string, icon?: string];

export interface SettingsPanelHost {
  selectSection?(section: string): void;
  closed?(): void;
  store: SettingsStore<PanelSettings>;
  changed(effect: SettingsEffect): void;
  sound(name: 'whoosh' | 'toggle-on'): void;
  /** 侧栏能放Todo入口, `[Clave, 名称, 字形]`; primeropáginaeseuno项Clavees空串.  */
  navCatalog: readonly Choice[];
  themeOptions: readonly Choice[];
  videoLayouts: readonly Choice[];
  followInitialRanges: readonly Choice[];
  /** 视频PortadaPredeterminadoTamaño跟着当anteriorpágina走(primeropáginay JAV 各存uno), 读写都归壳.  */
  videoLayout(): string;
  setVideoLayout(layout: string): void;
  /** SFW y增加Contraste各Con自己Clave, NoEn `appSettings` dentro; 改完壳调 `store.notify()`.  */
  censored(): boolean;
  setCensored(on: boolean): void;
  highContrast(): boolean;
  setHighContrast(on: boolean): void;
  receipt(message: string): void;
  failure(message: string, error: unknown): void;
  /** DatosBibliotecaen laesey本地缓存对账(壳en la `applySyncedSettings`), 启动时壳自己也走esteuno.  */
  syncRemote(remote: SyncedSettings): void;
  openConfiguration(): void;
  /** 面板No.uno次进 DOM: izquierda栏ese玻璃要挂arriba折射贴Imagen.  */
  attached(panel: HTMLElement): void;
  /** este设备能No能改Configuración(`/healthz`  `configurable`); 取No到时es null.  */
  configurable(): Promise<boolean | null>;
}

export interface SettingsPanelApi {
  /** Abrir面板; `section` 给分区名("exterior观y导航""ExploraryReproducir"...)时直continuar落到eseunopágina.  */
  open(section?: string): void;
  close(notify?: boolean): void;
  isOpen(): boolean;
  /** ya经Abrir时某uno滚进视野(配色弹层"详细Configuración"落到光晕Parámetro).  */
  reveal(selector: string): void;
}
