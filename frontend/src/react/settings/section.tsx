/* Configuraciónpágina各分区共用组合件. 
 *
 * exterior框取 BoardUI Configuración弹层 `SettingsSectionLabel` + `SettingsCard`, 开关行直continuar用 `SettingsRow`. 
 * Registrarse表dentroSin折叠, 它用 BoardUI token 组合, 差异登记En `boardui/ORIGIN.md`. 
 * SugerenciayProgreso另Conpágina面共用uno, En `../components/`.  */
import { useId, useRef, useState } from 'react';
import type { ComponentType, FormEvent, MouseEvent, ReactNode } from 'react';
import { RiArrowRightSLine, RiExternalLinkLine } from '@remixicon/react';
import { setCollapseOpen } from '@peach/legacy/ui';

import { SettingsCard, SettingsSectionLabel } from '@/components/application/settings/settings-rows';
import { LinkButton } from '@/components/base/buttons/link-button';
import { cx } from '@/utils/cx';

interface SectionProps {
  title: string;
  icon?: ReactNode;
  id?: string;
  /** 跟着Título走次要contenido(来源站点exterior链). Título占剩abajoancho度, 它靠derecha.  */
  aside?: ReactNode;
  /** 给就画成表单: 回车提交, 提交Clave放En `Footer` dentro.  */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}

/* 分区en laDescripción, 报错y读数常带largo URL, Pila y Sin空格Ruta: Completo分区按 `overflow-wrap:anywhere`
   就地折断(属性会继承, 行interiorDescripción, Help y读数都跟着走), No卡片撑出横向滚动.  */
export function Section({ title, icon, id, aside, onSubmit, children }: SectionProps) {
  const label = icon ? <span className="inline-flex items-center gap-1.5">{icon}{title}</span> : title;
  const body = (
    <>
      {aside
        /* Título至menosDeja 10rem: 放Noabajo时exterior链换到Siguiente行, NoTítulo挤成uno字uno行.  */
        ? <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="min-w-40 flex-1"><SettingsSectionLabel>{label}</SettingsSectionLabel></div>
            <div className="flex min-w-0 max-w-full">{aside}</div>
          </div>
        : <SettingsSectionLabel>{label}</SettingsSectionLabel>}
      <SettingsCard>{children}</SettingsCard>
    </>
  );
  return onSubmit
    ? <form id={id} aria-label={title} noValidate onSubmit={onSubmit} className="flex w-full flex-col gap-2 wrap-anywhere">{body}</form>
    : <section id={id} aria-label={title} className="flex w-full flex-col gap-2 wrap-anywhere">{body}</section>;
}

/** uno组 `SettingsRow`. 行自己画abajo边线, 最posterioruno行No画, 所以要Conuno层Solo装行父元素.  */
export function Rows({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

/** 卡片Solo管izquierdaRelleno y 底色; Noes `SettingsRow` contenido由esteuno层给行距 y arribaabajoderechaRelleno. 
 *  排En `Rows` 或 `FactList` posterior面时 `divided`,  y arriba面ese组行之间补uno道分隔线.  */
export function Stack({ divided = false, children }: { divided?: boolean; children: ReactNode }) {
  return divided
    ? <div className="flex flex-col gap-4 border-t border-separator-border py-4 pr-3">{children}</div>
    : <div className="flex flex-col gap-4 py-4 pr-3">{children}</div>;
}

/** 底栏: izquierda边uno句说este按钮此刻意味着什么, derecha边es按钮. 
 *
 *  底色比卡面暗uno点点, 通到卡片izquierdaderecha两沿(antiguo `.geist-fieldset-footer`  `--board-card-foot`): 
 *  卡片izquierdaRellenoEn卡自己身arriba, 所以esteuno要它抵掉再自己补回来.  */
export function Footer({ status, children }: { status?: ReactNode; children?: ReactNode }) {
  return (
    <div className="-ml-3 flex flex-wrap items-center justify-end gap-3 rounded-b-2xl border-t border-separator-border bg-card-footer px-3 py-3">
      {status ? <div className="mr-auto min-w-0 text-body-2-regular text-text-secondary">{status}</div> : null}
      {children}
    </div>
  );
}

export function Help({ role, children }: { role?: 'status'; children: ReactNode }) {
  return <p role={role} className="text-body-2-regular text-text-secondary">{children}</p>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p role="alert" className="text-body-2-regular text-text-error-primary">{children}</p>;
}

/** 字段arriba方名字, exterior观同 BoardUI `Label`; Controles自己Sin障碍名称由 `aria-label` 给.  */
export function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="text-body-medium text-text-primary">{children}</p>;
}

/** Nuevo窗口Abrirexterior部链continuar, 尾部带exterior链字形. `rel` 两项都写: NuevoEtiquetapáginaNo继承esteunopágina会话, 
 *  来源地址也No带走 Peach 自己地址.  */
export function ExternalLink({ href, children, leadingIcon }: {
  href: string; children: ReactNode;
  leadingIcon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}) {
  return (
    <LinkButton href={href} target="_blank" rel="noopener noreferrer" size="small"
      leadingIcon={leadingIcon} trailingIcon={RiExternalLinkLine} className="min-w-0 max-w-full">
      <span className="min-w-0 whitespace-normal break-all">{children}</span>
    </LinkButton>
  );
}

/** Solo读名目y读数, uno行uno对, 行距y分隔线同 `SettingsRow`.  */
export function FactList({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col">{children}</dl>;
}

/* 名目按contenidoancho, 最más占unomedio, 再largo就En自己eseunomediodentro折行; 读数靠derecha, 折成más行时行interior文字izquierda对齐, 
   读起来esuno段话而Noesuno面derecha对齐字Muro.  */
export function Fact({ term, children }: { term: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 border-b border-separator-border py-2.5 pr-3 last:border-b-0">
      <dt className="flex max-w-1/2 min-w-0 shrink-0 items-center gap-2 text-body-regular text-text-secondary">{term}</dt>
      <dd className="flex min-w-0 flex-wrap items-center justify-end gap-2 text-left text-body-regular break-all text-text-primary">{children}</dd>
    </div>
  );
}

/** 展开正文. Original生 `details` 给Clave盘ySin障碍语义; 开合交给共用 Collapse  `setCollapseOpen`, 
 *  它给正文exterior层挂arriba `ui-kit/collapse.css`  `.ui-fcollapse` 让alto度过渡. Relleno放Endentro层, alto度才能收到 0.  */
export function Disclosure(
  { summary, defaultOpen = false, children, trailing = false, onOpenChange, contentClassName }:
  { summary: ReactNode; defaultOpen?: boolean; children: ReactNode; trailing?: boolean; onOpenChange?(open: boolean): void; contentClassName?: string },
) {
  const id = useId();
  const details = useRef<HTMLDetailsElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const primed = useRef(false);
  const [open, setOpen] = useState(defaultOpen);
  const toggle = (event: MouseEvent) => {
    event.preventDefault();
    if (!details.current || !body.current) return;
    setCollapseOpen(details.current, body.current, !open);
    setOpen(!open);
    onOpenChange?.(!open);
  };
  /* 展开uno次就交回给 `setCollapseOpen`: `open` 写成 React 受控属性话, 收起ese段
     过渡dentro它会被pesadoNuevo画成展开. aquíSoloEnNo.uno次挂arriba时初始Estado落到 DOM arriba.  */
  const attach = (node: HTMLDetailsElement | null) => {
    details.current = node;
    if (node && defaultOpen && !primed.current) {
      primed.current = true;
      node.open = true;
    }
  };
  return (
    <details ref={attach}>
      <summary aria-expanded={open} aria-controls={id} onClick={toggle}
        className={`${trailing ? 'w-full' : 'w-fit'} flex cursor-pointer list-none items-center gap-1 rounded-sm text-body-2-medium text-text-secondary outline-none select-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring`}>
        {!trailing ? <RiArrowRightSLine aria-hidden className={open ? 'size-4 shrink-0 rotate-90 transition-transform' : 'size-4 shrink-0 transition-transform'} /> : null}
        {summary}
        {trailing ? <RiArrowRightSLine aria-hidden className={open ? 'ml-auto size-4 shrink-0 -rotate-90 transition-transform' : 'ml-auto size-4 shrink-0 rotate-90 transition-transform'} /> : null}
      </summary>
      <div ref={body} id={id} inert={!open}>
        <div className={cx('flex flex-col gap-2 pt-3', contentClassName)}>{children}</div>
      </div>
    </details>
  );
}

/** 遗Deja雪碧Imagen(`web/index.html`  `#i-*` symbol)en la字形. 媒体BibliotecaImagen标取值就eseste些名字.  */
export function SpriteIcon({ name }: { name: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className="size-4 shrink-0 stroke-current stroke-2">
      <use href={`#i-${name}`} />
    </svg>
  );
}

/** 来源标识: 网盘站标esinterior嵌 PNG, 其余es雪碧Imagen字形(`src/ui-kit/media-source-icons.ts`).  */
export function SourceMark({ mark }: { mark: string }) {
  return mark.startsWith('data:image/png;base64,')
    ? <img src={mark} alt="" width={16} height={16} className="size-4 shrink-0" />
    : <SpriteIcon name={mark} />;
}
