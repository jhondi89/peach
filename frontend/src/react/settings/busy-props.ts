/* Esperando期按钮属性. 单独成uno模: primero启páginaIndependientepágina面包要用它, 却No该连带 `use-action` 背posteriorPor favor求封装.  */

/** Esperando期按钮: 写 `aria-busy` y `aria-disabled`, 保持puede聚焦, No用Original生 `disabled`.  */
export function busyProps(busy: boolean) {
  return busy ? { 'aria-busy': true, 'aria-disabled': true } as const : {};
}
