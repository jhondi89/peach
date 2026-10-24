import { resolveFollowSort, SORT_OPTIONS, type SortDir, type SortKey } from './follow-sort';
import { islandButton, islandSelect } from './island-skeleton';
import { configurationSkeleton } from './configuration-skeleton';
import { javPageSkeleton } from './jav-skeleton';
import { duplicatesSkeleton, qualityGoalsSkeleton, statsSkeleton, tasteSkeleton } from './management-skeletons';

/** Esperando态复用página面容Dispositivo, SoloCon异步contenido使用占.  */
const line = (width = '60%') => `<span class="skeleton" style="width:${width}"></span>`;
const lines = () => `${line('80%')}${line('48%')}`;
const repeat = (html: string, count: number) => html.repeat(count);
/* 关注GestionarCompletopágina归 React, 骨架Completo画En `.peach-react` dentro, 容Dispositivoy按Clave都取 React ese侧渲染出同uno串
   类名(`react/follow-manage/`, `react/components/` y `island-skeleton.ts`): página面eseuno列, 读数带, 
   分段Controles, 关注ListaeseIntroduce充卡, 创作者卡, 来源行 y 表格exterior框. SoloConetc.Datos读数画占. 
   骨架Completo `inert`, 焦点 y 点击都进No来; 要etc.Datos才能执行Clave(Verificar, Quitar, Seleccionar todo, 收起)
   另标Original生 `disabled` y `data-skeleton-action`, exterior观esTodo站骨架共用ese副禁用面, 
   视ImagenCambiar, Ordenareste类偏bienControles本地就Con答案, 保持continuar管posteriorlargo相.  */
const WAITING = 'disabled data-skeleton-action';
const text = (width: string) => `<span class="skeleton skeleton-text" style="width:${width}"></span>`;
const block = (width: number, height: number, round = false) =>
  `<span class="skeleton" style="width:${width}px;height:${height}px;flex:none${round ? ';border-radius:50%' : ''}"></span>`;
const STAT = 'min-w-0 bg-background-secondary-default rounded-2xl shadow-card flex flex-col gap-3 px-6 py-5 max-sm:gap-2 max-sm:p-4';
const followReadings = () => `<div class="inline-grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">${['Seguir creador', 'Activar fuente', 'Error de verificación', 'Actualizaciones sin ver', 'Suscripción JAV', 'Nuevas obras sin ver'].map(term => `<div class="${STAT}"><span class="text-body-medium text-text-secondary">${term}</span><b class="text-title-1-medium tabular-nums text-text-primary">${text('3em')}</b></div>`).join('')}</div>`;
/** página签y React `follow-manage-page.tsx`  `TABS` 同名同序; 选en procesoes地址栏 `?tab=` eseuno, 认No出时esNo.uno.  */
const FOLLOW_TABS = [['list', 'Lista de seguidos'], ['add', 'Agregar seguimiento'], ['feeds', 'Fuente de suscripción JAV']] as const;
const followTabKey = (tab = '') => (FOLLOW_TABS.some(([key]) => key === tab) ? tab : 'list');
const followTabs = (tab: string) => `<div data-section-nav data-section-items class="flex max-w-full flex-nowrap overflow-x-auto">${FOLLOW_TABS.map(([key, name]) => `<span class="whitespace-nowrap" aria-selected="${key === tab}">${name}</span>`).join('')}</div>`;
/** Board UI `Checkbox` no勾静止态; 给字就es"Seleccionar todo本página"ese带Etiquetauno.  */
const followCheck = (label = '') => `<span class="group inline-flex items-center select-none gap-2"><span class="flex shrink-0 items-center justify-center rounded-sm size-4 border bg-background-primary-default shadow-xs border-border-checkbox-default"></span>${label ? `<span class="text-body-medium text-text-primary">${label}</span>` : ''}</span>`;

/* 工具行: VerificarTodoes主按钮, 视ImagenCambiaresuno组两 ghost 纯Imagen标Clave, 选en procesoese由 `aria-pressed` 标出, 
   Ordenar框写着地址栏eseuno档名字, 方向Clave朝着同uno头. 工具行estrecho于 740px 时 React 带字Clave收成
   纯Imagen标, 骨架由 `09-skeleton.css` 容DispositivoConsulta按同uno线收.  */
interface FollowToolbar { table: boolean; sort: SortKey; dir: SortDir }
const followToolbar = ({ table, sort, dir }: FollowToolbar) => {
  const name = SORT_OPTIONS.find(([key]) => key === sort)![1];
  return `<div class="flex flex-wrap items-center gap-2 ui-follow-skeleton-toolbar"><span class="contents max-sm:flex max-sm:min-w-0 max-sm:flex-1 max-sm:flex-col"><h3 class="mr-auto text-title-2-medium text-text-primary">Lista de seguidos</h3><span class="text-body-2-regular text-text-secondary">${text('132px')}</span></span>${islandButton({ glyph: 'refresh-cw', label: 'Verificar todo', compact: true, attrs: WAITING })}<span data-follow-toolbar-controls class="contents max-sm:flex max-sm:w-full max-sm:items-center max-sm:gap-2"><span data-button-group role="group">${islandButton({ variant: 'ghost', glyph: 'layout-grid', attrs: `aria-pressed="${!table}"` })}${islandButton({ variant: 'ghost', glyph: 'table', attrs: `aria-pressed="${table}"` })}</span>${islandSelect(name)}${islandButton({ variant: 'secondary', glyph: dir === 'asc' ? 'arrow-up' : 'arrow-down' })}${table ? '' : islandButton({ variant: 'secondary', glyph: 'chevron-up', label: 'Colapsar todo', compact: true, attrs: WAITING })}</span></div>`;
};
/** 行尾ese对动作Clave: VerificaresteunoActualizar, Quitaresteuno, y React `SourceRow` 同Comopequeño号次级纯Imagen标Clave.  */
const followRowActions = () => `<span class="flex shrink-0 items-center gap-1">${islandButton({ variant: 'secondary', size: 'small', glyph: 'refresh-cw', attrs: WAITING })}${islandButton({ variant: 'secondary', size: 'small', glyph: 'trash', attrs: WAITING })}</span>`;
/** uno来源: 勾选, 名字, 站点Imagen标, Estado徽章, Última vezVerificar, 动作, y React `SourceRow` 同uno串类名.  */
const followRow = () => `<div class="flex min-h-16 flex-wrap items-center gap-3 px-2 py-3 max-sm:gap-x-2 follow-skeleton-source">${followCheck()}<span class="flex min-w-0 grow basis-0 flex-col gap-0.5"><span class="text-body-medium">${text('8em')}</span></span><span class="flex shrink-0 items-center gap-1.5">${block(14, 14)}</span>${block(48, 24)}<span data-follow-source-controls class="contents max-sm:flex max-sm:w-full max-sm:flex-wrap max-sm:items-center max-sm:gap-1.5"><span class="shrink-0 text-body-2-regular whitespace-nowrap text-text-secondary max-sm:mr-auto max-sm:text-caption-1-regular">${text('113px')}</span>${followRowActions()}</span></div>`;
/** uno创作者uno raised 卡: 头行esAvatar, 名字, Verificar, 站点Imagen标, Seleccionar todo, 收起, 底abajoes来源行.  */
const followAuthor = (rows: number) => `<section class="min-w-0 bg-background-primary-default rounded-2xl shadow-card flex flex-col overflow-hidden p-2 follow-skeleton-author"><div class="flex flex-wrap items-center gap-3 px-2 py-2.5" data-follow-author-header data-open>${block(32, 32, true)}<b class="min-w-0 grow text-body-medium wrap-anywhere text-text-primary max-sm:basis-0">${text('92px')}</b>${islandButton({ variant: 'secondary', size: 'small', glyph: 'refresh-cw', attrs: WAITING })}<span data-follow-author-controls class="contents max-sm:flex max-sm:w-full max-sm:items-center max-sm:gap-2"><span class="flex shrink-0 items-center gap-1 max-sm:mr-auto">${block(14, 14)}${block(14, 14)}</span>${islandButton({ variant: 'secondary', size: 'small', glyph: 'check-check', label: 'Seleccionar todo', attrs: WAITING })}${islandButton({ variant: 'secondary', size: 'small', glyph: 'chevron-up', label: 'Colapsar', attrs: WAITING })}</span></div><div data-source-divider>${repeat(followRow(), rows)}</div></section>`;
/** 表格骨架画másmenos行由Por página数决定, 写死uno数会En别páginaTamañoarribamásDeja或menosDejauno屏. 
 *  偏bien存Enantiguo层ese `peach.settings.v1` dentro, 直continuar读它: 骨架跑En island 挂载之anterior, 
 *  este时候página面自己Estado还No存En.  */
const followPageSize = (): number => {
  try {
    return Number(JSON.parse(localStorage.getItem('peach.settings.v1')||'{}').followPageSize)||20;
  } catch { return 20 }
};
/* 表格列, 列名yOrdenar指示照 React ese Board UI `Table`: "Seleccionar""操作"两列名Solo给读屏, 
   当anteriorOrdenar落En哪uno列, eseuno列指示就朝哪头.  */
const TABLE_COLUMNS = [['select', ''], ['author', 'Creador'], ['source', 'Fuente'], ['provider', 'Sitio'], ['status', 'Estado'], ['checked', 'Última verificación'], ['actions', '']] as const;
const COLUMN_OF: Partial<Record<SortKey, string>> = { name: 'author', source: 'source', provider: 'provider', status: 'status', checked: 'checked' };
const SORT_MARK = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12.7071 15.2929C12.3166 15.6834 11.6834 15.6834 11.2929 15.2929L7.70711 11.7071C7.07714 11.0771 7.52331 10 8.41421 10H15.5858C16.4767 10 16.9229 11.0771 16.2929 11.7071L12.7071 15.2929Z" fill="currentColor"/></svg>';
const followTable = (rows: number, { sort, dir }: { sort: SortKey; dir: SortDir }) => {
  const head = TABLE_COLUMNS.map(([id, name]) => {
    if (!name) return '<th></th>';
    const direction = COLUMN_OF[sort] === id ? ` data-direction="${dir === 'asc' ? 'ascending' : 'descending'}"` : '';
    return `<th><span class="flex items-center gap-0.5">${name}<span data-sort-indicator${direction}>${SORT_MARK}</span></span></th>`;
  }).join('');
  const row = `<tr>${[followCheck(), `<span class="flex min-w-0 items-center gap-2">${block(32, 32, true)}${text('5em')}</span>`, text('10em'), `<span class="flex items-center gap-1.5">${block(14, 14)}${text('4em')}</span>`, block(48, 24), text('113px'), followRowActions()].map(cell => `<td>${cell}</td>`).join('')}</tr>`;
  return `<div data-board-data-table data-follow-table class="follow-skeleton-table"><div class="w-full overflow-x-auto"><table class="bui-table bui-table-sm"><thead><tr>${head}</tr></thead><tbody>${repeat(row, rows)}</tbody></table></div></div>`;
};
/** 分página行: 数ypágina码要etc.Datos, Por página几esesteExplorar dispositivo偏bien, 照最终字样写出来.  */
const followPager = (table: boolean, size: number) => `<div class="flex flex-wrap items-center justify-between gap-3"><span class="text-body-2-regular text-text-secondary">${text('111px')}</span>${islandSelect(`Por página ${size} ${table ? 'Resultado' : ' resultado(s)'}`, { size: 'sm' })}${block(204, 32)}</div>`;
/** 关注Lista以exteriorpágina签: contenido各No相同, 要etc.Datos才知道largo什么样, Solo画eseIntroduce充卡 y 几行占.  */
const followPanel = () => `<div class="min-w-0 bg-background-secondary-default rounded-2xl shadow-card flex flex-col gap-4 px-6 py-5 max-sm:px-4 ui-follow-skeleton-surface"><h3 class="text-title-2-medium text-text-primary">${text('120px')}</h3>${['72%', '56%', '64%', '40%'].map((width) => `<span class="text-body-medium">${text(width)}</span>`).join('')}</div>`;
type FollowSkeletonOptions = { followLayout?: string; followPageSize?: number; followSort?: string; followDir?: string; followTab?: string };
const followList = (options: FollowSkeletonOptions) => {
  const tab = followTabKey(options.followTab);
  if (tab !== 'list') return `<div class="peach-react"><div class="mx-auto flex w-full max-w-board flex-col gap-8">${followReadings()}<div class="flex flex-col gap-6">${followTabs(tab)}<div class="flex flex-col gap-4">${followPanel()}</div></div></div></div>`;
  const table = options.followLayout === 'table';
  const order = resolveFollowSort(options.followSort, options.followDir);
  const size = options.followPageSize || followPageSize();
  const content = table
    ? followTable(size, order)
    : `${followCheck('Seleccionar toda la página')}<div class="flex flex-col gap-3">${followAuthor(3)}${followAuthor(4)}${followAuthor(3)}</div>`;
  return `<div class="peach-react"><div class="mx-auto flex w-full max-w-board flex-col gap-8">${followReadings()}<div class="flex flex-col gap-6">${followTabs(tab)}<div class="flex flex-col gap-4"><div class="min-w-0 bg-background-secondary-default rounded-2xl shadow-card flex flex-col gap-4 px-6 py-5 max-sm:px-4 ui-follow-skeleton-surface" data-layout="${table ? 'table' : 'default'}">${followToolbar({ table, ...order })}${content}${followPager(table, size)}</div></div></div></div></div>`;
};

/** Detalles骨架exterior层 `[data-skeleton="detail"]` dentro面eseuno格: 舞岛自己画exterior层, dentro面照esteuno写. 格子yDetalles栏
 *  几何es舞(`react/stage/stage.css`), 骨架底色y行距es壳 `skeleton` uno族.  */
export function detailSkeletonBody(): string {
  return `<div data-stage-grid="" aria-hidden="true"><div data-stage-media="" class="ui-skeleton-detail-media skeleton"></div><aside data-stage-side=""><div data-stage-side-content="" class="ui-skeleton-lines">${line('85%')}${line('65%')}${repeat(lines(), 4)}</div></aside></div>`;
}

export function boardPageSkeleton(
  path: string, options: FollowSkeletonOptions = {},
): string {
  let body = '';
  if (path === '/stats') {
    body = statsSkeleton();
  } else if (path === '/jav') {
    body = javPageSkeleton(new URLSearchParams(location.search).get('tab') === 'wants' ? 'wants' : 'discover');
  } else if (path === '/taste') {
    body = tasteSkeleton();
  } else if (path === '/subscriptions') {
    body = followList(options);
  } else if (path === '/settings/library' || path === '/settings/diagnostics') {
    body = configurationSkeleton(path === '/settings/diagnostics' ? 'Diagnóstico del sistema' : 'Biblioteca y catalogación');
  } else if (path === '/tasks') {
    body = `<div class="ui-activitypage">${['En progreso', 'Rechazados', 'Completados recientemente'].map(title => `<section class="activitysection"><h3 class="geist-fieldset-title">${title}</h3><div class="ui-activity-runs"><article class="cleanupfieldset activity-run"><div class="geist-fieldset-content ui-skeleton-lines">${line('35%')}${lines()}</div></article></div></section>`).join('')}</div>`;
  } else if (path === '/duplicates') {
    body = duplicatesSkeleton();
  } else if (path === '/quality-goals') {
    body = qualityGoalsSkeleton();
  } else if (path === '/playlists') {
    body = `<section class="ui-playlistpage"><header><div><h2>Lista de reproducción</h2><p>Guardar Mix y continuar en tu orden.</p></div><div class="playlistcreate ui-skeleton-lines"><span>Nueva lista de reproducción</span>${line('200px')}</div></header><div class="ui-playlistcards">${repeat(`<article class="card playlistcard"><div class="mixstack"><div class="pic skeleton"></div></div><div class="mixmeta"><span class="mav skeleton"></span><div class="mixcopy ui-skeleton-lines">${lines()}</div></div></article>`, 6)}</div></section>`;
  } else return '';
  return `<div class="board-page-skeleton" data-skeleton="board${path}" role="status" aria-label="Leyendo página"><div aria-hidden="true" inert>${body}</div></div>`;
}
