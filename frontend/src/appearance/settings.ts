/* 界面偏bienPredeterminado值, 启动归uno化y唯uno store(peach.settings.v1). 
 * Application, Configuración面板, 侧栏y配色弹层通过共享源码读写同uno对象. 
 * primero次 appSettingsStore() 从 localStorage 读取, 归uno化yCrear实例, 启动阶段Sincronizar就. 
 * 存量Solocontinuar受形状yRango合法值, 单项非法时取该项Predeterminado值.  */
import { api } from '@peach/legacy/core';

import { normalizeJavPreferences } from '../jav-artwork';
import { boundedPreference } from '../number-setting';
import { createSettingsStore, type SettingsStore } from '../settings-store';
import { DEFAULT_SIDEBAR_ORDER, normalizeSidebarOrder } from '../sidebar';
import { SORT_ALIASES, SORT_KEYS } from '../sort-preferences';
import { DEFAULT_ACCENT, DEFAULT_HOME_GLOW, normalizeAccent, normalizeHomeGlow, type HomeGlow } from './home-glow';

export const SETTINGS_KEY = 'peach.settings.v1';
/* Tematres档, Clave名y <html> en la data-theme 同uno套写法: web/css/01-base.css 色板
   ya经按 `prefers-color-scheme`  y  `[data-theme]` 两Ruta写bien, aquíSolo负责选哪uno. 
   跟随系统esPredeterminado档, 选它etc.于No写属性.  */
export const THEME_CHOICES: readonly string[] = ['system', 'light', 'dark'];
/** 关注primero次Recolectar往回取másmenos天; yDatosBibliotecaeseuno同uno表.  */
export const FOLLOW_INITIAL_DAYS: readonly number[] = [0, 7, 30, 90];
/* Nuevas obraseseuno行收No收合集由服务端按DatosBibliotecaen laConfiguración筛(Lista, no读数, 补Portada同uno), aquíSoloes
   镜像: 开关真相En `/api/settings`. Predeterminado收起grande合集y切片, 单人合集照列.  */
export const FEED_COMPILATION_KEYS = ['feedHideGroupCompilations', 'feedHideSoloCompilations', 'feedHideExcerpts'] as const;

/** 归uno化之posterioruno定Enese几项. 对象arriba还Con别字段(壳y各岛按需写入), aquíNounouno列出.  */
export interface AppSettings {
  [key: string]: unknown;
  batchSize: number;
  defaultSort: string;
  defaultSortDirection?: string;
  sortDefaultsVersion: number;
  hoverDelaySeconds: number;
  seekSeconds: number;
  searchHistoryLimit: number;
  relatedLimit: number;
  javLayout: string;
  homeLayout: string;
  javImage: string;
  followLayout: string;
  peopleLayout: string;
  photoSize: string;
  photoLayout?: string;
  followImagesOnly?: boolean;
  ambientMode: boolean;
  miniplayer: boolean;
  theaterMode: boolean;
  theme: string;
  groupCollapse: boolean;
  detailAutoplay: boolean;
  uiSounds: boolean;
  feedAutoScroll: boolean;
  feedHideGroupCompilations: boolean;
  feedHideSoloCompilations: boolean;
  feedHideExcerpts: boolean;
  followInitialDays: number;
  sidebarOrder: string[];
  homeGlow: HomeGlow;
  accent: string;
}

export const DEFAULT_SETTINGS = {
  batchSize: 60, defaultSort: 'seed', sortDefaultsVersion: 3, hoverDelaySeconds: 5, seekSeconds: 10,
  searchHistoryLimit: 10, relatedLimit: 20, javLayout: 'big', homeLayout: 'small', javImage: 'cover',
  followLayout: 'default', peopleLayout: 'big', photoSize: 'small', ambientMode: true, miniplayer: true,
  theaterMode: false, theme: 'system', groupCollapse: true, sidebarOrder: [...DEFAULT_SIDEBAR_ORDER],
  homeGlow: DEFAULT_HOME_GLOW, accent: DEFAULT_ACCENT,
} as const;

/** 白名单en la值Original样给回, 否则给 `fallback`.  */
export const allowedSetting = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? value as T : fallback;

/** 读回ese存量归uno化成完Completo偏bien对象. `migrated` Como真表示改写antiguoClave, 要落uno次盘.  */
export function normalizeAppSettings(raw: unknown): { settings: AppSettings; migrated: boolean } {
  const saved = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const settings = { ...DEFAULT_SETTINGS, ...saved } as Record<string, unknown>;
  settings.followInitialDays = FOLLOW_INITIAL_DAYS.includes(+(settings.followInitialDays as number))
    ? +(settings.followInitialDays as number) : 30;
  delete settings.rotateMinutes;
  /* 迁移Solo碰Predeterminado值本身: 界面arribaya经No存EnClave换成当anteriorClave, 用户主动选过OrdenarNo动. 
     No迁移话白名单会它静predetermina打回Aleatorio.  */
  let migrated = false;
  const version = +(settings.sortDefaultsVersion as number) || 0;
  if (version < 2 && settings.defaultSort === 'new') { settings.defaultSort = 'seed'; migrated = true }
  const alias = SORT_ALIASES[settings.defaultSort as string];
  if (version < 3 && alias) { settings.defaultSort = alias[0]; migrated = true }
  settings.sortDefaultsVersion = 3;
  settings.batchSize = boundedPreference(+(settings.batchSize as number), 1, 200, 60);
  settings.defaultSort = allowedSetting(settings.defaultSort, SORT_KEYS, 'seed');
  settings.hoverDelaySeconds = boundedPreference(+(settings.hoverDelaySeconds as number), 0, 60, 5);
  settings.seekSeconds = boundedPreference(+(settings.seekSeconds as number), 1, 300, 10);
  delete settings.loginDays;
  delete settings.metadataRefreshDays;
  settings.ambientMode = settings.ambientMode !== false;
  settings.theaterMode = settings.theaterMode === true;
  settings.groupCollapse = settings.groupCollapse !== false;
  settings.detailAutoplay = settings.detailAutoplay !== false;
  settings.miniplayer = settings.miniplayer !== false;
  settings.uiSounds = settings.uiSounds !== false;
  settings.feedAutoScroll = settings.feedAutoScroll !== false;
  settings.feedHideGroupCompilations = settings.feedHideGroupCompilations !== false;
  settings.feedHideSoloCompilations = settings.feedHideSoloCompilations === true;
  settings.feedHideExcerpts = settings.feedHideExcerpts !== false;
  settings.searchHistoryLimit = boundedPreference(+(settings.searchHistoryLimit as number), 0, 50, 10);
  settings.relatedLimit = boundedPreference(+(settings.relatedLimit as number), 0, 60, 20);
  Object.assign(settings, normalizeJavPreferences(settings));
  settings.theme = allowedSetting(settings.theme, THEME_CHOICES, 'system');
  settings.homeGlow = normalizeHomeGlow(settings.homeGlow);
  settings.accent = normalizeAccent(settings.accent);
  settings.sidebarOrder = normalizeSidebarOrder(settings.sidebarOrder);
  return { settings: settings as AppSettings, migrated };
}

/** 从 `storage` 读回y归uno化; 存Noes合法 JSON 时当作什么都没存.  */
export function readAppSettings(storage: Pick<Storage, 'getItem'>): { settings: AppSettings; migrated: boolean } {
  let raw: unknown = {};
  try { raw = JSON.parse(storage.getItem(SETTINGS_KEY) || '{}') } catch { /* 坏掉存量按空算 */ }
  return normalizeAppSettings(raw);
}

let store: SettingsStore<AppSettings> | null = null;

/** Completopáginaeseuno偏bien store. No.uno次调用时读回, 归uno化; 改写过antiguoClave就当场落uno次盘.  */
export function appSettingsStore(): SettingsStore<AppSettings> {
  if (store) return store;
  const { settings, migrated } = readAppSettings(localStorage);
  store = createSettingsStore(SETTINGS_KEY, settings);
  if (migrated) store.save();
  return store;
}

/** DatosBibliotecaeseuno要求某壳侧效果跟着做时报名字(同Configuración面板效果名).  */
export type SyncedEffect = 'searchHistoryLimit';

/** BuscarRegistro数En `/api/settings` en la形状: 还没定过时es null.  */
export interface SyncedSettings {
  followInitialDays?: unknown;
  feedHideGroupCompilations?: unknown;
  feedHideSoloCompilations?: unknown;
  feedHideExcerpts?: unknown;
  searchHistoryLimit?: unknown;
  sidebarOrder?: unknown;
}

/* DatosBibliotecaeseuno落进本地缓存. 启动时壳取uno次, Configuración面板每次Abrir再取uno次, 都交到aquí; 开着面板y
   侧栏经 store 通知跟arriba: 侧栏顺序变, 它当场按Nuevo顺序pesado排. BuscarRegistro数变要推给Buscar岛, eseunoabajo
   由 `changed` 交回壳.  */
export function applySyncedSettings(
  remote: SyncedSettings | null | undefined, changed: (effect: SyncedEffect) => void,
  target: SettingsStore<AppSettings> = appSettingsStore(),
): void {
  const settings = target.value;
  const initial = remote && remote.followInitialDays;
  if (FOLLOW_INITIAL_DAYS.includes(initial as number)) { settings.followInitialDays = initial as number; target.save() }
  for (const key of FEED_COMPILATION_KEYS) {
    if (typeof remote?.[key] !== 'boolean' || remote[key] === settings[key]) continue;
    settings[key] = remote[key] as boolean; target.save();
  }
  /* DatosBibliotecadentro还Sin数时, este设备本地改过ese数替所ConAcceder端先定abajo来, Solo送esteuno次.  */
  const limit = remote && remote.searchHistoryLimit;
  if (Number.isInteger(limit) && (limit as number) >= 0 && (limit as number) <= 50) {
    if (limit !== settings.searchHistoryLimit) {
      settings.searchHistoryLimit = boundedPreference(limit as number, 0, 50, 10); target.save();
      changed('searchHistoryLimit');
    }
  } else if (remote && remote.searchHistoryLimit === null
    && settings.searchHistoryLimit !== DEFAULT_SETTINGS.searchHistoryLimit) postSearchHistoryLimit(target);
  const order = Array.isArray(remote && remote.sidebarOrder) ? remote!.sidebarOrder as string[] : null;
  if (!order || !order.length || order.join(',') === settings.sidebarOrder.join(',')) return;
  settings.sidebarOrder = order;
  target.save();
}

/** 本地eseBuscarRegistro数送arribaDatosBiblioteca; FalloNo报, abajo次对账再送.  */
export function postSearchHistoryLimit(target: SettingsStore<AppSettings> = appSettingsStore()): Promise<unknown> {
  return api('/api/settings', {
    method: 'POST', body: JSON.stringify({ searchHistoryLimit: target.value.searchHistoryLimit }),
  }).catch(() => {});
}
