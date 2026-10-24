/* 路由Metadatos(ADR-0031"React Router exterior壳阶段continuar管"): Título, 侧栏Clave, Gestionar区身y"换uno批"行Como, 按Ruta登记, 
 * Todo站SoloConesteuno. 壳读者(Título, 侧栏alto亮ySaltar a, Gestionar区身, 换uno批)都查aquí. 
 *
 * Application 启动y路由树都按 `@peach/history` 直continuar读取本模, Gestionar区página头yTítulo共用同unoMetadatos. 
 *
 * 字段: `title` es document.title 用Etiqueta; `nav` es侧栏 `data-nav` Clave; `section` esGestionar区身, 同uno身按
 * 登记顺序取No.uno作入口(DatosGestionar排EnRepetirArchivoy来源 y 凭证anterior面); `refresh` esLista栏"换uno批"Enesteunopágina行Como, 
 * `reopen` pesado开自己, `skip` No参y, No写则回Estadísticaspágina; `reload` es批量写回之posterior就地pesado取, `reopen` 让esteunopágina按当anterior
 * 地址从头pesado开(索引páginay资料página). 同uno侧栏Clave按登记顺序取No.uno作入口: ReproducirListapágina排EnReproducirListaColaanterior面. 
 *
 * 资料página按Modo登记(`/performers/*`, 同 `ENTITY_ROUTES`), Títuloes地址en la名字; 覆盖seis按 `OVERLAY_PATHS` 
 * 写法登记, ParámetroSolo认数字. `routeMetaOf` 先查ExactoRuta, 再查覆盖Ruta, Sin再按去掉空段之posterior各段找: Solo剩uno段查
 * eseuno段ExactoRuta(`/performers/`), más于uno段按No.uno段找Modo, 名字es剩abajo各段连起来eseuno串(读者交进来es
 * 解码过Ruta, 名字en la斜杠吃掉剩abajoTodo段, 空尾段No算).  */
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
  '/settings': { title: 'Configuración', refresh: 'skip' },
  ...Object.fromEntries(Object.entries(PREFERENCE_SECTIONS).map(([key, title]) => [`/settings/${key}`, { title, refresh: 'skip' }])),
  ...Object.fromEntries(Object.entries(CONFIGURATION_SECTIONS).map(([key, title]) => [`/settings/${key}`, { title, section: 'configuration', refresh: 'reopen' }])),
  '/jav': { nav: 'jav', title: 'JAV', refresh: 'reopen' },
  '/stats': { section: 'stats', title: 'Estadísticas' },
  '/taste': { section: 'taste', title: 'Preferencias', refresh: 'reopen' },
  '/review': { section: 'review', title: 'Revisión manual', refresh: 'reopen' },
  '/data-cleanup': { section: 'cleanup', title: 'Gestión de datos' },
  '/duplicates': { section: 'cleanup', title: 'Archivos duplicados', refresh: 'reopen' },
  '/quality-goals': { section: 'quality', title: 'Versión HD', refresh: 'reopen' },
  '/sources': { section: 'cleanup', title: 'Fuentes y credenciales', refresh: 'reopen' },
  '/subscriptions': { section: 'follow', title: 'Gestionar seguidos', refresh: 'skip' },
  '/settings/library': { section: 'configuration', title: 'Configuración de Peach', refresh: 'reopen' },
  '/tasks': { section: 'activity', title: 'Centro de tareas', refresh: 'reopen' },
  // antiguo直达地址, 改写到DatosGestionarpágina锚点, Sin自己Gestionar身. 
  '/resource-sync': { title: 'Gestión de datos' },
  '/performers': { nav: 'performers', title: 'Actriz', reload: 'reopen' },
  '/creators': { title: 'Vendedor', reload: 'reopen' },
  '/studios': { nav: 'studios', title: 'Sello', reload: 'reopen' },
  '/agencies': { title: 'Agencia', reload: 'reopen' },
  '/tags': { nav: 'tags', title: 'Etiqueta', reload: 'reopen' },
  '/performers/*': { reload: 'reopen' },
  '/studios/*': { reload: 'reopen' },
  '/creators/*': { reload: 'reopen' },
  '/series/*': { reload: 'reopen' },
  '/agencies/*': { reload: 'reopen' },
  '/tags/*': { reload: 'reopen' },
  '/playlists': { nav: 'playlists', title: 'Lista de reproducción', refresh: 'reopen' },
  // 关注páginapesado画要联网取uno遍卡面, "换uno批"Solo由página面自己按钮触发. 
  '/follow': { nav: 'follow', title: 'Seguir', refresh: 'skip' },
  // Directorio: primeropáginay回收站Sin自己Etiqueta, tresFiltrar态y垃圾Archivo侧栏ClaveyEtiqueta同 `STATE_ROUTES`, `STATE_LABELS`. 
  '/': {},
  '/unseen': { nav: 'fresh', title: 'No visto' },
  '/watch-later': { nav: 'later', title: 'Ver más tarde' },
  '/flagged': { nav: 'flagged', title: 'Marcado' },
  '/junk-files': { nav: 'ads', title: 'Archivos basura' },
  '/trash': { section: 'trash' },
  // 覆盖: Detalles, cuatroColay关注Detalles. 分卷yVersiónColaSin自己Etiqueta. 
  '/assets/:id': { title: 'MediosRegistro' },
  '/works/:code': { nav: 'jav', title: 'Obras JAV' },
  '/posts/:id': { title: 'Seguir' },
  // InmersivoModo进página面组, No算覆盖. 
  '/immerse': { nav: 'immerse', title: 'Modo inmersivo' },
  '/wall': { nav: 'wall', title: 'Muro de reproducción' },
};

/** esteRuta登记Metadatos; 没登记es `null`.  */
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
  return Object.hasOwn(ROUTE_META, pattern) ? { ...ROUTE_META[pattern], title: name || 'Detalles' } : null;
}
