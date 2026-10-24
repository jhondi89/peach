/* Todo站 Toast: Sonner 栈, 挂En `#toasts`(body 直abajo, 遗Deja层Completopáginapesado画冲No掉). 
 *
 * 遗Deja壳 `toast()` y各 island 拿到 `toast` prop 最posterior都落到 `showToast`. 堆叠, Pasar el ratón展开, 
 * 滑动CerraryPasar el ratónPausar计时照 Sonner; 面, 线, 圆角, 阴影取 Board 浮层eseuno套, 写En
 * `web/css/17-overlay.css`  `#toasts` uno节. 宿主No带 `.peach-react`: eseuno层 Preflight 会
 * Sonner 自己按钮样清掉, 而aquí用到 Board token 本来就挂En `:root` arriba.  */
import type { CSSProperties } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Toaster, toast } from 'sonner';

import type * as Bundle from './bundle';
import { Providers } from './providers';

/* Éxitoeseuno勾自己画出来(`src/ui-kit/motion.css`  `[data-toast-glyph=draw]`), Falloeseuno
   No画: Error要es立刻ver清. 字形由遗Deja层 `icon()` 给,  y Todo站其余Imagen标同uno套描边件.  */
const glyph = (html: string, draw: boolean) => (
  <span data-toast-glyph={draw ? 'draw' : 'still'} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
);

let mounted: { host: Element; root: Root } | null = null;
/* Agent Progress  rounded-2xl exterior框, 沿用现Conmedio径 token y限定En通知栈interior.  */
const FRAME = { '--floating-radius': 'var(--radius-2xl)' } as CSSProperties;

/** 应用Desinstalar时撤abajo Sonner 订阅y计时; 同uno宿主之posteriorpuedepesadoNuevo挂载.  */
export function unmountToaster(): void {
  const current = mounted;
  mounted = null;
  current?.root.unmount();
}

export const mountToaster: typeof Bundle.mountToaster = (host, icons) => {
  if (mounted?.host === host) return;
  unmountToaster();
  const root = createRoot(host);
  mounted = { host, root };
  /* 底边读 `--toast-bottom`: Tutorial卡Enderechaabajo角时, 遗Deja层它写成卡arriba沿之en laUbicación; 没写就es
     Sonner PredeterminadoMargen. 栈Comolargo回执Deja出空间, 每回执ancho度由contenido决定.  */
  root.render(
    <Providers><Toaster id="receipts" position="bottom-right" closeButton gap={8}
      style={{ ...FRAME, '--width': 'min(560px, calc(100vw - 48px))' } as CSSProperties}
      offset={{ right: 24, bottom: 'calc(var(--toast-bottom, 24px) + var(--processing-toast-space, 0px))' }}
      mobileOffset={{ right: 16, left: 16, bottom: 'calc(var(--toast-bottom, 16px) + var(--processing-toast-space, 0px))' }}
      toastOptions={{ closeButtonAriaLabel: 'DesactivarSugerencia' }} containerAriaLabel="Notificación"
      icons={{ success: glyph(icons.success, true), error: glyph(icons.error, false) }} />
      <Toaster id="processing" position="bottom-right" gap={8} expand
        style={{ ...FRAME, '--width': 'min(400px, calc(100vw - 32px))' } as CSSProperties}
        offset={{ right: 24, bottom: 'var(--toast-bottom, 24px)' }}
        mobileOffset={{ right: 16, left: 16, bottom: 'var(--toast-bottom, 16px)' }}
        toastOptions={{ closeButtonAriaLabel: 'DesactivarTareaSugerencia' }} containerAriaLabel="Tareas en segundo plano" />
    </Providers>,
  );
};

/* 同uno `id` 再调uno次就es改写eseuno: DeshacerResultado写回Original回执, No另起uno, 底部对齐栈dentro
   No会uno进uno出地跳uno格. 改写时 `action` 显给成 `undefined`, Sonner 按 id 合y, No写esteuno项
   antiguo"Deshacer"Clave会DejaEn"yaDeshacer"旁边.  */
/** 没给Duración或给非正数时停DejaTiempo, 同遗Deja壳 `toast()` Predeterminado值. 要常驻就显传 `Infinity`.  */
const DEFAULT_TIMEOUT = 6000;

export const showToast: typeof Bundle.showToast = (id, request) => {
  /* Sin字回执Soloesuno空白, No弹.  */
  if (!String(request.html ?? '').trim()) return;
  const show = request.alert ? toast.error : toast.success;
  const action = request.action;
  show(<span dangerouslySetInnerHTML={{ __html: request.html }} />, {
    id,
    toasterId: 'receipts',
    duration: request.timeout > 0 ? request.timeout : DEFAULT_TIMEOUT,
    action: action ? {
      label: action.label,
      // 点No关: Resultado要写回esteuno. 关掉它es随posteriorese次改写计时. 
      onClick: (event) => { event.preventDefault(); action.run(event.currentTarget) },
    } : undefined,
  });
};
