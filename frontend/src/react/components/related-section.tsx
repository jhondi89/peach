import { useCallback, type ComponentPropsWithoutRef } from 'react';
import { fitSkeleton } from '@peach/legacy/ui';
import { RiVideoLine } from '@remixicon/react';
import { EmptyState } from './empty-state';
import { RetryNote } from './grid-reveal';

/** 两种详情的推荐带：标题、横滚与骨架占位共用一处。 */
export function RelatedSection({ children, wireDrag, busy, empty, error, onRetry, ...attrs }: ComponentPropsWithoutRef<'div'> & {
  wireDrag(row: Element): void; busy?: boolean; empty?: boolean; error?: string; onRetry?: () => void;
}) {
  const row = useCallback((node: HTMLDivElement | null) => {
    if (node) { fitSkeleton(node); wireDrag(node) }
  }, [wireDrag]);
  return <div {...attrs} data-item-related="" aria-busy={busy || undefined}>
    <h3 className="font-semibold">Seguir viendo</h3>
    {error ? <div data-related-state=""><RetryNote message={error} onRetry={onRetry || (() => {})} /></div>
      : empty && !busy ? <div data-related-state=""><EmptyState shell="plain" icon={RiVideoLine} title="Nada para seguir viendo por ahora">
        Puedes volver a la lista y elegir otra obra.
      </EmptyState></div>
      : <div ref={row} id="nrow" data-related-row="">{children}</div>}
  </div>;
}
