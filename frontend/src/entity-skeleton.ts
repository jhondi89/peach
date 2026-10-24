/** 实体资料Esperando态使用资料头, Etiqueta y 对应正文Diseño. 
 *
 * Filtrar y Obras抬头Enesteunopáginaes同uno浮层arribaabajo两格(`entity-filter` 岛), Esperando态也得es
 * uno: este两各自都带着玻璃材质 y  22px 圆角, No套进exterior框就被当成两Independiente浮层画出来, 
 * en proceso间uno道缝, cuatro角各uno道弧. 骨架esuno段字符串, 所以自己exterior框 y 两槽Etiqueta写Todo, 
 * 几何y岛浮层unouno对齐, continuar管时No跳. 
 */
export function entitySkeletonHtml(kind: string, head: string, body: string, top = '') {
  const square = kind === 'studio' || kind === 'agency';
  return `<section data-skeleton="entity/${kind}" role="status" aria-label="CargandoDetalles">
    <span class="sr-only">CargandoDetalles</span><div aria-hidden="true"><div class="peach-react contents">
    <section class="entityhero" data-entity-card><div class="entityprofile" data-entity-profile><div data-entity-portrait-wrap><div class="entityportrait ${square ? 'square ' : ''}skeleton" data-entity-portrait="${square ? 'square' : 'round'}"></div></div>
      <div class="ui-entityidentity entityskeletontext" data-entity-identity><div class="entitytitle" data-entity-title><h2 class="skeleton">&nbsp;</h2></div>
      <div class="alias" data-entity-alias><span class="skeleton"></span></div>
      <div class="entitylinks" data-entity-links><span class="skeleton"></span></div></div></div></section>
    <div class="board-filter-frame sticky top-topbar z-10 mb-5.5 flex flex-col" data-filter-frame data-filter-glass data-glass-pane data-entity-filter-glass>
      <section class="flex h-12 min-w-0 items-center overscroll-x-contain px-3 py-2 gap-1.5 overflow-visible" data-filter-row="top">${top}<div data-entity-tags data-skeleton-tier="pill"></div>${top ? '</div>' : ''}</section>
      ${head}</div></div>
    <div class="entitysection">${body}</div></div></section>`;
}
