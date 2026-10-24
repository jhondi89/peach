/* 粘En顶栏abajo沿ese玻璃操作: unopequeñoTítuloposterior面uno排胶囊Clave, 或者arribaabajo两排Filtrar浮层. 
 *
 * 料(漂移两团, 斜光, interior嵌边y落影)由 `web/board.css`  `[data-glass-pane]` uno处给, 
 * 几何, 饱 y 度y文字色En `../styles.css`  `[data-filter-glass]`, alto对比y减menos透明度回退
 * 也Eneseunoarriba. 吸到顶栏abajo沿eseuno刻由 `use-stuck.ts` 标 `data-stuck`, 影换成抬起来eseuno档. 
 * 胶囊Clave 30px alto, 透明底, uno圈 `--glass-low`, 
 * Pasar el ratón换成 `--glass-rim` 边加 `--glass-pick-fill` 底—玻璃en laClaveNoes BoardUI ese实心按钮.  */
import { useRef, type ReactNode, type RefObject } from 'react';
import { cx } from '@/utils/cx';
import { IconButton, type IconButtonProps } from '@/components/base/buttons/icon-button';
import { spinnerHtml } from '@peach/legacy/ui';

import { useStuck } from './use-stuck';
import { useHorizontalScroller } from './use-horizontal-scroller';

const BusyIcon = ({ className }: { className?: string }) => <span aria-hidden className={className}
  dangerouslySetInnerHTML={{ __html: spinnerHtml('Procesando') }} />;

/** Filtrar栏动作使用 30px 尺寸 y 蓝色动作表面.  */
export function FilterIconButton({ label, icon, busy = false, onPress, ...props }:
  Omit<IconButtonProps, 'aria-label' | 'size' | 'onClick'> & { label: string; busy?: boolean; onPress(): void }) {
  return <IconButton {...props} data-filter-action="" size="small" icon={busy ? BusyIcon : icon}
    aria-label={label} title={props.title || label} aria-busy={busy || undefined} aria-disabled={busy || undefined}
    onClick={() => { if (!busy) onPress() }} />;
}

export function FilterGlass({ title, children }: { title: string; children: ReactNode }) {
  const glass = useRef<HTMLDivElement>(null);
  useStuck(glass);
  return (
    <div ref={glass} role="group" aria-label={title} data-filter-glass data-glass-pane=""
      className="sticky top-topbar z-10 mb-5.5 flex flex-wrap items-center gap-x-2.5 gap-y-2 px-4 py-2.5">
      <h3 className="mr-1 text-body-medium">{title}</h3>
      {children}
    </div>
  );
}

/** 两排eseuno副: primeropágina, Etiquetapáginay实体páginaFiltrar浮层. arriba排esuno行横滚Filtrar药丸, abajo排es读数 y 
 *  esteuno屏视ImagenControles. 几何同壳 `.board-filter-frame`: arriba排 48px alto, 8px/12px Relleno, abajo排最矮
 *  46px, 格间 12px. Completo吸En顶栏abajo沿, 粘住时仍es同uno玻璃. 
 *
 *  实体páginaeseuno副几何差uno点(arriba排格间 6px, abajo排最矮 48px), arriba排也NoesCompleto排uno起滚—izquierda端
 *  媒体Clave钉住, SoloCondentro面eseuno格滚. este些由调用方En `className`/`topClassName`/`bottomClassName`
 *  dentro改写, `cx` 合y时posterior写赢. `panes` es直continuar挂En浮层根en laese几滑动玻璃
 *  (`use-view-glide.ts`), `attrs` 给根补壳要认Etiqueta(estrecho屏让认 `data-filter-frame`). 
 *  `busy` 标Enabajo排arriba: 读数Enetc.esteuno趟取数, abajo排dentro认它动效(换批Clave描线)跟着走. arriba排Sinpuede放
 *  东西时 `top` 给 `null`, Completo行No出, 玻璃Solo剩abajo排.  */
export function FilterGlassRows(
  { label, topLabel, top, bottom, className, topClassName, bottomClassName, panes, attrs, busy, bottomRef }: {
    label: string;
    topLabel: string;
    top: ReactNode;
    bottom: ReactNode;
    className?: string;
    topClassName?: string;
    bottomClassName?: string;
    panes?: ReactNode;
    attrs?: Record<`data-${string}`, string>;
    busy?: boolean;
    bottomRef?: RefObject<HTMLDivElement | null>;
  },
) {
  const glass = useRef<HTMLDivElement>(null);
  const topScroll = useHorizontalScroller<HTMLDivElement>();
  const bottomScroll = useHorizontalScroller<HTMLDivElement>(bottomRef);
  useStuck(glass);
  return (
    <div ref={glass} role="group" aria-label={label} data-filter-glass data-glass-pane="" {...attrs}
      className={cx('sticky top-topbar z-10 mb-5.5 flex flex-col', className)}>
      {panes}
      {top === null ? null : (
        <div ref={topScroll} role="group" aria-label={topLabel} data-filter-row="top"
          className={cx('flex h-12 min-w-0 items-center gap-1.75 overflow-x-auto overscroll-x-contain px-3 py-2',
            topClassName)}>
          {top}
        </div>
      )}
      <div ref={bottomScroll} data-filter-row="bottom" aria-busy={busy || undefined}
        className={cx('flex min-h-11.5 min-w-0 items-center gap-3 px-3 py-2', bottomClassName)}>
        {bottom}
      </div>
    </div>
  );
}

/* 浮层en laFiltrar药丸: 8px 圆角, 13px 字, no选en procesoesuno圈虚线 `--glass-low`, Pasar el ratón转实线; 选en proceso
 * 线yIntroduce充归调用方(EtiquetaTipo药丸取自己Tipo色, 见 `../styles.css`  `[data-tag-pill]`).  */
const FILTER_PILL = 'flex h-7.5 flex-none cursor-pointer items-center gap-1.75 rounded-lg border border-dashed'
  + ' border-(--glass-low) bg-transparent px-2.5 text-body-2-regular leading-5 whitespace-nowrap text-inherit'
  + ' outline-none hover:border-solid focus-visible:ring-2 focus-visible:ring-border-focus-ring';

export function FilterPill(
  { children, pressed, onPress, className, ...data }:
  { children: ReactNode; pressed: boolean; onPress(): void; className?: string } & Record<`data-${string}`, string>,
) {
  return (
    <button type="button" {...data} aria-pressed={pressed} className={cx(FILTER_PILL, className)}
      onClick={onPress}>
      {children}
    </button>
  );
}

/* 浮层en la动作Clave: 平时uno圈 `--glass-low` 细线, Pasar el ratón浮起unoprimeropáginaese提亮玻璃(料En `../styles.css`
 *  `[data-glass-pill]`). Solo换Introduce充话, superficial色abajoeseuno档白压En同样发白浮层arriba分No出来.  */
const PILL = 'h-7.5 cursor-pointer rounded-full border border-(--glass-low) bg-transparent px-3'
  + ' text-body-2-regular leading-none whitespace-nowrap text-inherit outline-none'
  + ' focus-visible:ring-2 focus-visible:ring-border-focus-ring'
  + ' aria-busy:cursor-wait aria-busy:opacity-55';

export function GlassPill(
  { children, onPress, busy = false }: { children: ReactNode; onPress(): void; busy?: boolean },
) {
  return (
    <button type="button" data-glass-pill="" className={PILL} aria-busy={busy || undefined} aria-disabled={busy || undefined}
      onClick={() => { if (!busy) onPress() }}>
      {children}
    </button>
  );
}
