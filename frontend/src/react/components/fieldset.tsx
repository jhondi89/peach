/* Gestionar区ese"uno件要Enesteunopáginaarriba做事"卡: Introduce充底加uno描边, 16px 圆角, uno层continuar触阴影, 
 * 卡dentro分成正文 y uno放按钮página脚. 
 *
 * antiguo样表dentroDatosGestionarpáginacuatro(`.cleanupfieldset`, `[data-cleanup-processing]`, 
 * `.resourcesyncbox`)本来就es同uno副卡面(`web/board.css` 它们y进同unoRegla), SoloEn排法arriba
 * 分两档: 
 * - `split`: izquierdaDescripción, derecha按钮, 两列竖向居en proceso, 正文ypágina脚各 24px Relleno; 1000px 以abajo按钮落到Descripción
 *   abajo面, página脚靠izquierda, No再DejaarribaRelleno. 媒体修复, 空Archivocarpetay资源Sincronizar. 
 * - `stack`: 正文Enarriba, página脚Enabajo, 正文 `20px 20px 16px`, 最矮 120px; página脚esuno比卡面暗uno点点
 *   带子(`--board-card-foot`), arriba边uno线, `12px 20px`, 最矮 56px. escanearyRecolectar, Organizar y 链continuarGestionar. 
 *
 * 它 y  `../settings/section.tsx`  `Section` Noes同uno: eseunoesConfiguración弹层Agrupar, Sin描边, 
 * TítuloEn卡exterior; esteunoCon描边, Títuloes卡interior Title 2.  */
import type { ReactNode } from 'react';

import { cardClass } from './card';

type Layout = 'split' | 'stack';

const FACE = cardClass({ padding: 'none', bordered: 'line', className: 'overflow-hidden' });

const BODY: Record<Layout, string> = {
  split: 'min-w-0 p-6',
  stack: 'flex min-h-30 min-w-0 flex-1 flex-col px-5 pt-5 pb-4 max-cleanup-tight:min-h-0 max-cleanup-tight:p-4.5',
};

const FOOT: Record<Layout, string> = {
  split: 'flex flex-wrap items-center justify-end gap-2 self-stretch p-6'
    + ' max-[1001px]:justify-start max-[1001px]:pt-0',
  stack: 'flex min-h-14 flex-wrap items-center justify-end gap-2 border-t border-border-button-default'
    + ' bg-card-footer px-5 py-3 max-cleanup-tight:px-4.5',
};

/** Resultado面板底abajoese带子,  y  `stack` página脚同uno副几何; Color按语气另给.  */
const BAND = 'flex min-h-14 flex-wrap items-center justify-end gap-2 border-t px-5 py-3';
const BAND_TONE = {
  neutral: 'border-border-button-default bg-card-footer',
  error: 'border-border-error-default bg-background-tertiary-error',
};

/** 卡abajo面eseResultado面板: 同uno副Introduce充底, uno描边, 14px 圆角, No浮起. 
 *  链continuarVerificary资源Sincronizaruno趟posteriorTarea结论摆Enaquí, uno段uno段往abajo叠, 段间uno发丝线.  */
export const RESULT_PANEL = cardClass({
  padding: 'none', radius: 'surface', bordered: 'line', className: 'overflow-hidden',
});

/** Resultado面板en launo段: 16px Relleno, 除No.uno段exterior顶Anterior线.  */
export const RESULT_SECTION = 'border-t border-border-button-default p-4 first:border-t-0';

/** 面板底abajoese放按钮带子. `error` es"esteuno步删就回No来"eseuno档: 红线红底, izquierda边
 *  ese句Descripción也换成红字.  */
export function PanelFooter(
  { tone = 'neutral', status, children }:
  { tone?: 'neutral' | 'error'; status?: string; children: ReactNode },
) {
  return (
    <div className={`${BAND} ${BAND_TONE[tone]}`}>
      {status
        ? <p className={`mr-auto min-w-0 text-caption-1-regular ${tone === 'error' ? 'text-text-error-primary' : 'text-text-secondary'}`}>
            {status}
          </p>
        : null}
      {children}
    </div>
  );
}

/** 卡exterioreseuno行分区Título(链continuarGestionar, 资源Sincronizar), Title 2, yabajo面ese卡隔 16px. 
 *
 *  esteunopágina挂En `#stats` dentro, 遗Deja样表ese `.stats h2` 给所Condos级Título定 24px y 4px 底距. 
 *  它NoEn层dentro, 工具类压No过, 所以字形yMargen exterioreste两组带 `!`.  */
export function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return <h2 id={id} className="text-title-2-medium! m-0! text-text-primary">{children}</h2>;
}

/** 卡en laTítulo. `gap` es它 y abajo面eseuno段之间距离: Organizary空Archivocarpeta 12px, 链continuary资源Sincronizar 8px; 
 *  escanearyRecolectarese两正文本身esuno列 8px Espaciado, TítuloNo另Deja.  */
export function FieldsetTitle(
  { id, gap = 'none', children }: { id?: string; gap?: 'none' | 'small' | 'medium'; children: ReactNode },
) {
  const margin = gap === 'medium' ? 'mb-3' : gap === 'small' ? 'mb-2' : '';
  return <h3 id={id} className={`text-title-2-medium text-text-primary ${margin}`}>{children}</h3>;
}

export function Fieldset(
  { layout, label, labelledBy, id, footer, children, attributes }:
  {
    layout: Layout;
    /** Sinpuede见Títulopuede指时候(escanearyRecolectarese两TítuloEn正文eseuno列dentro)用它.  */
    label?: string;
    labelledBy?: string;
    id?: string;
    footer?: ReactNode;
    children: ReactNode;
    /** 冒烟yexterior观用例认卡 `data-*`. 类名给No: 生成出来名字会 y antiguo样表撞.  */
    attributes?: Record<`data-${string}`, string>;
  },
) {
  return (
    <section id={id} aria-label={label} aria-labelledby={labelledBy} {...attributes}
      className={`${FACE} ${layout === 'split' ? 'fieldset-split' : 'flex flex-col'}`}>
      <div className={BODY[layout]}>{children}</div>
      {footer ? <footer className={FOOT[layout]}>{footer}</footer> : null}
    </section>
  );
}
