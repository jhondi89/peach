/* InmersivoModopágina面元素(ADR-0031): `/immerse` Enpágina面组dentro, No算覆盖, No带Fondo. 
 *
 * 启动y没人认领Historial变化落En `/immerse` arriba时, 从地址en la `?id=` eseunoAbrirInmersivo(`ShellActions.openImmerse`); 
 * 顶栏按钮认领写地址posterior也由元素Abrir. Inmersivodentro每换uno由壳认领 replace 写 `?id=`, 元素按página面Abrir序号挂 key, 
 * Nopesado挂, Nopesado开, Entrada数No变. 
 *
 * 卸abajoNo收Inmersivo: posterior退离开 `/immerse` 时Inmersivo照antiguo开着, 由 Escape 或CerrarClave收起, 收起时壳回primeropáginay写uno地址.  */
import { useContext, type ReactNode } from 'react';

import { peachHistory } from '@peach/history';

import { ShellActionsContext, useOpenEpoch } from '../router';
import { useRouteOpen } from './overlay';

/* 地址en laeseuno: `?id=` es数字才算, No然从头Empezar.  */
function startId(): number | undefined {
  const id = new URLSearchParams(peachHistory.navigation.location.search).get('id');
  return /^\d+$/.test(id || '') ? Number(id) : undefined;
}

function ImmerseOpen() {
  const actions = useContext(ShellActionsContext);
  useRouteOpen(() => { actions?.openImmerse(startId()) }, true);
  return null;
}

/** `/immerse` 元素.  */
export function ImmerseMatch(): ReactNode {
  return <ImmerseOpen key={useOpenEpoch()} />;
}
