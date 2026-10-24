/* SinDatos或Resultado时空态: Imagen标, Título, Descripción同处uno组件dentro(`peach-web-ui`). 
 *
 * Registrarse表dentroSin空态Entrada. Títuloes真Título元素, 冒烟用例按它认página面主体: uno片白 y "画出来, 
 * SoloesSincontenido"En别断言abajolargo得uno模uno样. 根en la `data-empty-state` es给冒烟yexterior观用例认
 * 钩子, No参y样. 
 *
 * exterior壳按它落En哪dentro选, No按"哪bienver"选: 卡en la空态自己No再画uno层框.  */
import type { ComponentType, ReactNode } from 'react';

type Glyph = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;

/* 卡片en la空态No描边: exterior面ese卡ya经esuno框, 再套uno层就es框en proceso框. 
 * - `page`: Completo屏就它uno, 自己收uno边, 同遗Deja层 `.ui-emptystate`(`frontend/src/ui-kit/markup.css`): 
 *   沉uno档底色, 浮层圆角, 至menos 320px alto, contenido竖向居en proceso; Imagen标装进 54px 描边方框. 
 * - `plain`: 落Enuno卡或uno面板dentro, SoloDejaRelleno, 同antiguo `.insightempty{padding:16px}`. 
 * - `inset`: 占住卡dentroImagen区ese地方, 沉uno档底色, 读起来仍es"aquí本该Con东西".  */
const SHELL = {
  page: 'min-h-80 justify-center rounded-floating border border-separator-border bg-background-secondary-default px-6 py-12',
  plain: 'px-6 py-12',
  inset: 'min-h-40 justify-center rounded-xl bg-background-secondary-default px-4 py-4',
} as const;

export function EmptyState(
  { icon: Icon, title, actions, children, shell = 'page' }:
  { icon: Glyph; title: string; actions?: ReactNode; children: ReactNode;
    shell?: keyof typeof SHELL },
) {
  const page = shell === 'page';
  return (
    <div data-empty-state="" className={`flex flex-col items-center gap-2 text-center ${SHELL[shell]}`}>
      {/* Imagen标盒子SoloEnCompletopáginaeseuno档: 描边取主文字色 15%, 同antiguo `--border-15`, BoardUI Sinesteuno档透明描边.  */}
      {page
        ? (
          <span aria-hidden className="mb-2 flex size-empty-glyph items-center justify-center rounded-floating border border-text-primary/15 p-2.5 text-text-secondary">
            <Icon aria-hidden className="size-8" />
          </span>
        )
        : <Icon aria-hidden className="size-6 text-text-tertiary" />}
      <h3 className={`${page ? 'text-body-semibold' : 'text-headline-medium'} text-text-primary`}>{title}</h3>
      <p className={`${page ? 'max-w-empty-copy leading-empty-copy' : 'max-w-prose'} text-body-2-regular text-text-secondary`}>{children}</p>
      {/* 去处属于esteuno, No摆到框exterior面: "还Sincontenido" y unoNo知道属于谁按钮分开放时, 
          读者要先两样东西连起来才知道按abajo去做什么.  */}
      {actions ? <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}
