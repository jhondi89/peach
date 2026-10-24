/* Gestionar区página头: Gestionar, 面包屑, página面Títuloy回收站Descripción行视Imagen模型y启动骨架. 
 *
 * página头归常驻组件 `manage-header`(`react/manage-header/`). 壳启动时Sincronizaresteen la骨架写进宿主
 * `[data-manage-header]`, React 包装载回来, 路由树画arribaesteuno面eseuno刻Completo换掉; 骨架y组件画es同uno结构, 
 * 判据(Título取哪名字, 哪几páginaImagen包屑, TítuloEnestrecho屏arriba收到哪uno档)也SoloEnaquí写uno次, 两边共用. 
 *
 * 当anteriorEn哪Gestionar区, 菜单dentro列哪几项, 回收站读数由壳算bien推进来: 路由表, `/healthz` 
 * `configurable` yDirectorio计数都还En壳dentro.  */

/** `[Clave, 名称, 字形]`, 同壳 `MANAGE_SECTIONS`.  */
export type ManageEntry = readonly [key: string, label: string, glyph: string];

/** 回收站Descripción行读数: DirectorioCuadrícula每continuarunopágina报uno次.  */
export interface TrashCount {
  total: number;
  shown: number;
}

export interface ManageHeaderProps {
  /** 当anteriorGestionar区; 空串时Completopágina头No画(primeropágina, Directorio, 关注páginaeste些).  */
  section: string;
  /** 解码过 `location.pathname`.  */
  path: string;
  /** TodoGestionar区, Título按 `section` 从aquí取名.  */
  sections: readonly ManageEntry[];
  /** Gestionararriba列ese几项(壳 `manageMenuSections()`, "Configuración"SoloEn本机列出).  */
  menu: readonly ManageEntry[];
  /** 回收站esteuno次进página以来Recienteuno次读数; 还没读到时es null, Descripción行铺同形占.  */
  trash: TrashCount | null;
}

/* DatosGestionarese几卡通往子página(vercel.com/geist/breadcrumbs: ConAnterior级página面子página才Imagen包屑). 
   人工复核, 回收站, alto清版虽也保Deja侧栏直达入口, 层级arriba仍从DatosGestionar进; 资源Sincronizares hub en la
   就地操作, SinIndependientepágina面. DatosGestionar之abajopágina面Título也取esteen la名字, "DatosGestionar"让给面包屑Anterior级.  */
export const MANAGE_CRUMB_PAGES: Readonly<Record<string, string>> = {
  '/junk-files': 'Archivos basura',
  '/duplicates': 'Archivos duplicados',
  '/review': 'Revisión manual',
  '/trash': 'Papelera',
  '/quality-goals': 'Versión HD',
  '/sources': 'Fuentes y credenciales',
};

/* estrecho屏(≤760px)arribaTítulo收uno档到 22px página面: 正文es 812px estrecho列DatosGestionar hub, 来源 y 凭证yConfiguraciónpágina. 
   其余Gestionarpágina跟Todo站página面Título走 24px.  */
const COMPACT_TITLE_PATHS = new Set(['/data-cleanup', '/sources']);

/** Gestionararriba按abajo哪uno项. DatosGestionarese几卡通往子página从DatosGestionar进, 按abajoes"DatosGestionar"; 
 *  别página按自己Gestionar区, GestionararribaSinesteuno项时就Sin按abajo项.  */
export function pressedManageKey(props: Pick<ManageHeaderProps, 'section' | 'path' | 'menu'>): string {
  const key = MANAGE_CRUMB_PAGES[props.path] ? 'cleanup' : props.section;
  return props.menu.some(([entry]) => entry === key) ? key : '';
}

export interface ManageHeaderView {
  title: string;
  /** Gestionararriba按abajoeseuno项; 空串时Sin按abajo项.  */
  pressed: string;
  /** 面包屑当anterioreseuno项名字; 空串时NoImagen包屑.  */
  crumb: string;
  compact: boolean;
  /** SoloCon回收站ConDescripción行.  */
  lede: { kind: 'none' } | { kind: 'skeleton' } | { kind: 'count'; text: string; total: number };
}

export const trashLedeText = ({ total, shown }: TrashCount) =>
  `${total.toLocaleString()} que cumple · Mostrar ${shown.toLocaleString()}`;

/** página头esteuno刻画什么; NoEnGestionar区时es null.  */
export function manageHeaderView(props: ManageHeaderProps): ManageHeaderView | null {
  const entry = props.sections.find(([key]) => key === props.section);
  if (!entry) return null;
  const crumb = MANAGE_CRUMB_PAGES[props.path] ?? '';
  return {
    title: (props.section === 'cleanup' && crumb) || entry[1],
    pressed: pressedManageKey(props),
    crumb,
    compact: COMPACT_TITLE_PATHS.has(props.path) || props.section === 'configuration',
    lede: props.section !== 'trash' ? { kind: 'none' }
      : props.trash ? { kind: 'count', text: trashLedeText(props.trash), total: props.trash.total }
        : { kind: 'skeleton' },
  };
}

const escape = (value: string) => value.replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const glyph = (name: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${escape(name)}"/></svg>`;

/** 回收站Descripción行读数到之anterior同形占: izquierda边uno格按读数ancho, derecha端es"清空回收站"eseClave尺寸. 
 *  骨架y岛共用esteuno段, 扫光动画跟Todo站 `.skeleton` 走.  */
export const TRASH_LEDE_SKELETON_HTML = '<span class="skeleton" data-trash-lede-skeleton="text" aria-hidden="true"></span>'
  + '<span class="skeleton" data-trash-lede-skeleton="action" aria-hidden="true"></span>';

/** 启动骨架: y岛同uno结构, 岛continuar手时Completo换掉.  */
export function manageHeaderSkeletonHtml(props: ManageHeaderProps): string {
  const view = manageHeaderView(props);
  if (!view) return '';
  const menu = props.menu.map(([key, label, mark]) => {
    const on = key === view.pressed;
    return `<button type="button" data-manage="${escape(key)}" aria-pressed="${on}"${on ? ' aria-current="page"' : ''}>`
      + `${glyph(mark)}<span>${escape(label)}</span></button>`;
  }).join('');
  const crumb = view.crumb
    ? `<nav data-manage-crumb="" aria-label="Breadcrumb"><ol><li><a href="/data-cleanup">Gestión de datos</a>${glyph('chevron-right')}</li>`
      + `<li aria-current="true"><span>${escape(view.crumb)}</span></li></ol></nav>`
    : '';
  const lede = view.lede.kind === 'none' ? ''
    : `<p class="mono" data-manage-lede="">${view.lede.kind === 'skeleton' ? TRASH_LEDE_SKELETON_HTML
      : `<span data-lede-text="">${escape(view.lede.text)}</span>${view.lede.total ? EMPTY_TRASH_HTML : ''}`}</p>`;
  return `<nav data-manage-bar="" aria-label="Gestionar"><div data-manage-menu="">${menu}</div></nav>`
    + crumb
    + `<h2 data-manage-title=""${view.compact ? ' data-compact=""' : ''}>${escape(view.title)}</h2>`
    + lede;
}

const EMPTY_TRASH_HTML = '<button type="button" data-empty-trash="" title="Eliminar permanentemente el contenido de la papelera">Vaciar papelera</button>';
