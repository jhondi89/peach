/* 字形anchoalto比属于Imagen标本身; 导航, 骨架y正文共用, Controles仍各自决定Imagen标alto度.  */
const WIDE: Readonly<Record<string, number>> = { 'text-aa': 1.435, 'mark-javdb': 326 / 111 };

export function iconGeometry(name: string) {
  const ratio = WIDE[name];
  return { wide: Boolean(ratio), viewBox: ratio ? `0 0 ${(24 * ratio).toFixed(2)} 24` : '0 0 24 24' };
}
