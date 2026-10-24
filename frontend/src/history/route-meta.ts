/* 路由元数据（ADR-0031「React Router 外壳阶段接管」）：标题、侧栏键、管理区身份与「换一批」的行为，按路径登记，
 * 全站只有这一张。壳的读者（标题、侧栏高亮与跳转、管理区身份、换一批）都查这里。
 *
 * Application 启动与路由树都按 `@peach/history` 直接读取本模块，管理区页头与标题共用同一份元数据。
 *
 * 字段：`title` 是 document.title 用的标签；`nav` 是侧栏 `data-nav` 的键；`section` 是管理区身份，同一身份按
 * 登记顺序取第一条作入口（数据管理排在重复文件与来源和凭证前面）；`refresh` 是列表栏「换一批」在这一页的行为，
 * `reopen` 重开自己、`skip` 不参与，不写则回统计页；`reload` 是批量写回之后的就地重取，`reopen` 让这一页按当前
 * 地址从头重开（索引页与资料页）。同一个侧栏键按登记顺序取第一条作入口：播放列表页排在播放列表队列前面。
 *
 * 资料页按模式登记（`/performers/*`，同 `ENTITY_ROUTES`），标题是地址上的名字；覆盖的六条按 `OVERLAY_PATHS` 的
 * 写法登记，参数只认数字。`routeMetaOf` 先查精确路径，再查覆盖路径，没有再按去掉空段之后的各段找：只剩一段查
 * 那一段的精确路径（`/performers/`），多于一段按第一段找模式，名字是剩下各段连起来的那一串（读者交进来的是
 * 解码过的路径，名字里的斜杠吃掉剩下全部段，空尾段不算）。 */
import { overlayMatch } from './overlay';
import { entityLinkName } from '../core/entity-links';
import { PREFERENCE_SECTIONS, CONFIGURATION_SECTIONS } from './settings-route';

export interface RouteMeta {
  readonly title?: string;
  readonly nav?: string;
  readonly section?: string;
  readonly refresh?: 'reopen' | 'skip';
  readonly reload?: 'reopen';
}

export const ROUTE_META: Readonly<Record<string, RouteMeta>> = {
  '/settings': { title: 'Ajustes', refresh: 'skip' },
  ...Object.fromEntries(Object.entries(PREFERENCE_SECTIONS).map(([key, title]) => [`/settings/${key}`, { title, refresh: 'skip' }])),
  ...Object.fromEntries(Object.entries(CONFIGURATION_SECTIONS).map(([key, title]) => [`/settings/${key}`, { title, section: 'configuration', refresh: 'reopen' }])),
  '/jav': { nav: 'jav', title: 'JAV', refresh: 'reopen' },
  '/stats': { section: 'stats', title: 'Estadísticas' },
  '/taste': { section: 'taste', title: 'Gustos', refresh: 'reopen' },
  '/review': { section: 'review', title: 'Revisión manual', refresh: 'reopen' },
  '/data-cleanup': { section: 'cleanup', title: 'Datos' },
  '/duplicates': { section: 'cleanup', title: 'Archivos duplicados', refresh: 'reopen' },
  '/quality-goals': { section: 'quality', title: 'Versiones HD', refresh: 'reopen' },
  '/sources': { section: 'cleanup', title: 'Fuentes y credenciales', refresh: 'reopen' },
  '/subscriptions': { section: 'follow', title: 'Suscripciones JAV', refresh: 'skip' },
  '/settings/library': { section: 'configuration', title: 'Configuración de Peach', refresh: 'reopen' },
  '/tasks': { section: 'activity', title: 'Tareas', refresh: 'reopen' },
  // 旧直达地址，改写到数据管理页的锚点，没有自己的管理身份。
  '/resource-sync': { title: 'Datos' },
  '/performers': { nav: 'performers', title: 'Artistas', reload: 'reopen' },
  '/creators': { title: 'Vendedores', reload: 'reopen' },
  '/studios': { nav: 'studios', title: 'Estudio', reload: 'reopen' },
  '/agencies': { title: 'Agencias', reload: 'reopen' },
  '/tags': { nav: 'tags', title: 'Etiquetas', reload: 'reopen' },
  '/performers/*': { reload: 'reopen' },
  '/studios/*': { reload: 'reopen' },
  '/creators/*': { reload: 'reopen' },
  '/series/*': { reload: 'reopen' },
  '/agencies/*': { reload: 'reopen' },
  '/tags/*': { reload: 'reopen' },
  '/playlists': { nav: 'playlists', title: 'Listas', refresh: 'reopen' },
  // 关注页重画要联网取一遍卡面，「换一批」只由页面自己的按钮触发。
  '/follow': { nav: 'follow', title: 'Siguiendo', refresh: 'skip' },
  // 目录：首页与回收站没有自己的标签，三个筛选态与垃圾文件的侧栏键与标签同 `STATE_ROUTES`、`STATE_LABELS`。
  '/': {},
  '/unseen': { nav: 'fresh', title: 'Sin ver' },
  '/watch-later': { nav: 'later', title: 'Ver más tarde' },
  '/flagged': { nav: 'flagged', title: 'Marcados' },
  '/junk-files': { nav: 'ads', title: 'Archivos basura' },
  '/trash': { section: 'trash' },
  // 覆盖：详情、四种队列与关注详情。分卷与版本队列没有自己的标签。
  '/assets/:id': { title: 'Registros de medios' },
  '/works/:code': { nav: 'jav', title: 'Obras JAV' },
  '/posts/:id': { title: 'Siguiendo' },
  // 沉浸模式进页面组，不算覆盖。
  '/immerse': { nav: 'immerse', title: 'Modo inmersivo' },
  '/wall': { nav: 'wall', title: 'Muro de reproducción' },
};

/** 这条路径登记的元数据；没登记是 `null`。 */
export function routeMetaOf(path: string): RouteMeta | null {
  if (Object.hasOwn(ROUTE_META, path)) return ROUTE_META[path]!;
  const overlay = overlayMatch(path);
  if (overlay) return ROUTE_META[overlay.path]!;
  const [segment, ...rest] = path.split('/').filter(Boolean);
  if (!segment) return null;
  if (!rest.length) return Object.hasOwn(ROUTE_META, `/${segment}`) ? ROUTE_META[`/${segment}`]! : null;
  const pattern = `/${segment}/*`;
  const kinds: Record<string, string> = { performers: 'performer', studios: 'studio', creators: 'creator', agencies: 'agency', series: 'series', tags: 'tag' };
  const name = /^\d+$/.test(rest.join('/')) ? entityLinkName(kinds[segment] || '', Number(rest[0])) : rest.join('/');
  return Object.hasOwn(ROUTE_META, pattern) ? { ...ROUTE_META[pattern], title: name || 'datos' } : null;
}
