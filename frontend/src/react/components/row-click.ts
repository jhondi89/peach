/* Completo行puede选Lista: 点Enuno行空白处就es选esteuno行, 点En行en laControles, 链continuar或Introducir框arribaNo算. 
 *
 * 勾选框本来就En行primero, pero它SoloCon 16px, unoCompleto行其余部分点没反应话, 选几就要瞄几次. 
 * 判"空白"veres点到元素往arriba找ConSinpuede交互祖先, 找到行Como止: 行exterior面祖先No算, 
 * 否则Completo表包Enuno `label` dentro时每unoabajo都成"点EnControlesarriba".  */
import type { MouseEvent, SyntheticEvent } from 'react';

const INTERACTIVE = [
  'a', 'button', 'input', 'select', 'textarea', 'label',
  '[role="checkbox"]', '[role="switch"]', '[role="button"]', '[role="link"]', '[role="menu"]',
].join(',');

/** esteunoabajoesNoes点En `row` 空白处. `row` esCompleto行元素, 事件puede以从它任何posterior代冒arriba来.  */
export function clickedBlank(event: SyntheticEvent | Event, row: Element): boolean {
  const target = event.target;
  if (!(target instanceof Element) || !row.contains(target)) return false;
  const control = target.closest(INTERACTIVE);
  return !control || !row.contains(control) || control === row;
}

/** 卡片Cuadrícula `onMouseDown`: 按着 Shift 点卡esRangomás选, esteunoabajoNo让Explorar dispositivo两次点击之间
 * 文字unoy刷成选区. Solo拦按abajo, `click` 照常冒arriba来交给Seleccionar逻辑.  */
export function suppressShiftTextSelection(event: MouseEvent): void {
  if (event.shiftKey) event.preventDefault();
}
