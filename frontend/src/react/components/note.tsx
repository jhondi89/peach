/* 字段, 分区, página面旁持久Sugerencia. Configuraciónpáginay活动página共用esteuno. 
 *
 * Registrarse表dentroSin行interior Note: `notification` Entradaes带CerrarClave y 计时浮动通知. aquí按语气取
 * `status-*` y `notification-*` token 组合, 差异登记En `../boardui/ORIGIN.md`.  */
import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

/** SinContraseña, GuardarFallo, DatosBiblioteca缺表este类es当anteriorEstado, No y 字段Descripción共用灰色pequeño字. 
 *
 *  `action` esesteSugerencia要人当场做ese件事, ancho容Dispositivointeriory结论y排; estrecho容Dispositivo或 below Diseño独占Siguiente行. 
 *  `extra` 收结论以exterior东西(折叠起来问题清单): 它们讲es
 *  同uno件事, 摆到 Note exterior面就成uno句话加unoNo知道属于谁contenido. 
 *  正文es段落, 塞No进este些级contenido.  */
export function Note(
  { tone, title, action, extra, children, actionLayout = 'inline', className }:
  { tone: Tone; title?: string; action?: ReactNode; extra?: ReactNode; children: ReactNode; actionLayout?: 'inline' | 'below'; className?: string },
) {
  const content = (
    <>
      {/* estrecho屏放Noabajo时按钮换到Siguiente行: 挤成两字uno行按钮比换行更难认.  */}
      <div data-note-layout="" className={cx('flex flex-col items-start gap-3',
        actionLayout === 'inline' && '@xl:flex-row @xl:items-center @xl:justify-between')}>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 self-stretch">
          {/* 正文常es服务端Original话: largo URL, Pila y más行Original因照Original样换行, No撑ancho所En卡.  */}
          {title ? <p className="text-body-medium wrap-anywhere">{title}</p> : null}
          <p className="whitespace-pre-line text-body-2-regular wrap-anywhere">{children}</p>
        </div>
        {action ? <div data-note-action="" className="max-w-full">{action}</div> : null}
      </div>
      {extra}
    </>
  );
  switch (tone) {
    case 'info':
      return <div role="status" className={cx('@container flex flex-col gap-2 rounded-2lg bg-notification-information-background px-3 py-2 text-notification-information-foreground', className)}>{content}</div>;
    case 'success':
      return <div role="status" className={cx('@container flex flex-col gap-2 rounded-2lg bg-notification-success-background px-3 py-2 text-notification-success-foreground', className)}>{content}</div>;
    case 'warning':
      return <div role="note" className={cx('@container flex flex-col gap-2 rounded-2lg bg-status-yellow-background px-3 py-2 text-status-yellow-text', className)}>{content}</div>;
    case 'error':
      return <div role="alert" className={cx('@container flex flex-col gap-2 rounded-2lg bg-background-tertiary-error px-3 py-2 text-text-error-primary', className)}>{content}</div>;
    default:
      return <div role="note" className={cx('@container flex flex-col gap-2 rounded-2lg bg-background-tertiary-default px-3 py-2 text-text-secondary', className)}>{content}</div>;
  }
}
