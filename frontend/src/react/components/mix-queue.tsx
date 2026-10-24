/* Detalles浮窗derecha侧eseuno列Cola(Mix, 分卷, Versión, ReproducirLista, 关注合集ymás媒体). 
 *
 * Cola, 行yEntrada各挂uno `data-mix-*`, 样En
 * `stage/stage.css`, ObrasDetallesy关注Detalles共用. uno列diez几要能拖着横滚(estrecho屏abajoColaes横排), 
 * 拖动借壳 `wireDrag`, 由调用方经 `listRef` continuararriba.  */
import { useCallback, useLayoutEffect, useRef, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react';
import { icon } from '@peach/legacy/core';

export function MixQueue({ kind, title, summary, onClose, actions, listRef, children, ...data }: {
  kind: string;
  title: string;
  summary: string;
  onClose(): void;
  /** CerrarClaveanterior面动作Clave(Guardar comoReproducirLista之类).  */
  actions?: ReactNode;
  listRef?: Ref<HTMLDivElement>;
  children: ReactNode;
} & Record<`data-${string}`, string>) {
  const list = useRef<HTMLDivElement | null>(null);
  const attach = useCallback((node: HTMLDivElement | null) => {
    list.current = node;
    if (typeof listRef === 'function') listRef(node);
    else if (listRef) listRef.current = node;
  }, [listRef]);
  /* 换时Detalles按Entradapesado建, Cola跟着从头挂: En cursovereseuno行滚进Listapuede见处. Solo动Lista自己滚动, 
     `scrollIntoView` 会连浮窗 y página面uno起滚.  */
  useLayoutEffect(() => {
    const box = list.current;
    const row = box?.querySelector<HTMLElement>('[data-mix-item][aria-current="true"]');
    if (!box || !row) return;
    const outer = box.getBoundingClientRect();
    const inner = row.getBoundingClientRect();
    if (inner.top < outer.top || inner.bottom > outer.bottom) box.scrollTop += inner.top - outer.top - (outer.height - inner.height) / 2;
    if (inner.left < outer.left || inner.right > outer.right) box.scrollLeft += inner.left - outer.left - (outer.width - inner.width) / 2;
  }, []);
  return (
    <aside data-mix-queue="" data-queue-kind={kind} {...data}>
      <div data-mix-queue-head="">
        {/* 作用域 Preflight Título字pesado清成 inherit, aquí按字pesadotres档取 semibold.  */}
        <div><h2 className="font-semibold">{title}</h2><span>{summary}</span></div>
        <div data-mix-queue-actions="">
          {actions}
          {/* Detalles底部Cola头No放CerrarClave, 关舞用媒体框arribaeseuno(`stage.css`).  */}
          <button type="button" data-queue-close="" title="Desactivar" aria-label="Desactivar" onClick={onClose}
            dangerouslySetInnerHTML={{ __html: icon('x') }} />
        </div>
      </div>
      <div data-mix-list="" ref={attach}>{children}</div>
    </aside>
  );
}

/** Colaen launo行: izquierda边缩略Imagen(Duración角标由调用方放进 `pic`), derecha边两行字. ObrasCola字anterior面还Con
 *  uno署名Avatar(`lead`,  y 卡片署名层同uno套); ReproducirLista行尾másuno组抓手y移出(`after`), 
 *  拖动Ordenar认es行en la `row` 属性.  */
export function MixQueueRow({ current, pic, lead, after, row, children, ...button }: {
  current: boolean;
  pic: ReactNode;
  lead?: ReactNode;
  after?: ReactNode;
  row?: Record<`data-${string}`, string | number>;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement> & Record<`data-${string}`, string | number>) {
  const text = <span data-mix-item-text="">{children}</span>;
  return (
    <div data-mix-row="" {...row}>
      <button type="button" data-mix-item="" aria-current={current ? 'true' : 'false'} {...button}>
        <span data-mix-item-pic="">{pic}</span>
        {lead === undefined ? text : <span data-mix-item-meta="">{lead}{text}</span>}
      </button>
      {after}
    </div>
  );
}

/** 网盘AgruparpequeñoTítulo: 组名加数.  */
export const MixGroupLabel = ({ label, count }: { label: string; count: number }) => (
  <h3 data-mix-group-label="">{label} <span>{count}</span></h3>
);
