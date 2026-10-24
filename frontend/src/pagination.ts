/** Board  Pagination(boardui.com `r/pagination.json`): Anteriorpágina/Siguientepáginaes 32px 次级pequeñoClave, página码es 32×32, 圆角 8 格, 
 * 当anteriorpágina借次级Clave面(primary 底, border-button 描边, xs 阴影), 其它página码SoloCon文字, Pasar el ratón才Con底; página数más时两侧折成"...", 
 * 当anteriorpáginaizquierdaderecha各Deja `sibling` 邻página. página码格No做过渡: 动Fondo y 阴影, 换página时Anterior当anteriorpágina会肉眼puede见地淡出.  */
export const DOTS = '...';

export function paginationRange(current: number, total: number, sibling = 1): (number | typeof DOTS)[] {
  const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
  // primeropágina + últimopágina + 当anteriorpágina + 两侧邻página + 两"..."都摆得abajo时就No折. 
  if (sibling * 2 + 5 >= total) return range(1, total);
  const left = Math.max(current - sibling, 1), right = Math.min(current + sibling, total);
  const leftDots = left > 2, rightDots = right < total - 2;
  if (!leftDots && rightDots) return [...range(1, 3 + 2 * sibling), DOTS, total];
  if (leftDots && !rightDots) return [1, DOTS, ...range(total - (2 + 2 * sibling), total)];
  return [1, DOTS, ...range(left, right), DOTS, total];
}

export function pageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}

export function clampPage(page: number, pages: number): number {
  return Math.min(Math.max(1, Math.floor(page) || 1), pages);
}

/** SoloConunopágina就什么都No画(arriba游 `totalPages <= 1` 返回 null). 点击由宿主continuar `[data-page]`.  */
export function paginationHtml(page: number, pages: number, label: string): string {
  if (pages <= 1) return '';
  const cells = paginationRange(page, pages).map(item => item === DOTS
    ? '<li class="ui-board-page-dots" aria-hidden="true">...</li>'
    : `<li><button type="button" class="ui-board-page" data-page="${item}" aria-label="No. ${item} página"${item === page ? ' aria-current="page"' : ''}>${item}</button></li>`).join('');
  return `<nav class="board-pagination" aria-label="${label}">
    <button type="button" class="geist-button" data-page="${page - 1}"${page <= 1 ? ' disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-chevron-left"></use></svg>Página anterior</button>
    <ul>${cells}</ul>
    <button type="button" class="geist-button" data-page="${page + 1}"${page >= pages ? ' disabled' : ''}>Página siguiente<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-chevron-right"></use></svg></button>
  </nav>`;
}
