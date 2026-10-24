/* 索引cincopágina(艺人, 卖家, Sello, Agencia, Etiqueta)进página骨架y地址解析. 
 *
 * página头此刻就能给出最终样子: Título, 读数占, 版开关, Favoritos入口, Filtrar框, página面级 Tabs y本地艺人身Categoría, 
 * etc.SoloConabajo面esecontenido. 
 * React página取回primero屏posteriorCompleto换掉它, Clave y 文字同página面eseunouno致, 换eseunoabajopágina头No跳. esteen laControlesNocontinuar线: 骨架SoloEn
 * 取数eseuno段露面. 两处铺它: 壳En冷启动落En索引página时先铺uno遍(`renderInitialSurfaceLoading`), 路由树索引元素
 * 每次Abriranterior再铺; 屏幕arribaya经es同uno骨架就Nopesado画. 
 *
 * 版偏bien由调用方读bien交进来: este模壳y React 包各带uno, Configuración store Solo能Conuno.  */
import { boardTabsHtml, fitSkeleton, iconSwitchHtml, indexSkeletonHtml } from '@peach/legacy/ui';
import { identityFilterSkeletonHtml } from './identity-filter';
import { islandShortcutsEntry, islandSearchInput } from './island-skeleton';

export type IndexPageKind = 'performers' | 'creators' | 'studios' | 'agencies' | 'tags';

/** 地址栏en laese几项.  */
export interface IndexParams {
  kind: IndexPageKind;
  q: string;
  scope: 'local' | 'online';
  view: 'alphabet' | 'cloud';
  category: string;
}

export const INDEX_TITLES: Readonly<Record<IndexPageKind, string>> = {
  performers: 'Actriz', creators: 'Vendedor', studios: 'Sello', agencies: 'Agencia', tags: 'Etiqueta',
};

/* 艺人索引版, 思路同 JAV grandeImagen: 列anchoNo变, SoloImagen从圆框拉成竖幅, uno屏en la人数No变而每脸更grande; 紧凑就es
   圆Avatareseuno屏. 资料página名册读es同unoConfiguración值.  */
const PEOPLE_LAYOUTS =[['big', 'Imagen grande · Avatar vertical', 'maximize'], ['compact', 'Compacto · Avatar circular', 'layout-grid']] as const;
/* 公司eseuno格摆es方形标识而Noes脸, 说法跟着换; 档仍es同unoConfiguración值.  */
const COMPANY_LAYOUTS = [['big', 'Imagen grande · Logo completo', 'maximize'], ['compact', 'Compacto · Logo circular', 'layout-grid']] as const;
const MAKER_INDEX_KINDS = [['studios', 'Sello', 'clapperboard'], ['agencies', 'Agencia', 'briefcase']] as const;
const INDEX_SCOPES = [['local', 'Local', 'hard-drive'], ['online', 'En línea', 'rss']] as const;
const PEOPLE_INDEX_TABS = [['performers', 'Actriz', 'user-round'], ['creators', 'Vendedor', 'user-round'], ['online', 'En línea', 'rss']] as const;
const TAG_VIEWS = [['cloud', 'Nube de etiquetas', 'tags'], ['alphabet', 'Alfabeto', 'text-aa']] as const;

/** 存着版偏bien, 认No出回到grandeImagen.  */
export const peopleLayoutOf = (saved: unknown): 'big' | 'compact' => (saved === 'compact' ? 'compact' : 'big');

/** 地址栏en laese几项. Rangoy视ImagenSolo认两值; Tipo由página面按esteuno套词表核对, 认No出回到Todo.  */
export function indexParams(kind: IndexPageKind, search: string): IndexParams {
  const params = new URLSearchParams(search);
  return {
    kind, q: params.get('q') || '', scope: params.get('scope') === 'online' ? 'online' : 'local',
    view: params.get('view') === 'cloud' ? 'cloud' : 'alphabet', category: params.get('category') || 'all',
  };
}

type Choices = readonly (readonly [string, string, string])[];
const tabs = (items: Choices, active: string, label: string) => boardTabsHtml(
  items.map(([value, text, symbol]) => ({ value, label: text, symbol })), { active, label, className: 'indextabs' });

/* Etiquetapágina Tabs abajo面还Conuno两排Filtrar玻璃(React  `FilterGlassRows`): arriba排esTipo药丸, abajo排es读数, 按primero字
   Saltar a y 视ImagenCambiar. 药丸Con哪几, 读数másmenos, Con哪些primero字都要etc.Datos, 视ImagenCambiar此刻就es最终eseuno档; altoyabajoMargen同
   antiguo `.board-filter-frame`, página面Llegar时它Original地换成真eseuno, abajo面contenidoNoabajo跳.  */
const tagFilterSkeletonHtml = (view: string) => `<div class="board-filter-frame" data-filter-frame>
    <div class="tagbar" data-filter-row="top" data-skeleton-tier="pill" aria-label="Tipo de etiqueta"></div>
    <div class="count" data-filter-row="bottom"><span class="mono"><span class="countskeleton"></span></span>
      ${iconSwitchHtml('tag-view', 'Vista de etiquetas', TAG_VIEWS, view)}</div></div>`;

export function indexPlaceholderHtml({ kind, q, scope, view, category }: IndexParams, layout: 'big' | 'compact'): string {
  const title = INDEX_TITLES[kind] || 'Etiqueta', people = kind !== 'tags', company = kind === 'studios' || kind === 'agencies';
  const switcher = people
    ? iconSwitchHtml('people-layout', title + 'Indexar版', company ? COMPANY_LAYOUTS : PEOPLE_LAYOUTS, layout) : '';
  return `<div class="ihead peach-react" data-index-head>
      <h2 class="disp indexheading">${title}</h2>
      ${people ? '<span class="mono" id="indexCount"><span class="countskeleton"></span></span>' : ''}${switcher}
      ${islandShortcutsEntry()}
      <div data-index-search class="ml-auto min-w-35 max-w-80 flex-1 max-board-narrow:order-1 max-board-narrow:basis-40">${islandSearchInput('', q, 'Filtrar' + title)}</div>
    </div>
    ${kind === 'tags' ? tabs(INDEX_SCOPES, scope, 'Glosario') : kind === 'performers' || kind === 'creators'
      ? tabs(PEOPLE_INDEX_TABS, kind === 'performers' && scope === 'online' ? 'online' : kind, 'Lista de personas')
      : company ? tabs(MAKER_INDEX_KINDS, kind, 'Tipo de empresa') : ''}
    ${kind === 'tags' ? tagFilterSkeletonHtml(view) : ''}
    ${kind === 'performers' && scope !== 'online' ? identityFilterSkeletonHtml(category) : ''}
    ${indexSkeletonHtml({ kind, layout, mode: view })}`;
}

const skeletonKeyOf = (html: string) => html.match(/data-skeleton="([^"]*)"/)?.[1] || '';

/** esteunopágina骨架铺进容Dispositivo. 屏幕arribaya经es同uno骨架就别pesado画: profundo链冷启动时primero屏骨架先铺过uno遍, innerHTML 换
 *  Nuevo节点会 shimmer 从头放uno遍.  */
export function paintIndexSkeleton(container: HTMLElement, params: IndexParams, layout: 'big' | 'compact'): void {
  const placeholder = indexPlaceholderHtml(params, layout);
  if (container.querySelector<HTMLElement>('[data-skeleton]')?.dataset.skeleton !== skeletonKeyOf(placeholder)) {
    container.innerHTML = placeholder;
    fitSkeleton(container);
  }
}
