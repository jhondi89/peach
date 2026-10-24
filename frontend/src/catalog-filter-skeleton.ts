/* primeropáginaFiltrar(`catalog-filter` 岛)挂arriba之anterioreseuno骨架. 
 *
 * 冷启动时两排AvataryEtiqueta要etc. `/api/facets` y `/api/tops`, 约uno秒; React 包也还En路arriba. este段Tiempo
 * 壳esteuno串 HTML 铺进宿主, 岛挂arriba时Completo换掉. 结构y属性照 `react/catalog-filter/catalog-filter-page.tsx`
 * 渲染出来静止态写(浮层几何es `FilterGlassRows` 合yposterior类), 几何En
 * `react/catalog-filter/catalog-filter.css` uno处定, 所以换掉eseunoabajoNo跳. 
 *
 * cuatro视Imagen由 state 决定, esteuno趟取数No改它们, 所以现En就画成最终样子: `href` es真地址, 壳En宿主arriba
 * 委托continuar住点击. AvataryEtiquetaSolo画占, 读数esunoancho度定死微光.  */
import type { CatalogView } from './react/catalog-filter/catalog-filter';
import { islandShortcutsEntry } from './island-skeleton';
import { filterControlsSkeletonHtml } from './filter-controls-skeleton';
import type { CatalogFilterProps } from './react/catalog-filter/catalog-filter';

/** 每排摆másmenos格, 同岛dentro空馆藏占 `EMPTY_SLOTS`, 由容Dispositivo裁到puede用ancho度.  */
const EMPTY_SLOTS = 64;

const esc = (value: string): string => value.replace(/[&<>"]/g, (ch) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] as string);

const slots = (html: string): string => html.repeat(EMPTY_SLOTS);

export function catalogFilterSkeletonHtml(views: readonly CatalogView[], state: string, head?: Pick<CatalogFilterProps, 'sorts' | 'layout'>): string {
  const viewHtml = views.map((view) => `<a href="${esc(view.href)}" data-catalog-view="${esc(view.k)}"`
    + ` data-entity-press="" aria-pressed="${state === view.k}">${esc(view.label)}</a>`).join('');
  return `<div class="peach-react"><div class="contents" data-catalog-root="" data-loading="">`
    + `<div data-catalog-tiers="" aria-busy="true">`
    + `<div data-catalog-tier="performers" data-skeleton="tiers">`
    + slots('<span data-catalog-placeholder="performer" aria-hidden="true"><span></span><span>&nbsp;</span></span>')
    + `</div><div data-catalog-tier="studios">`
    + slots('<span data-catalog-placeholder="studio" aria-hidden="true"><span></span><span>&nbsp;</span></span>')
    + `</div></div>`
    + `<div role="group" aria-label="Filtrar y ordenar" data-filter-glass="" data-glass-pane="" data-filter-frame=""`
    + ` data-catalog-frame="" class="sticky top-topbar z-10 mb-5.5 flex flex-col mx-4">`
    + `<div role="group" aria-label="Vista y etiquetas" data-filter-row="top"`
    + ` class="flex h-12 min-w-0 items-center overscroll-x-contain px-3 py-2 gap-1.5 overflow-visible">`
    + `<div data-catalog-scroll=""><div role="group" aria-label="Vista" data-catalog-views="">${viewHtml}`
    + `<span data-entity-sep="" aria-hidden="true"></span></div>`
    + `<div data-catalog-tags=""><span data-catalog-placeholder="tag" aria-hidden="true">`
    + '<span></span>'.repeat(EMPTY_SLOTS) + `</span></div></div></div>`
    + `<div data-filter-row="bottom" aria-busy="true" class="flex min-w-0 items-center gap-3 px-3 py-2 min-h-12">`
    + `<span data-catalog-summary=""><span data-catalog-readout=""><span data-skeleton="count" aria-hidden="true"`
    + ` class="relative inline-block h-3.5 w-37.5 rounded-md align-middle skeleton-sheen"></span></span>${islandShortcutsEntry()}</span>`
    + (head ? filterControlsSkeletonHtml(head.sorts, head.layout) : '')
    + `</div></div></div></div>`;
}
