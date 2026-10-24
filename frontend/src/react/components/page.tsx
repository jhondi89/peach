/* Gestionar区正文居en proceso, ancho度使用 `max-w-board` 对应 `--board-content`; página面Título由página头IndependienteDiseño.  */
import type { ReactNode } from 'react';

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-board flex-col gap-8">{children}</div>;
}
