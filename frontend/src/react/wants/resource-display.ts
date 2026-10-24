import { fmtSize } from '@peach/legacy/core';

/** 来源的字节数按馆藏容量口径展示，其他来源单位保留。 */
export function resourceSize(value: string): string {
  const bytes = /^([\d,]+)\s*B$/i.exec(value.trim());
  if (/^[\d,.]+$/.test(value.trim())) return 'Tamaño desconocido';
  return bytes ? fmtSize(Number(bytes[1].replaceAll(',', ''))) : value || 'Tamaño desconocido';
}

/** 缓存中的来源限制只表述本次取得范围，不推断账号权限。 */
export function resourceNotice(value: string): string {
  return /^更多评论.*(?:VIP|官方 App)/.test(value)
    ? 'La fuente solo devolvió algunas reseñas; los enlaces a recursos pueden estar incompletos.'
    : value;
}
