/* 吸顶ese玻璃esNoesya经贴到顶栏abajo沿. 贴住就En元素arriba标 `data-stuck`, 样表按它换成
 * 抬起来eseuno档影(`../styles.css`  `[data-filter-glass][data-stuck]`). 
 *
 * 判据照壳 `updateStickySurfaces`: página面滚过, 元素arriba沿到它自己 `top` ese线. 滚动y改
 * 尺寸各合成uno帧再量; 属性直continuar写En元素arriba, No走 React Estado—每uno帧滚动都pesado画Completo浮层Sin意义.  */
import { useEffect, type RefObject } from 'react';

export function useStuck(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const top = parseFloat(getComputedStyle(element).top);
      const stuck = window.scrollY > 0 && Number.isFinite(top)
        && element.getBoundingClientRect().top <= top + 1;
      element.toggleAttribute('data-stuck', stuck);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
    };
  }, [ref]);
}
