import { useEffect, useRef, type MouseEvent, type PropsWithChildren } from 'react';
import { attachOverlayScrollbar } from '@peach/legacy/ui';

import { clickedBlank } from './row-click';

export interface DataTableFrameProps extends PropsWithChildren {
  /** 关注来源表需要额exteriorOrdenarImagen标Regla; exterior框y行Estado仍由este共享组件负责.  */
  follow?: boolean;
  /** 给就esCompleto行puede选: 点En某uno行空白处时以eseuno行 `data-key`(React Aria 写En `tr` en la
   *  行 id)回调; 点En行en la勾, Clave, 链continuararribaNo算.  */
  onRowClick?(key: string): void;
}

/** BoardUI Table  Data Table exterior框: 主表面, 完Completo边线, 圆角y选en proceso行Comentarios.  */
export function DataTableFrame({ children, follow = false, onRowClick }: DataTableFrameProps) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    attachOverlayScrollbar(host.current?.querySelector<HTMLElement>(':scope > .overflow-x-auto') ?? null);
  });
  const click = onRowClick ? (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const row = target.closest<HTMLElement>('[role="row"][data-key]');
    if (row && clickedBlank(event, row)) onRowClick(row.dataset.key!);
  } : undefined;
  return (
    <div ref={host} data-board-data-table data-follow-table={follow || undefined} onClick={click}>
      {children}
    </div>
  );
}
