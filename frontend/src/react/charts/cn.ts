/* EvilCharts 源码en la `@/lib/utils`: Condición类名先经 `clsx` 摊平, 再交给 BoardUI  `cx`. 
 *
 * arriba游es shadcn Proyecto, `cn` 由 `shadcn init` 生成, NoEnRegistrarse表Entradadentro. aquícontinuares BoardUI 扩展过
 *  `tailwind-merge`: 它认得 `text-caption-1-regular` este类字阶类,  y Color类同处uno串时No会被
 * 当成Color丢掉. Ruta别名写En `vite.config.ts`, `vitest.config.ts` y `src/react/tsconfig.json`.  */
import { clsx, type ClassValue } from 'clsx';

import { cx } from '@/utils/cx';

export function cn(...inputs: ClassValue[]): string {
  return cx(clsx(inputs));
}
