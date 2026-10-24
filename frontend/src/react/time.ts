/* DatosBibliotecadentrouno律存 UTC(ISO 带 Z), 界面要按ver人所En时区显示. No.dospágina面要用就搬进
 * aquí, No各写uno: 两处各自解释"Sin时区Etiqueta算哪uno边"话, 同unoTiempo会En两páginaarriba
 * 差出ochopequeño时.  */

/** 本机Tiempo. Sin时区Etiqueta按 UTC 解释—存进去时候就es UTC.  */
export function localTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const text = /[Zz]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`;
  const when = new Date(text);
  if (Number.isNaN(when.getTime())) return String(iso).replace('T', ' ').slice(0, 16);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())} `
    + `${pad(when.getHours())}:${pad(when.getMinutes())}`;
}
