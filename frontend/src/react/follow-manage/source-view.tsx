/* uno关注来源En屏幕en laese几格: 站标, Avatar, Estado徽章, 来源名. 
 *
 * 创作者卡片, 表格视Imagen y 别名清单读es同uno, 所以este几格摆Enaquí而Noes各画uno次: 
 * 同uno来源En两视Imagenen laEstado写法uno旦分开写, 就会出现同uno行En卡片dentro说"noVerificar", 
 * En表格dentro说"正常".  */
import { useLayoutEffect, useRef, useState } from 'react';
import { VisuallyHidden } from 'react-aria-components';

import { Chip } from '@/components/base/badges/chip';
import { Button } from '@/components/base/buttons/button';

import {
  authorAvatar, authorInitial, errorHeadline, isBroken, sourceIconUrl, statusText,
  type FollowSource,
} from './follow-manage';

/** 站点圆标. 
 *
 * 给 `label` 就es"画得出Imagen标就Solo画Imagen标": Imagen标En时名字交给读屏, 没登记Imagen标或者eseuno
 * 取Noabajo来时名字显出来—uno站En屏幕arribaTotal要认得出es哪站, No能两情况都指望同unoImagen.  */
export function SourceIcon({ provider, label }: { provider: string; label?: string }) {
  const src = sourceIconUrl(provider);
  const [broken, setBroken] = useState(false);
  if (!src || broken) return label ? <>{label}</> : null;
  return (
    <>
      <img src={src} alt="" width={14} height={14} loading="lazy"
        onError={() => setBroken(true)}
        className="size-3.5 shrink-0 rounded-sm object-contain" />
      {label ? <VisuallyHidden>{label}</VisuallyHidden> : null}
    </>
  );
}

/** 创作者圆标: Oficial来源Avatar优先, 归档来源回退, 都取No到就用primero字母. 
 *
 * primero字母取自创作者名而Noes某来源Etiqueta—ese会切出"初""uno"este类 y 创作者Sin关字.  */
export function AuthorAvatar({ group, name }: { group: FollowSource[]; name: string }) {
  const { src, fallback } = authorAvatar(group);
  const [at, setAt] = useState(0);
  const chain = [src, fallback].filter(Boolean);
  const current = chain[at];
  if (!current) {
    return (
      <span title="No hay avatar disponible"
        className="inline-grid size-8 shrink-0 place-items-center rounded-full bg-background-tertiary-default text-caption-1-semibold text-text-secondary">
        {authorInitial(name)}
      </span>
    );
  }
  return (
    <img src={current} alt="" width={32} height={32} loading="lazy" referrerPolicy="no-referrer"
      onError={() => setAt(at + 1)}
      className="size-8 shrink-0 rounded-full bg-background-tertiary-default object-cover" />
  );
}

/** Estado徽章. tres档Color对应tres件事: 要Procesar, 正常, 还Sin结论.  */
export function StatusBadge({ source }: { source: FollowSource }) {
  const color = isBroken(source) ? 'rose'
    : source.enabled && source.last_status === 'ok' ? 'lime'
    : source.enabled ? 'yellow' : 'neutral';
  return <Chip variant="caption" color={color}>{statusText(source)}</Chip>;
}

/** 来源名连到站en laOriginalpágina面. NuevoEtiquetapáginaNo继承esteunopágina会话, 来源地址也No带走 Peach 自己地址.  */
export function SourceLink({ source }: { source: FollowSource }) {
  return (
    <a href={source.url} target="_blank" rel="noreferrer noopener" title="AbrirOriginalFuente"
      className="min-w-0 text-body-medium wrap-anywhere text-text-primary underline-offset-2 hover:underline">
      {source.label}
    </a>
  );
}

/** uno报错: ListadentroSolo露uno行(`errorHeadline`), 放Noabajo就截断; más于esteuno行或被截时给"verDetalles"Original地展开Todo文. 
 *  来源Última vezVerificar, JAV 入BibliotecaScrapingFallo都用它, posterior端常回Completopágina HTML 或Completo段 traceback.  */
export function ErrorLine({ text, prefix = '', tone = 'error' }: { text: string; prefix?: string; tone?: 'error' | 'muted' }) {
  const line = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);
  const head = errorHeadline(text);
  useLayoutEffect(() => {
    const node = line.current;
    if (!node || open) return undefined;
    const measure = () => setCut(node.scrollWidth > node.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [head, open]);
  const more = cut || head !== String(text || '').trim();
  return (
    <span className="flex min-w-0 max-w-full flex-col items-start gap-0.5">
      <small ref={line} data-error-line=""
        className={`max-w-full text-caption-1-regular ${tone === 'error' ? 'text-text-error-primary' : 'text-text-secondary'} ${open ? 'whitespace-pre-line wrap-anywhere' : 'block truncate'}`}>
        {prefix}{open ? text : head}
      </small>
      {more ? (
        <Button variant="ghost" size="xs" data-error-line-toggle="" aria-expanded={open} className="-ml-2"
          onClick={() => setOpen(!open)}>
          {open ? 'Ocultar detalles' : 'Ver detalles'}
        </Button>
      ) : null}
    </span>
  );
}
