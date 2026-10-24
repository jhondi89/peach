/* Listaen launo段报错: 平时Solo露uno行(`errorHeadline`), "verDetalles"展开Todo文. 
 *
 * posterior端回常esCompleto段 traceback 或Completopágina HTML, 铺开会uno卡撑成几屏alto; Solo露uno行又verNo到Todo文, 
 * 所以Todo文收EnClaveposterior面, 展开posterior保DejaOriginalCon换行, largo URL 就地折断, 太largo时En自己框dentro滚.  */
import { useId, useState } from 'react';

import { Button } from '@/components/base/buttons/button';

import { errorHeadline } from './tasks';

export function ErrorExcerpt({ text, className = '' }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const full = String(text || '').trim();
  const head = errorHeadline(full);
  if (!head) return null;
  const more = head !== full;
  return (
    <div data-error-excerpt="" className={`flex min-w-0 max-w-full flex-col items-start gap-1 ${className}`}>
      {open
        ? <p id={id} className="max-h-80 w-full overflow-y-auto whitespace-pre-line wrap-anywhere">{full}</p>
        : <p className="w-full wrap-anywhere">{head}</p>}
      {more
        ? <Button variant="ghost" size="xs" className="-ml-2" aria-expanded={open} aria-controls={open ? id : undefined}
            onClick={() => setOpen(!open)}>
            {open ? 'Ocultar detalles' : 'Ver detalles'}
          </Button>
        : null}
    </div>
  );
}
