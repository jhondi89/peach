/* Obra representativa表: Actriz, Sello名对应uno部能取得AvatarObras id. 
 * 卡片署名, Mix 叠放AvataryInmersivo作者缺实体Imagen时读取este表, 回落到 /avatar?id=. 
 * catalog-bars.ts 经共享 QueryClient 读取 /api/tops posteriorActualizar该表, 读者共用同uno源码实例. 
 * Solo收能取得AvatarObras; has_avatar 表示裁Imagen或印相puede用, /avatar puede按需生成.  */

/** `/api/tops` dentrouno圆Avatar: `k` es名字, `rep` esObra representativa id.  */
export interface RepresentativeRow { k: string; rep?: number | null; has_avatar?: boolean }

const representatives = new Map<string, number>();

/** 记Siguiente批Obra representativa. Solo增No减: 换uno批之posterior, 屏幕arribaantiguo卡片回落照样找得到.  */
export function rememberRepresentatives(rows: readonly RepresentativeRow[] | null | undefined): void {
  (rows || []).forEach(row => { if (row.rep && row.has_avatar) representatives.set(row.k, row.rep); });
}

/** este名字Obra representativa id, 表dentroSin就es `undefined`.  */
export function representativeOf(name: string): number | undefined {
  return representatives.get(name);
}
