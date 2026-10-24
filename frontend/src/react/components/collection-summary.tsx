/* Listapágina顶arribaese汇Total(antiguo `.collection-summary`): izquierda边uno名目配unogrande数, derecha边uno句分项. 
 *
 * superficial色espágina面底en launoIntroduce充面, profundo色反过来比página面亮uno档(antiguo `html:not(.dark)` ese), 14px 圆角, 
 * No压阴影. 600px 以abajo改成arribaabajo两行. 
 *
 * 数字回来之anterior, grande数eseuno格esuno 96×32 微光占(antiguo `.collection-summary strong .countskeleton`), 
 * 行alto照antiguo, 数字到货时CompletoNo改alto度. `flush` 去掉abajo方Espaciado: 落Enuno行自己排Espaciado容Dispositivodentro时
 * (垃圾Archivo计数行, `Page` 自己排Espaciadoalto清版), Espaciado归eseuno层. 壳铺primero屏骨架
 * (`src/island-skeleton.ts`  `islandSummary`)抄esaquíEsperando态类名, 改aquí要uno起改ese边.  */
export function CollectionSummary({ label, figure, detail = '', pending = false, flush = false }: {
  label: string; figure: string; detail?: string; pending?: boolean; flush?: boolean;
}) {
  return (
    <div data-collection-summary=""
      className={`${flush ? '' : 'mb-5 '}flex items-end justify-between gap-4 rounded-surface bg-background-secondary-default px-6 py-5
      max-compact:flex-col max-compact:items-start max-compact:gap-3 max-compact:p-4
      dark:bg-background-primary-default`}>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-body-regular text-text-secondary">{label}</span>
        <strong className="text-display-4-medium tabular-nums text-text-primary">
          {pending
            ? <span data-skeleton="count" aria-hidden className="relative inline-block h-8 w-24 rounded-2lg align-middle skeleton-sheen" />
            : figure}
        </strong>
      </div>
      {detail ? <p className="text-body-regular text-text-secondary">{detail}</p> : null}
    </div>
  );
}
