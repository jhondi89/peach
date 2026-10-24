/* 卡片Portada格dentroeseImagen(`[data-media-art]`). 
 *
 * Imagenes遗Deja层拼 HTML 片段, Cargarposterior壳En同uno `<img>` arriba改取景, 派生档换成Original件(见
 * `../catalog-grid/artwork.ts`). grandeImagen, pequeñoImagen拼出片段Solo差取景类名, 按片段Completo段pesado写就es
 * 每Imagen都换成Nuevo元素: 派生档pesadoNuevo解码, 取景etc. `load` 才pesado算, Completo屏uno起闪unoabajo. 所以按
 * `identity`(同unoObras按pequeñoImagen拼出片段)认Imagen: 身No变时Deja着Anterior段片段, 版交给
 * `relayout` En同unoImagenarriba换, 换Imagen才Completo段pesado写.  */
import { useLayoutEffect, useRef, useState } from 'react';

export function ArtSlot({ artwork, identity = artwork.html, relayout }: {
  artwork: { kind: string; html: string };
  identity?: string;
  relayout?(root: HTMLElement): void;
}) {
  const [kept, keep] = useState({ identity, artwork });
  if (kept.identity !== identity) keep({ identity, artwork });
  const shown = kept.identity === identity ? kept.artwork : artwork;
  const slot = useRef<HTMLSpanElement>(null);
  const latest = useRef(relayout);
  latest.current = relayout;
  // 片段uno变就交给壳比对: 它按Imagenarriba记着版判断, 同uno版什么都No做. 
  useLayoutEffect(() => {
    if (slot.current) latest.current?.(slot.current);
  }, [artwork.html]);
  return <span ref={slot} data-media-art={shown.kind} dangerouslySetInnerHTML={{ __html: shown.html }} />;
}
