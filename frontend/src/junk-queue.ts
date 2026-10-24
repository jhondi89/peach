/* 垃圾ArchivoCola(`/junk-files`)路由y计数行骨架. 
 *
 * ver哪uno类, ver待判断还esyaExcluir, Todo由地址决定: Categoría链continuarespuedeprofundo链 `<a href>`, ActualizarposteriorOriginal样Restaurar. 
 * 壳(`Application`)y垃圾Colaeseunopágina读es同uno组函数, 所以放En island 层este边, No依赖 React. 
 *
 * 计数行骨架es壳En React 包Cargar之anterior铺eseuno版, 画En `.peach-react` dentro, 结构, `data-*` 钩子y
 * 类名 y página面etc.Datos时画出来eseuno版逐项相同(`junk-queue/junk-count.tsx`, 用例对照两者), 
 * 所以continuar管eseuno拍esteuno行No跳. Categoríay视Imagen此刻就Con答案, SoloCon读数 y 各类计数徽标要etc.Datos.  */
import { esc } from '@peach/legacy/core';

import { islandSummary } from './island-skeleton';

export type JunkView = 'pending' | 'dismissed';
export type JunkKind = '' | 'video' | 'image' | 'archive' | 'audio' | 'url' | 'other';

export interface JunkRoute { kind: JunkKind; view: JunkView }

/** Categoríaen la几项: Clave, Etiqueta, 雪碧Imagen字形. Clavey `/api/ads?kind=` 取值unouno对应.  */
export const JUNK_KIND_OPTIONS: readonly (readonly [JunkKind, string, string])[] = [
  ['', 'Todo', 'layout-grid'], ['video', 'Videos', 'play'], ['image', 'Imágenes', 'pics'],
  ['archive', 'Archivo comprimido', 'file-archive'], ['audio', 'Audio', 'file-audio'], ['url', 'URL', 'globe'],
  ['other', 'Otros', 'hard-drive'],
];

/** 认No出Categoríauno律落回"Todo".  */
export const cleanJunkKind = (value: string | null | undefined): JunkKind =>
  JUNK_KIND_OPTIONS.find(([key]) => key === value)?.[0] ?? '';

/** 地址Consulta串en laCategoríay视Imagen.  */
export function junkRoute(search: string): JunkRoute {
  const params = new URLSearchParams(search);
  return { kind: cleanJunkKind(params.get('type')), view: params.get('view') === 'dismissed' ? 'dismissed' : 'pending' };
}

/** 某uno类, 某uno视Imagen地址. Predeterminadoeseuno档(Todo, 待判断)No写进Consulta串.  */
export function junkPath(kind: JunkKind = '', view: JunkView = 'pending'): string {
  const params = new URLSearchParams();
  if (kind) params.set('type', kind);
  if (view === 'dismissed') params.set('view', 'dismissed');
  const query = params.toString();
  return `/junk-files${query ? `?${query}` : ''}`;
}

/** Categoríaúltimo尾eseuno项: 待判断时去"yaExcluir", yaExcluir时回"待判断".  */
export function junkViewLink(view: JunkView): { view: JunkView; label: string; glyph: string; href: string } {
  return view === 'dismissed'
    ? { view: 'pending', label: 'VolverPendiente判断', glyph: 'rotate-ccw', href: junkPath('', 'pending') }
    : { view: 'dismissed', label: 'Ya excluido', glyph: 'eye-off', href: junkPath('', 'dismissed') };
}

export const junkSummaryLabel = (view: JunkView) => (view === 'dismissed' ? 'Ya excluido' : 'Pendiente判断');

const glyph = (name: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${name}"></use></svg>`;

/** 壳En React 包Cargar之anterior铺计数行: 摘要面yCategoría, 读数y计数徽标Deja空. 滑动玻璃由 island
 *  量着放, esteuno版dentro它收着, 当anterioreseuno类自己垫uno同料玻璃(`junk-queue.css`).  */
export function junkCountSkeletonHtml({ kind, view }: JunkRoute): string {
  const links = JUNK_KIND_OPTIONS.map(([key, label, icon]) =>
    `<a href="${junkPath(key, view)}" data-junk-kind-link="${key}"${key === kind ? ' aria-current="page"' : ''}>${glyph(icon)}${esc(label)}</a>`).join('');
  const other = junkViewLink(view);
  return `<div class="peach-react" data-junk-count-skeleton=""><div data-junk-count="">`
    + `<div data-junk-summary="" aria-live="polite">${islandSummary(junkSummaryLabel(view))}</div>`
    + `<div data-junk-filters-frame="" data-filter-glass="" data-glass-pane=""><span data-view-glide="" aria-hidden="true" hidden></span>`
    + `<nav data-junk-filters="" aria-label="Clasificación de basura">${links}<i data-junk-divider="" aria-hidden="true"></i>`
    + `<a href="${other.href}" data-junk-view-link="${other.view}"${view === 'dismissed' ? ' aria-current="page"' : ''}>${glyph(other.glyph)}${other.label}</a>`
    + `</nav></div></div></div>`;
}
