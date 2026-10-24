/** Obras身忽略号码en proceso分隔符 y 字母Tamaño写.  */
export const workCodeKey = (value?: string | null): string => (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const sameWorkCode = (left?: string | null, right?: string | null): boolean => Boolean(workCodeKey(left)) && workCodeKey(left) === workCodeKey(right);
