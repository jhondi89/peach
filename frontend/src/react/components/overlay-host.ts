/* 弹层该挂到哪容Dispositivodentro. 
 *
 * PredeterminadoeseunoEn `body` último尾(`entry.tsx`  `overlayContainer`), 对Completopágina island 够用. 
 * ObrasDetallespáginaNoes: 遗Deja壳用 `showModal()` 开unoOriginal生 `<dialog>` 装它, 而顶层元素排En
 * 所Con z-index 之arriba—弹层落En `body` arriba就被DetallespáginaCompleto盖住, 而盖住样子 y "弹层没
 * 画出来"En屏幕arribaverNo出区别. 所以从触发它ese节点往arriba找RecienteyaAbrir dialog, 
 * 挂进去; 找No到就还es `body`. 
 *
 * token, Preflight y焦点Regla都作用En `.peach-react` arriba, 所以容Dispositivo自己带este类. 
 * 每 dialog 复用同uno容Dispositivo, 弹层关掉之posterior它DejaEnese儿, Siguiente次No必再建. 
 */
function hostIn(parent: HTMLElement): HTMLElement {
  const existing = parent.querySelector<HTMLElement>(':scope > [data-react-overlays]');
  if (existing) return existing;
  const host = parent.ownerDocument.createElement('div');
  host.className = 'peach-react';
  host.dataset.reactOverlays = '';
  parent.append(host);
  return host;
}

/** `node` 所Eneseuno层该用弹层容Dispositivo.  */
export function overlayHost(node: Element | null | undefined): HTMLElement {
  const document = node?.ownerDocument ?? globalThis.document;
  const modal = node?.closest('dialog[open]');
  return hostIn((modal as HTMLElement | null) ?? document.body);
}
