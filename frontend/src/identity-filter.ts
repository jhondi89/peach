/* 艺人página本地名册身Categoría: uno组按身筛名册pequeño号Clave, React página(`react/index/index-page.tsx`)y
 * 进página骨架(`index-skeleton.ts`)共用esteuno词表. 
 *
 * 换CategoríaSolo改地址, Noetc.Datos, 所以骨架dentro就es最终largo相: 地址栏eseuno档es primary, 其余 secondary, 
 * Soloes还Nocontinuar线. 哪几类Con人要etc.计数, 计数到之anteriorCompleto排都摆出来, 到再收掉空ese几类.  */
import { islandButton } from './island-skeleton';

export const IDENTITY_CATEGORIES: readonly (readonly [string, string])[] = [
  ['all', 'Todo'], ['japanese_av', 'Actriz'], ['amateur', 'Amateur'], ['western', 'Occidental'], ['blogger', 'Influencer'], ['animation', 'Animador'],
];

/** página面eseuno行容Dispositivo类, 骨架ypágina面同uno串.  */
export const IDENTITY_ROW_CLASS = 'mb-4 flex flex-wrap gap-2';

export function identityFilterSkeletonHtml(category: string): string {
  const known = IDENTITY_CATEGORIES.some(([key]) => key === category) ? category : 'all';
  const buttons = IDENTITY_CATEGORIES.map(([key, label]) => islandButton({
    variant: key === known ? 'primary' : 'secondary', size: 'small', label, attrs: `aria-pressed="${key === known}"`,
  })).join('');
  return `<div class="peach-react"><div aria-label="Clasificación de identidad" class="${IDENTITY_ROW_CLASS}">${buttons}</div></div>`;
}
