/* Gestionar区各página(连同ReproducirListapágina)Cargar态SoloConuno定义: 壳Enprofundo链冷启动时铺它, 路由树página面元素挂arriba时也铺它. 
 * 两处各写各时, CompletopáginaActualizar会连播两段动画: 先uno通用grandeDiseño骨架, 再各página自己Cargar态. 取同uno, 
 * `data-skeleton` Clave就相同, posterior铺eseuno处认出es同unoposteriorNo再pesado画(`paintManagementPlaceholder`). 
 *
 * 版照 `boardPageSkeleton` 画ese几página之exterior, DatosGestionar, 复核, 诊断yRecolectar来源各Conuno, 其余Ruta落到通用面板.  */
import { esc } from '@peach/legacy/core';
import { configurationSkeletonHtml, fitSkeleton, skeletonHtml } from '@peach/legacy/ui';

import { boardPageSkeleton } from './board-skeleton';
import { cleanupSkeletonHtml } from './management';
import { CONFIGURATION_SECTIONS } from './history/settings-route';

export interface PageSkeletonOptions {
  cards?: boolean;
  className?: string;
  variant?: string;
  count?: number;
  fill?: boolean;
  cardRatio?: number;
  gridClass?: string;
  gridSize?: string;
}

/** Completopágina骨架: `cards` 画卡片Cuadrícula, 否则Imagen板; Solo给几项交abajo去, 其余用 `skeletonHtml` 自己缺省.  */
export const pageSkeletonHtml = (
  label: string,
  { cards = false, className = '', variant = '', count, fill, cardRatio, gridClass = '', gridSize = '' }: PageSkeletonOptions = {},
): string => skeletonHtml(label, {
  variant: variant || (cards ? 'cards' : 'panel'), className, gridClass, gridSize,
  ...(count ? { count } : {}), ...(fill === undefined ? {} : { fill }), ...(cardRatio ? { cardRatio } : {}),
});

/* Categoría名es静态文案, 骨架直continuar写出来; 次序就espágina签次序, y复核páginaeseunouno致.  */
const REVIEW_LABELS = ['Campos de metadatos', 'Etiquetas de creador', 'Logo de sello', 'Avatar de actriz', 'Reasignación de identidad occidental', 'Directorio de códigos JAV en duda', 'Marcas de comentarios FC2', 'Similitudes entre códigos FC2', 'Evidencia de créditos/fuente'];
/* 复核páginaesizquierda边uno列Categoría, derecha边工具加uno格uno格 Fieldset, 骨架就用最终容Dispositivoese几类名, 
   分栏, 列ancho y 卡altoTodo由página面自己ese套Regla给: 读完DatosSoloes占换成contenido, 版面uno格No挪. 
   Categoría名 y "复核Categoría"este两样yDatosSin关, 直continuar写出来; etc.es每类másmenos, 所以SoloCon计数
   eseunoes占. 工具arribaesetres件—AgruparMétodo, CategoríaFiltrar, Seleccionar todo本página—要etc.Cola回来才知道
   Opciones y 数, tres占uno件对uno件.  */
const reviewSkeletonHtml = (label = 'Cargando复核Cola'): string => `<div class="review review-workspace review-skeleton" data-skeleton="review" aria-busy="true" aria-label="${esc(label)}">
  <div class="reviewcontrols" data-section-nav><h2 class="review-category-title">Clasificación de revisión</h2>
    <div class="reviewtabs" data-section-items>${REVIEW_LABELS.map((text, i) =>
      `<button type="button" disabled aria-selected="${i === 0}">${esc(text)}<span class="skeleton reviewcountskeleton" aria-hidden="true"></span></button>`).join('')}</div></div>
  <div class="reviewbulkbar reviewbulktoolbar" aria-hidden="true">${'<span class="skeleton reviewtoolskeleton"></span>'.repeat(3)}</div>
  <section class="reviewsection"><div class="reviewlist">${
    '<div class="skeletoncard" aria-hidden="true"><i></i><b></b><em></em></div>'.repeat(6)}</div></section></div>`;

const PLACEHOLDERS: Record<string, () => string> = {
  ...Object.fromEntries(Object.keys(CONFIGURATION_SECTIONS).map(key => [`/settings/${key}`, () => configurationSkeletonHtml()])),
  '/data-cleanup': () => cleanupSkeletonHtml(),
  // /resource-sync SoloesDatosGestionarpáginaen launo锚点, 占也该esDatosGestionarese. 
  '/resource-sync': () => cleanupSkeletonHtml(),
  '/review': () => reviewSkeletonHtml(),
  /* Recolectar来源es 812px estrecho列dentrouno叠同ancho Fieldset: unoalto清Portada加seis来源. 骨架画cuatro, 
     eseesprimero屏装得abajo数; Descripcióneseuno句es静态文案, yDatosSin关, 立刻显示.  */
  '/sources': () => `<div class="scraping-page"><p>Las imágenes HD pueden requerir proxy. Verifica la conexión primero.</p>
    ${pageSkeletonHtml('CargandoRecolectarFuente', { cards: true, count: 4, fill: false, className: 'cleanup-skeleton' })}</div>`,
};

/** 关注Gestionar骨架照esteExplorar dispositivoÚltima vez选视Imagen画, Ordenar框y方向Clave照地址栏en laeseuno档画: etc.Datoseste段Tiempo画成
 *  卡片, Datos到换成表格话, 同uno次进入dentro版会Completo翻uno遍.  */
export interface FollowSkeletonState {
  followLayout: string;
  followSort: string;
  followDir: string;
}

/** esteunopáginaCargar态 HTML.  */
export function managementSkeletonHtml(path: string, { followLayout, followSort, followDir }: FollowSkeletonState): string {
  return boardPageSkeleton(path, { followLayout, ...(path === '/subscriptions' ? { followSort, followDir } : {}) })
    || (PLACEHOLDERS[path] ?? (() => pageSkeletonHtml('Leyendo página')))();
}

/** 骨架Clave: 同unoClaveDescripciónes同uno, No必pesado画.  */
export const skeletonKeyOf = (html: string): string => String(html).match(/data-skeleton="([^"]*)"/)?.[1] || '';

/** Cargar态铺进容Dispositivo. 容Dispositivodentroya经es同uno骨架就No动: innerHTML 换Nuevo节点会 shimmer 从头放uno遍, 
 *  CompletopáginaActualizarver到就es同uno段动画闪两次.  */
export function paintManagementPlaceholder(container: HTMLElement, placeholder: string): void {
  const painted = container.querySelector<HTMLElement>('[data-skeleton]')?.dataset.skeleton || '';
  const next = skeletonKeyOf(placeholder);
  if (!next || next !== painted) {
    container.innerHTML = placeholder;
    fitSkeleton(container);
  }
}
