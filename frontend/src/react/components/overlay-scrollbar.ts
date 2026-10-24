/* 自己滚eseuno换成Todo站ese覆盖滚动. 
 *
 * 遗Deja层按名单批量挂es `wireOverlayScrollbars`, island 自己画 DOM NoEn它escanearRangodentro, 
 * 所以每会滚都得自己说uno声—否则eseuno露就es系统滚动: 占uno列ancho度, 配色跟着
 * 操作系统走,  y 站arriba别处ese 3px 浮动滑Noesuno东西.  */
import { useEffect, useRef } from 'react';

import { attachOverlayScrollbar } from '@peach/legacy/ui';

/** 会滚ese元素 ref. 轨道挂En它父元素arriba, 所以ese父元素要Solo裹着它uno, y且自己
 *  定(`relative`)—轨道按 `absolute right-0 top-2 bottom-2` 铺, 找错定祖先就会
 *  跑到Completopáginaderecha边缘去.  */
export function useOverlayScrollbar<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  /* 每次渲染都试uno次, No给依赖数组: `attachOverlayScrollbar` 自带"ya挂过"Etiqueta, 
     而esteuno常常escontenido到eseuno次渲染才出现En DOM dentro.  */
  useEffect(() => { attachOverlayScrollbar(ref.current) });
  return ref;
}
