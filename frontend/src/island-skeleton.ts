/* React página面y卡片primero屏骨架: 画En `.peach-react` dentro, 按Clave照 Board UI `Button` 渲染出静止态写. 
 *
 * 骨架跑En React 包Cargar之anterior, Solo能esuno段 HTML. 挂En `.peach-react` exterior面话, 卡面, 字色y按Clave
 * 取es遗Deja层ese套 token, continuar管时底色, Tamaño de fuente y 按Clave尺寸各跳uno档. 类名Solo取决定几何yColor
 * ese几项(`frontend/src/react/boardui/components/base/buttons/button.tsx`  size / variant /
 * icon / label cuatro表), Pasar el ratón, 按abajo, 焦点环Deja给continuar管posterior真按Clave.  */

import { esc } from '@peach/legacy/core';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'medium' | 'small';

const BASE = 'inline-flex items-center justify-center gap-0.5 whitespace-nowrap overflow-hidden font-sans';
const SIZE: Record<Size, string> = {
  medium: 'h-9 rounded-2lg p-2 text-body-medium',
  small: 'h-8 rounded-lg px-2 py-1.5 text-body-medium',
};
/* pequeño号纯Imagen标ClaveEn Board UI dentroes强制 32×32, Relleno归cero(`size-8 p-0`); en proceso号纯Imagen标沿用基础尺寸.  */
const ICON_ONLY: Record<Size, string> = { medium: SIZE.medium, small: 'size-8 rounded-lg p-0 text-body-medium' };
const ICON: Record<Size, string> = { medium: 'size-5 shrink-0', small: 'size-[18px] shrink-0' };
const LABEL: Record<Size, string> = {
  medium: 'inline-flex items-center justify-center px-1 shrink-0',
  small: 'inline-flex items-center justify-center px-0.5 shrink-0',
};
const VARIANT: Record<Variant, string> = {
  primary: 'bg-button-primary text-text-white shadow-xs',
  secondary: 'bg-background-primary-default text-text-primary border border-border-button-default shadow-xs',
  ghost: 'bg-button-ghost-background text-button-ghost-foreground',
};

/** 岛dentroSin遗Deja层ese给 Lucide 字形描边Todo局Regla, 描边跟 React ese侧uno样写En `svg` 自己身arriba.  */
export const islandGlyph = (name: string, cls: string): string =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#i-${name}"/></svg>`;

/** Favoritos入口Enpágina面Esperando阶段保DejaImagen标y尺寸, 交互由ya就绪página面continuar管.  */
export function islandShortcutsEntry(): string {
  return `<span data-shortcuts-entry class="inline-flex flex-none"><button type="button" data-shortcuts-trigger data-filter-action data-skeleton-action disabled tabindex="-1" aria-label="Mis favoritos" title="Mis favoritos" class="inline-grid size-7.5 flex-none place-items-center rounded-(--control-radius) border border-(--border-10) bg-(--surface) text-(--muted)">${islandGlyph('star', 'size-4')}</button></span>`;
}

/** y Board Input en proceso号exterior框, anterior缀 y 正文使用相同几何.  */
export function islandSearchInput(placeholder: string, value = '', label = placeholder): string {
  return `<div data-input-size="medium" class="group flex h-max w-full flex-col items-start gap-1"><div data-rac class="relative flex w-full items-center rounded-2lg bg-background-tertiary-default text-foreground-icon-tertiary ring-2 ring-inset ring-transparent p-2"><div class="flex w-full items-center gap-2 min-w-0"><div class="flex flex-1 items-center gap-0.5 min-w-0">${islandGlyph('search', 'size-5 shrink-0')}<input type="search" enterkeyhint="search" readonly tabindex="-1" aria-label="${esc(label)}" value="${esc(value)}" placeholder="${esc(placeholder)}" class="min-w-0 flex-1 bg-transparent border-0 outline-none p-0 m-0 font-sans text-body-regular text-text-primary pl-1 placeholder:text-text-tertiary"></div></div></div></div>`;
}

export interface IslandButton {
  variant?: Variant;
  size?: Size;
  glyph?: string;
  label?: string;
  /** 追加En `<button>` en laOriginal样属性, 例如 `aria-disabled`, `aria-pressed`, `aria-label`.  */
  attrs?: string;
  /** esteClave字Enestrecho工具行dentro收起, SoloDeja字形, 对应 React ese侧按工具行ancho度Cambiar `iconOnly`.  */
  compact?: boolean;
}

/** unoy Board UI `Button` 同尺寸, 同变体静止态按Clave. Con字没Imagen标, ConImagen标没字, 两者都Contres都按Original组件排.  */
export function islandButton(
  { variant = 'primary', size = 'medium', glyph, label, attrs = '', compact = false }: IslandButton,
): string {
  const shape = label ? SIZE[size] : ICON_ONLY[size];
  const icon = glyph ? islandGlyph(glyph, ICON[size]) : '';
  const text = label ? `<span class="${LABEL[size]}"${compact ? ' data-compact-label' : ''}>${label}</span>` : '';
  return `<button type="button" class="${BASE} ${shape} ${VARIANT[variant]}"${attrs ? ` ${attrs}` : ''}>${icon}${text}</button>`;
}

type SelectSize = 'md' | 'sm';
const SELECT: Record<SelectSize, { box: string; value: string; chevron: string }> = {
  md: { box: 'gap-1.5 px-2.5 py-2 text-body-medium', value: 'gap-[5px]', chevron: 'size-4' },
  sm: { box: 'gap-1 px-[7px] py-1 text-body-2-medium', value: 'gap-1', chevron: 'size-3.5' },
};

/** Board UI `Select` 静止态: exterior层 `group flex flex-col`, dentro面uno带 `aria-haspopup="listbox"`
 *  触发Clave. alto度由 `react/styles.css` 按esteEtiquetaUnificado补齐, 骨架用同uno元素 y Etiqueta才吃得到eseRegla. 
 *  `label` puede以esuno截etc.Datos占; `className` 落Enexterior层, y组件 `className` 同.  */
export function islandSelect(
  label: string, { size = 'md', className = '', attrs = '' }: { size?: SelectSize; className?: string; attrs?: string } = {},
): string {
  const shape = SELECT[size];
  return `<div class="group flex flex-col${className ? ` ${className}` : ''}"><button type="button" aria-haspopup="listbox"${attrs ? ` ${attrs}` : ''} class="flex w-full items-center justify-between rounded-2lg border border-border-button-default bg-background-primary-default shadow-xs text-text-primary ${shape.box}"><span class="flex min-w-0 items-center truncate ${shape.value}">${label}</span>${islandGlyph('chevron-down', `shrink-0 text-text-secondary ${shape.chevron}`)}</button></div>`;
}

/* 以abajo类名抄自 `react/components/collection-summary.tsx` Esperando态, 由用例逐字对照.  */
const SUMMARY_CLASS = 'flex items-end justify-between gap-4 rounded-surface bg-background-secondary-default px-6 py-5 '
  + 'max-compact:flex-col max-compact:items-start max-compact:gap-3 max-compact:p-4 dark:bg-background-primary-default';
const SUMMARY_TERMS = 'flex min-w-0 flex-col gap-2';
const SUMMARY_LABEL = 'text-body-regular text-text-secondary';
const SUMMARY_FIGURE = 'text-display-4-medium tabular-nums text-text-primary';
const SUMMARY_PENDING = 'relative inline-block h-8 w-24 rounded-2lg align-middle skeleton-sheen';

/** `CollectionSummary` 带 `flush`, etc.Datos时eseuno版: 名目此刻就Con, grande数eseuno格es微光占.  */
export function islandSummary(label: string): string {
  return `<div data-collection-summary="" class="${SUMMARY_CLASS}"><div class="${SUMMARY_TERMS}">`
    + `<span class="${SUMMARY_LABEL}">${label}</span>`
    + `<strong class="${SUMMARY_FIGURE}"><span data-skeleton="count" aria-hidden="true" class="${SUMMARY_PENDING}"></span></strong>`
    + `</div></div>`;
}
