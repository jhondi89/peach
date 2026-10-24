/* Configuraciónpáginauno组根节点: uno竖排, 组interiorEspaciado 24px. Configuraciónpágina按página签切Agrupar时, 根节点同时eseseuno格página签面板
 * (`data-board-group`, `role="tabpanel"`, `aria-labelledby`), 选en procesoeseuno组másuno `ui-board-group-active`: 
 * 同Directorio `configuration-page.css` Solo显示带它eseuno组.  */
import type { ConfigurationPanel } from '../bundle';

const GROUP = 'flex flex-col gap-6';

export function groupRoot(panel?: ConfigurationPanel) {
  if (!panel) return { className: GROUP };
  return {
    className: panel.active ? `${GROUP} ui-board-group-active` : GROUP,
    'data-board-group': String(panel.index),
    id: panel.id,
    role: 'tabpanel',
    'aria-labelledby': panel.labelledBy,
  };
}
