/* uno排"你En哪儿"Claveabajo面ese滑动玻璃(React esteuno侧; primeropáginay关注páginaese几排归壳 `GLIDE_ROWS`). 
 *
 * 玻璃esuno常驻节点: 由组件画En浮层根arriba, Solo建uno次, 换Filtrar, 换视Imagen都Solo挪它, Nopesado建—换
 * 元素, 动画就从头起跑, ver到Soloes瞬移. 移y抻largo交给遗Deja层 `moveGlidePane`, Todo站SoloConesteuno
 * 动法; aquíSolo管"此刻落En哪unoarriba": 
 *
 * - 按abajo去立刻滑到eseuno(壳当场推Nuevo按abajo态, aquí跟着 `pressed` 变); 
 * - Pasar el ratón时滑到指针abajoeseuno, 离开esteuno排回到按abajoeseuno(触摸No跟); 
 * - esteuno排横滚或窗口改尺寸时Solopesado量, No动画; 
 * - esteuno排量No出ancho度(被 `hidden` 收起, 祖先 `display:none`)或目标滚出puede视区, 玻璃收起. 
 *
 * 坐标以浮层根(玻璃父元素)ComoOriginal点, 扣掉en proceso间每uno层滚动量, 同壳 `viewGlideGeometry`: 
 * 玻璃住En滚动层exterior面, 纵向回弹No会被横滚容Dispositivo切平. 
 *
 * Predeterminadoesuno排横着Clave; `axis: 'y'` 给竖着uno列(侧栏导航): 移回弹换到纵轴, 滚出puede视区
 * 判据也换成纵向.  */
import { useCallback, useEffect, useLayoutEffect, useRef, type PointerEvent, type RefObject } from 'react';
import { moveGlidePane } from '@peach/legacy/ui';

interface Box { x: number; y: number; w: number; h: number }

type Axis = 'x' | 'y';

const sameBox = (first: Box, second: Box) =>
  (['x', 'y', 'w', 'h'] as const).every((side) => first[side] === second[side]);

function geometry(pill: HTMLElement, host: HTMLElement, axis: Axis): Box | null {
  if (!host.contains(pill)) return null;
  let x = 0;
  let y = 0;
  for (let node: HTMLElement | null = pill; node && node !== host; node = node.offsetParent as HTMLElement | null) {
    x += node.offsetLeft;
    y += node.offsetTop;
  }
  const rect = pill.getBoundingClientRect();
  for (let node = pill.parentElement; node && node !== host; node = node.parentElement) {
    x -= node.scrollLeft;
    y -= node.scrollTop;
    const viewport = () => node.getBoundingClientRect();
    if (axis === 'x' && node.scrollWidth > node.clientWidth && getComputedStyle(node).overflowX !== 'visible') {
      const edge = viewport();
      if (rect.right <= edge.left || rect.left >= edge.right) return null;
    }
    if (axis === 'y' && node.scrollHeight > node.clientHeight && getComputedStyle(node).overflowY !== 'visible') {
      const edge = viewport();
      if (rect.bottom <= edge.top || rect.top >= edge.bottom) return null;
    }
  }
  return { x, y, w: pill.offsetWidth, h: pill.offsetHeight };
}

/** `pane` es玻璃节点, `row` esesteuno排; `pressed` esesteuno排dentro按abajoeseunoSeleccionarDispositivo. `key` 变
 *  (按abajo态换, esteuno排出现或收起)就带动画落到Nuevo按abajo项arriba. 返回两ProcesarDispositivocontinuarEnClavey排arriba; 
 *  `sync` 给esteuno排自己知道Diseño变化(宿主改尺寸, arriba方插进别东西): 掐掉En跑移, Original地pesado量.  */
export function useViewGlide(
  pane: RefObject<HTMLElement | null>, row: RefObject<HTMLElement | null>, pressed: string, key: unknown,
  { axis = 'x' }: { axis?: Axis } = {},
) {
  const last = useRef<Box | null>(null);
  const place = useCallback((target: HTMLElement | null, animate: boolean) => {
    const glass = pane.current;
    const line = row.current;
    /* 玻璃es浮层根直continuar子元素, 根es吸顶定, 所以根就es它定基准. No读 `offsetParent`: 
       收起着玻璃eseuno项es null.  */
    const host = glass?.parentElement;
    if (!glass) return;
    const active = line && line.offsetWidth ? target ?? line.querySelector<HTMLElement>(pressed) : null;
    const box = active && host ? geometry(active, host, axis) : null;
    if (!box || !box.w || !box.h) {
      glass.getAnimations().forEach((animation) => animation.cancel());
      glass.hidden = true;
      last.current = null;
      return;
    }
    /* 从收起到出现esNo.uno次落, No从Anterior次antiguo坐标飞进来.  */
    const from = glass.hidden ? null : last.current;
    glass.hidden = false;
    last.current = box;
    /* 同uno落点En切página取数时puedeRepetirarriba报, 保Deja它En cursoCompletado移.  */
    if (animate && from && sameBox(from, box)) return;
    moveGlidePane(glass, animate ? from : null, box, axis);
  }, [pane, row, pressed, axis]);

  /* primero次落No动画; 往posterior按abajo态uno变就滑过去. 放EnDiseño阶段: 画出来No.uno帧玻璃就Enarriba.  */
  const placed = useRef(false);
  useLayoutEffect(() => {
    const glass = pane.current;
    if (glass && !placed.current) glass.hidden = true;
    place(null, placed.current);
    placed.current = true;
  }, [place, key]);

  /* 横滚, 改尺寸Solopesado量. 滚动事件No冒泡, 所以En浮层根arriba按捕obtener阶段continuar住esteuno排dentro任何uno层滚动.  */
  useEffect(() => {
    const host = pane.current?.parentElement;
    let frame = 0;
    const remeasure = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; place(null, false) });
    };
    host?.addEventListener('scroll', remeasure, { capture: true, passive: true });
    addEventListener('resize', remeasure, { passive: true });
    /* 浮层puede以随página面收起, 也puede以En取数posterior补进另uno组Controles. 尺寸Restaurary相邻组变ancho都会改变落点.  */
    const observer = new ResizeObserver(() => {
      const line = row.current;
      const active = line?.offsetWidth ? line.querySelector<HTMLElement>(pressed) : null;
      const box = active && host ? geometry(active, host, axis) : null;
      const previous = last.current;
      if (!box || !previous || !sameBox(box, previous)) {
        remeasure();
      }
    });
    const line = row.current;
    if (line && host) {
      observer.observe(line);
      for (let node = line.parentElement; node; node = node.parentElement) {
        observer.observe(node);
        for (const child of node.children) {
          if (!child.hasAttribute('data-view-glide')) observer.observe(child);
        }
        if (node === host) break;
      }
    }
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      host?.removeEventListener('scroll', remeasure, { capture: true });
      removeEventListener('resize', remeasure);
    };
  }, [pane, row, place, key]);

  const hover = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch') place(event.currentTarget, true);
  }, [place]);
  const leave = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch') place(null, true);
  }, [place]);
  const sync = useCallback(() => {
    pane.current?.getAnimations().forEach((animation) => animation.cancel());
    place(null, false);
  }, [pane, place]);
  return { hover, leave, sync };
}
