/* 资料卡arribaese几进顶层浮层: 别名yEtiqueta"+N", 以及订阅Nuevas obrasDescripción. 
 *
 * tres者都esOriginal生 `popover="manual"`: 进顶层才No被资料卡 `overflow:hidden` 裁掉, 也No被卡底
 * 同艺人ese压住. Ubicación按视口算: Predeterminado贴锚点abajo方 8px, abajo面放Noabajo翻到arriba方, izquierdaderechacarpetaEn视口interior
 * 8px; 开着时候página面滚动或窗口改ancho就pesado算, 收起posteriorese监听自己摘掉.  */
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

import { Glyph } from './glyph';

/**  `pop` 摆到 `anchor` abajo方, 放Noabajo翻arriba方, izquierdaderechacarpetaEn视口interior 8px. 两边都放Noabajo时摆到空间grande
 *  eseuno边, alto度压到eseuno边真正剩abajo空间, 浮层dentro自己滚: 浮层从No横跨锚点, 盖住"+N"eseunoabajo
 *  指针就落En浮层arriba, 按钮再也点No到.  */
export function placePop(anchor: Element, pop: HTMLElement): void {
  pop.style.removeProperty('max-height');
  const at = anchor.getBoundingClientRect(), box = pop.getBoundingClientRect();
  pop.style.left = `${Math.max(8, Math.min(innerWidth - box.width - 8, at.left))}px`;
  const below = at.bottom + 8;
  const roomBelow = innerHeight - 8 - below, roomAbove = at.top - 16;
  const downward = box.height <= roomBelow || (box.height > roomAbove && roomBelow >= roomAbove);
  const room = Math.max(0, downward ? roomBelow : roomAbove);
  if (box.height > room) pop.style.maxHeight = `${room}px`;
  pop.style.top = `${downward ? below : at.top - 8 - Math.min(box.height, room)}px`;
}

const isOpen = (pop: HTMLElement | null) => !!pop?.isConnected && pop.matches(':popover-open');

/** 开着时跟着滚动y改窗anchopesado算Ubicación; `open` Como假或Desinstalar时摘掉监听.  */
function useFollow(open: boolean, anchor: RefObject<Element | null>, pop: RefObject<HTMLElement | null>, onLost: () => void) {
  const lost = useRef(onLost);
  lost.current = onLost;
  useEffect(() => {
    if (!open) return undefined;
    const follow = () => {
      if (anchor.current && isOpen(pop.current)) placePop(anchor.current, pop.current!);
      else lost.current();
    };
    addEventListener('scroll', follow, { capture: true, passive: true });
    addEventListener('resize', follow, { passive: true });
    return () => {
      removeEventListener('scroll', follow, true);
      removeEventListener('resize', follow);
    };
  }, [open, anchor, pop]);
}

/** "+N" y 它浮层. 
 *
 *  指针Pasar el ratón或Clave盘聚焦就出, 指针挪到浮层arriba读名字时No收; 点unoabajo钉住(触屏SoloConesteuno路), 
 *  再点, 点别处或 Escape 收起.  */
export function MorePop({ id, rest, label, heading, hook, children }: {
  id: string;
  rest: number;
  /** 按钮给读屏名字: "另exterior N 别名".  */
  label: string;
  /** 浮层Título: "7 别名".  */
  heading: string;
  /** 按钮自己样钩子: `alias`/`fact`.  */
  hook: 'alias' | 'fact';
  children: ReactNode;
}) {
  const more = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const closing = useRef(0);

  const hide = () => {
    clearTimeout(closing.current);
    pinned.current = false;
    if (isOpen(pop.current)) pop.current!.hidePopover();
    setOpen(false);
  };
  const show = () => {
    clearTimeout(closing.current);
    if (!pop.current || !more.current || isOpen(pop.current)) return;
    pop.current.showPopover();
    placePop(more.current, pop.current);
    setOpen(true);
  };
  const later = () => {
    clearTimeout(closing.current);
    closing.current = window.setTimeout(() => {
      if (!pinned.current && !more.current?.matches(':hover,:focus-visible') && !pop.current?.matches(':hover')) hide();
    }, 150);
  };
  useFollow(open, more, pop, hide);
  // 点En按钮 y 浮层以exterior地方就收. 
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!more.current?.contains(target) && !pop.current?.contains(target)) hide();
    };
    addEventListener('pointerdown', outside, true);
    return () => removeEventListener('pointerdown', outside, true);
  }, [open]);
  useEffect(() => () => clearTimeout(closing.current), []);

  return (
    <>
      <button ref={more} type="button" data-hero-more={hook} aria-expanded={open} aria-controls={id}
        aria-label={label}
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') show() }}
        onPointerLeave={later}
        onFocus={() => { if (more.current?.matches(':focus-visible')) show() }}
        onBlur={later}
        onClick={() => { if (pinned.current) hide(); else { show(); pinned.current = true } }}
        onKeyDown={(event) => { if (event.key === 'Escape' && isOpen(pop.current)) { event.preventDefault(); hide() } }}>
        +{rest}
      </button>
      <div ref={pop} id={id} popover="manual" role="group" aria-label={heading} data-hero-pop=""
        onPointerEnter={() => clearTimeout(closing.current)} onPointerLeave={later}>
        <p data-hero-pop-head="">{heading}</p>
        {children}
      </div>
    </>
  );
}

/** "订阅Nuevas obras"开关: uno RSS Imagen标, 开关本身藏给读屏yClave盘, Descripción浮层Pasar el ratón y Clave盘聚焦都出. 
 *
 *  Escape Solo收起esteuno次; 指针离开或焦点移走posterior, Siguiente次Pasar el ratón照常出现.  */
export function FeedSwitch({ following, busy, onToggle, tip }: {
  following: boolean;
  busy: boolean;
  onToggle(on: boolean): void;
  tip: string;
}) {
  const label = useRef<HTMLLabelElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const pop = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const dismissed = useRef(false);

  const hideTip = () => {
    if (isOpen(pop.current)) pop.current!.hidePopover();
    setOpen(false);
  };
  const showTip = () => {
    if (dismissed.current || !pop.current || !label.current || isOpen(pop.current)) return;
    pop.current.showPopover();
    placePop(label.current, pop.current);
    setOpen(true);
  };
  const restore = () => { dismissed.current = false; hideTip() };
  useFollow(open, label, pop, () => setOpen(false));
  // Descripción文字换(订arriba/Cancelar), 浮层开着就按Nuevoancho度pesado摆uno次. 
  useEffect(() => {
    if (label.current && isOpen(pop.current)) placePop(label.current, pop.current!);
  }, [tip]);

  return (
    <label ref={label} data-entry-feed="" onPointerEnter={showTip}
      onPointerLeave={() => { if (!input.current?.matches(':focus-visible')) restore() }}>
      <Glyph name="rss" />
      <input ref={input} type="checkbox" role="switch" aria-label="Suscribirse a nuevas obras" aria-describedby="entityFeedTip"
        data-entity-feed="" checked={following} aria-busy={busy || undefined} aria-disabled={busy || undefined}
        onChange={(event) => { if (!busy) onToggle(event.currentTarget.checked) }}
        onKeyDown={(event) => { if (event.key === 'Escape') { dismissed.current = true; hideTip() } }}
        onFocus={() => { if (input.current?.matches(':focus-visible')) showTip() }}
        onBlur={restore} />
      <span ref={pop} role="tooltip" id="entityFeedTip" popover="manual" data-entry-feed-tip="">{tip}</span>
    </label>
  );
}
