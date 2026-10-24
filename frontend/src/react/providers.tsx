/* 每uno棵 React 根exterior面esetres层: 共享 QueryClient, Motion 减弱动效y弹出层容Dispositivo. 
 *
 * 路由树根(`router/router.tsx`)包esteuno, página面, página面interior组件y常驻组件(舞Eninterior)都画Eneste棵树dentro: 舞en la两座
 * Detalles y DirectorioCuadrícula读同uno缓存, 从Lista点进Detalles时卡片ya经En缓存dentro.  */
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { UNSAFE_PortalProvider } from 'react-aria';

import { queryClient } from './query';

/* Popover este类弹出层由 React Aria 渲染到挂载容Dispositivoexterior面. 落En `body` arriba就出 `.peach-react`
 * 作用域: token 读到es `board.css` 值, Preflight 也管No到. 所Con React 根弹出层都进
 * `body` último尾esteuno同样带 `.peach-react` 容Dispositivo.  */
let overlays: HTMLElement | null = null;
function overlayContainer(): HTMLElement {
  if (!overlays?.isConnected) {
    overlays = document.createElement('div');
    overlays.className = 'peach-react';
    overlays.dataset.reactOverlays = '';
    document.body.append(overlays);
  }
  return overlays;
}

/* 所Con React 根共用uno QueryClient(ADR-0031): página面级 `prefetch` 写进去primero屏, 
 * 组件挂arriba去就直continuar读到, 同unoDatosNo会因Como挂En哪棵根arriba而各取uno次. 
 *
 * EvilCharts 生largo动画由 Motion 逐帧驱动, `web/css/01-base.css` eseTodo局 reduced motion
 * ReglaSolo关得掉 CSS 过渡, 够No着它. `MotionConfig reducedMotion="user"` En根Anterior处continuar住: 
 * 系统设减弱动态效果, 每棵 React 根en la Motion 动画都按终态直continuar画.  */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <UNSAFE_PortalProvider getContainer={overlayContainer}>{children}</UNSAFE_PortalProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
