import type { ReactNode } from 'react';

/** Detalles底部: 当anteriorObras分集Colayposterior续Recomendado共享uno行.  */
export function DetailContinuation({ queue, children, editionCards }: { queue: ReactNode; children: ReactNode; editionCards?: number }) {
  return <div data-detail-continuation="" data-edition-cards={editionCards == null ? undefined : Math.min(3, editionCards)}>{queue}{children}</div>;
}
