/* 卡片CuadrículaEsperandoyFallo: 壳铺骨架怎么退场, 取数FalloDejaabajo什么. 馆藏卡片Cuadrículay垃圾ArchivoCola共用.  */
import { useEffect, useLayoutEffect, useRef, useState, type AnimationEvent, type MouseEvent } from 'react';
import { fitSkeleton, noteHtml } from '@peach/legacy/ui';

/** 骨架y它退场. 骨架eseuno层EnDatos到之posteriorOriginal地变成淡出层: 同uno元素, 同uno段 HTML, 
 *  React Nopesado写它, `fitSkeleton` 补齐ese几卡也还En. 骨架还没到显示门槛(`fitSkeleton`
 *  给它挂着 `.skeleton-awaiting`)就ya取完, 就直continuar撤掉, NoComo从no被ver见占播退场. 
 *
 *  `layer` 放En `[data-grid-reveal]` 容DispositivoNo.uno格, `fading` Como真时容Dispositivo带arribaeste属性.  */
export function useSkeletonReveal(pending: boolean, skeletonHtml: () => string) {
  const [phase, setPhase] = useState<'skeleton' | 'fade' | 'none'>(pending ? 'skeleton' : 'none');
  const [markup] = useState(() => (pending ? skeletonHtml() : ''));
  const node = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => { if (node.current) fitSkeleton(node.current) }, []);
  useLayoutEffect(() => {
    if (pending || phase !== 'skeleton') return;
    const seen = !!node.current && !node.current.querySelector('.skeleton-awaiting');
    setPhase(seen ? 'fade' : 'none');
  }, [pending]);
  /* 动画Terminar事件丢(EtiquetapáginaEnposterior, 元素被别动效continuar管)也要收掉, 同遗Deja层 1 秒兜底.  */
  useEffect(() => {
    if (phase !== 'fade') return undefined;
    const timer = setTimeout(() => setPhase('none'), 1000);
    return () => clearTimeout(timer);
  }, [phase]);
  const done = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setPhase('none');
  };
  const layer = phase === 'none' ? null : (
    <div ref={node} data-grid-fade={phase === 'fade' ? '' : undefined} aria-hidden={pending ? undefined : true}
      hidden={!pending && phase === 'skeleton'} onAnimationEnd={done}
      dangerouslySetInnerHTML={{ __html: markup }} />
  );
  return { layer, fading: phase === 'fade' };
}

/** FalloDejaEnOriginal, 给unoReintentar. Note 由遗Deja层 `noteHtml` 拼,  y 壳dentro别处FalloSugerenciaes同uno.  */
export function RetryNote({ message, onRetry }: { message: string; onRetry: () => void }) {
  const click = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-note-action]')) onRetry();
  };
  return (
    <div data-media-error="" onClick={click}
      dangerouslySetInnerHTML={{ __html: noteHtml(message, { variant: 'error', actionLabel: 'Reintentar' }) }} />
  );
}
