/* 读数卡: unoImagen标配uno名字, unogrande数, uno脚注. 
 *
 * antiguo `.metricstrip>button` y `.tastesummary` es同uno卡, Estadísticaspágina让它兼做página签, 口味páginaSolo读. 
 * tres段各Con各Relleno, 脚注贴着卡底, 比卡面暗uno点点, 所以卡片自己NoDejaRelleno, 
 * 由tres段分别排(`padding:16px 0 0`, `0 16px`, `12px 16px 16px`, `10px 16px`). 
 *
 * Imagen标底色按卡片Enuno排en la次换, cuatro卡cuatroColor; antiguo值escuatro字面色, aquí取Imagen表色 token
 * dentro最continuar近cuatro档(蓝, 紫, 绿, 黄), 差异登记En `../boardui/ORIGIN.md`.  */
import type { ReactNode } from 'react';

import { cardClass, type CardOptions } from './card';
import type { Glyph } from './sprite-glyph';

/* Imagen标esepequeño方居en proceso用 flex No用 grid: `grid` yantiguo样表同名, 按 `../styles.css` 顶en la
 * `@source not inline(...)` No生成este工具类.  */

/** uno排cuatro卡Imagen标色. No.cinco起循环, antiguo样表也Solo定到No.cuatro.  */
const ACCENT = ['text-chart-6', 'text-chart-5', 'text-chart-7', 'text-chart-8'];
const ACCENT_TINT = ['bg-chart-6/10', 'bg-chart-5/10', 'bg-chart-7/10', 'bg-chart-8/10'];

/** 读数卡卡面. 宿主puede能es `<div>` 也puede能es React Aria  `Tab`, 所以Solo给类名.  */
export function statCardClass(options: CardOptions = {}) {
  return `${cardClass({ ...options, padding: 'none' })} flex flex-col overflow-hidden pt-4 text-left`;
}

/** uno排读数卡: cuatrouno排, estrecho屏折成两uno排. 宿主puede能es `TabList`, 所以类名也单独给uno.  */
export const STAT_STRIP = 'inline-grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4';

/** uno排seis读数卡: ancho屏uno排, en procesoetc.ancho度tresuno排, estrecho屏两uno排. 关注Gestionar顶arribaeseuno排escuatro关注
 *  读数加两 JAV 订阅读数; 放进cuatro列eseuno档会折成cuatro加dos, posterior两孤cerocero挂EnNo.dos行.  */
export const STAT_STRIP_SIX = 'inline-grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6';

/** 净面读数卡卡面: DatosGestionar顶arribaeseuno排入口y资源SincronizarResultado.  y arriba面eseuno档Noes同uno卡—
 *  antiguo `.board-plain-stat` Sin脚注带, Sin阴影, Relleno落En卡片自己身arriba(16px, tres段之间
 *  8px), Imagen标esuno格白底, 读数abajo面ese行脚注estres级灰pequeño字.  */
export function plainStatClass({ interactive = false }: { interactive?: boolean } = {}) {
  return cardClass({ padding: 'none', radius: 'plain', interactive,
    className: 'flex min-h-33 flex-col gap-2 p-4 text-left' });
}

/** uno排cinco净面读数卡: estrechouno档两uno排, TeléfonoAnterioruno排(遗Deja骨架 `.ui-cleanupstats`  1119/559 两档).  */
export const PLAIN_STAT_STRIP = 'inline-grid w-full grid-cols-5 gap-4 max-plain-stat-pair:grid-cols-2'
  + ' max-plain-stat-single:grid-cols-1';

export function PlainStat(
  { label, icon: Icon, mark, aside, figure, meta, wrapMeta = false }:
  {
    label: string; icon?: Glyph; mark?: ReactNode; aside?: ReactNode;
    figure: string; meta?: string; wrapMeta?: boolean;
  },
) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-2 text-body-medium text-text-secondary">
        {Icon || mark ? (
          <i aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background-primary-default text-text-primary">
            {Icon ? <Icon aria-hidden className="size-4" /> : mark}
          </i>
        ) : null}
        <span className="min-w-0 truncate">{label}</span>
        {aside ? <span className="ml-auto shrink-0 text-caption-1-regular">{aside}</span> : null}
      </span>
      <strong className="block text-title-1-medium tabular-nums text-text-primary">{figure}</strong>
      <span className={`block min-h-4 text-caption-1-regular text-text-tertiary ${wrapMeta ? '' : 'truncate'}`}>
        {meta}
      </span>
    </>
  );
}

export function StatCard(
  { label, icon: Icon, accent = 0, figure, footer }:
  { label: string; icon?: Glyph; accent?: number; figure: string; footer?: ReactNode },
) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-2 px-4 text-body-regular text-text-secondary max-sm:gap-1.5 max-sm:px-3">
        {Icon ? (
          <i aria-hidden className={`flex size-7 shrink-0 items-center justify-center rounded-lg max-sm:size-6 ${ACCENT[accent % 4]} ${ACCENT_TINT[accent % 4]}`}>
            <Icon aria-hidden className="size-4" />
          </i>
        ) : null}
        <span className="min-w-0 truncate">{label}</span>
      </span>
      {/* estrecho屏两uno排时卡SoloConunociencuatrodiez来像素, 读数降uno档Tamaño de fuente; nueve数再放Noabajo就折行, No截掉开头几.  */}
      <b className="px-4 pt-3 pb-4 text-title-1-medium tabular-nums text-text-primary wrap-anywhere max-sm:px-3 max-sm:pb-3 max-sm:text-title-3-medium">
        {figure}
      </b>
      {/* 脚注压En卡底: 卡片被邻居撑alto时空出来eseDeja给读数arriba方, 脚注No跟着飘.  */}
      <small className="mt-auto block min-h-9.5 bg-card-footer px-4 py-2.5 text-caption-1-regular text-text-secondary max-sm:px-3 max-sm:py-2">
        {footer}
      </small>
    </>
  );
}
