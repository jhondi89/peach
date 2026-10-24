/* 分段Controles选en proceso面IndependienteMover, 文字, 焦点y业务Estado即时Actualizar.  */
import { RadioGroup, TabList, type RadioGroupProps, type TabListProps } from 'react-aria-components';
import { useMovingSurface } from './use-moving-surface';
import { useHorizontalScroller } from './use-horizontal-scroller';

export function SegmentedTabList<T extends object>(props: TabListProps<T>) {
  const ref = useHorizontalScroller(useMovingSurface('selection'));
  return <TabList {...props} ref={ref} />;
}

export function SegmentedRadioGroup(props: RadioGroupProps) {
  const ref = useHorizontalScroller(useMovingSurface('selection'));
  return <RadioGroup {...props} ref={ref} />;
}

/** 轨道. ancho度按contenido收, estrecho屏装Noabajo时自己横向滚, Nopágina面撑出滚动.  */
export const SEGMENTED_TRACK = 'inline-flex w-max max-w-full items-center gap-0.5 overflow-x-auto'
  + ' overscroll-x-contain rounded-2lg bg-background-tertiary-default p-1';

/* profundo色abajo选en proceso面用 `background-primary-hover`: profundo色 `background-primary-default` y轨道
 * (`background-tertiary-default`)es同uno档 neutral-800, 画arriba去verNo见.  */
/* Teléfonoancho度每格izquierdaderecha各收 2px: cuatroen proceso文página签En 320 ancho轨道dentro刚bien排abajo, No被轨道裁掉último字.  */
export const SEGMENT = 'flex min-h-7 flex-none cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 max-sm:px-2'
  + ' text-body-medium whitespace-nowrap text-text-secondary outline-none transition-colors'
  + ' hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring'
  + ' data-focus-visible:ring-2 data-focus-visible:ring-border-focus-ring'
  + ' data-selected:bg-background-primary-default data-selected:text-text-primary data-selected:shadow-card'
  + ' dark:data-selected:bg-background-primary-hover';

/** `aria-selected` 而Noes `data-selected` 宿主(自己写 `<button role="tab">`)用esteuno串.  */
export const SEGMENT_ARIA = 'flex min-h-7 flex-none cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 max-sm:px-2'
  + ' text-body-medium whitespace-nowrap text-text-secondary outline-none transition-colors'
  + ' hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring'
  + ' aria-selected:bg-background-primary-default aria-selected:text-text-primary aria-selected:shadow-card'
  + ' dark:aria-selected:bg-background-primary-hover';

/** Solo摆字形eseuno档(版, grandeImagen/紧凑): 每格正方, 字形 16px, 配arriba面 `SEGMENTED_TRACK`.  */
export const SEGMENT_ICON = 'flex size-7 flex-none cursor-pointer items-center justify-center rounded-md'
  + ' text-text-secondary outline-none transition-colors'
  + ' hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring'
  + ' data-focus-visible:ring-2 data-focus-visible:ring-border-focus-ring'
  + ' data-selected:bg-background-primary-default data-selected:text-text-primary data-selected:shadow-card'
  + ' dark:data-selected:bg-background-primary-hover';

/* 玻璃浮层en laeseuno档. flat 面eseuno副(灰轨道衬unoNo透明白滑)摆到浮层arriba就esCompletodentro
 * 唯unouno实心面, 读起来像贴arriba去另unoControles: 轨道撤掉, 字色按este玻璃自己文字色降到
 * seis成, 选en procesoeseuno格换成浮层选en proceso态ese玻璃(`../styles.css`  `[data-glass-segment]`).  */
export const SEGMENTED_GLASS_TRACK = 'inline-flex w-max max-w-full flex-none items-center gap-0.5 rounded-lg';

export const SEGMENT_GLASS = 'relative flex size-7.5 flex-none cursor-pointer items-center justify-center rounded-lg'
  + ' text-(--glass-text)/62 outline-none transition-colors hover:text-(--glass-text)'
  + ' focus-visible:ring-2 focus-visible:ring-border-focus-ring data-selected:text-(--glass-text)';
