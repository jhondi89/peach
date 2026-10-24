import { fmtSize } from '@peach/legacy/core';

/** 来源字节数按馆藏Capacidad口径展示, 其他来源单保Deja.  */
export function resourceSize(value: string): string {
  const bytes = /^([\d,]+)\s*B$/i.exec(value.trim());
  if (/^[\d,.]+$/.test(value.trim())) return 'Tamaño desconocido';
  return bytes ? fmtSize(Number(bytes[1].replaceAll(',', ''))) : value || 'Tamaño desconocido';
}

/** 缓存en proceso来源限制Solo表述本次取得Rango, No推断账号Permisos.  */
export function resourceNotice(value: string): string {
  return /^更más评论.*(?:VIP|Oficial App)/.test(value)
    ? 'FuenteSoloVolverParcial评论, Recurso链continuarpuede能NoCompletadoCompleto. '
    : value;
}
