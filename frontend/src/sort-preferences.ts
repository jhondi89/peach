/* DirectorioOrdenar词表: Con哪几列, 每uno列方向怎么说, antiguoClave怎么换成NuevoClave. 壳地址解析, FiltrarOrdenar钮y
 * 启动时Configuración归uno化(`appearance/settings.ts`)读都esesteuno.  */

/** `[Clave, 显示名]`. Aleatorio排No.uno: 它es出厂Predeterminado, 也Sin方向.  */
export const SORTS: readonly (readonly [key: string, label: string])[] = [
  ['seed', 'Aleatorio'], ['rating', 'Puntuación'], ['o', 'Contador de orgasmos'], ['plays', 'Reproducciones'], ['dur', 'Duración'],
  ['size', 'Tamaño'], ['new', 'Fecha de catalogación'], ['played', 'Tiempo de reproducción'],
];
/** SoloEn JAV 语境dentro出现eseuno列.  */
export const JAV_RELEASE_SORT: readonly [key: string, label: string] = ['release', 'Fecha de lanzamiento'];
export const SORT_KEYS: readonly string[] = [...SORTS, JAV_RELEASE_SORT].map(([key]) => key);

/** `[desc, asc]` 两方向说法.  */
export type SortDirWords = Readonly<Record<string, readonly [desc: string, asc: string]>>;

/* 方向词按列各自定义: 同uno desc EnTiempo列arribaes"从Nuevo到antiguo", EnDuraciónarribaes"从largo到corto", 
   写成通用"降序"etc.于让界面解释 SQL. 数组es [desc,asc], En表dentro就etc.于esteuno列puedeVoltear.  */
export const SORT_DIR_WORDS: SortDirWords = {
  rating: ['De mayor a menor', 'De menor a mayor'], o: ['De más a menos', 'De menos a más'],
  plays: ['De más a menos', 'De menos a más'], dur: ['De más largo a más corto', 'De más corto a más largo'], size: ['De mayor a menor', 'De menor a mayor'],
  new: ['Más nuevos primero', 'Más antiguos primero'], played: ['De más cercano a más lejano', 'De más lejano a más cercano'], release: ['Más nuevos primero', 'Más antiguos primero'],
};

/* antiguoClave沿用: 地址栏, 书签 y Configuracióndentro存着方向写进Clave名值. 方向现En单独由 `dir` 表达, 
   两DuraciónClave收敛成uno dur; 认No出antiguoClaveposterior果Noes报错, es静predetermina换成另unoOrdenar.  */
export const SORT_ALIASES: Readonly<Record<string, readonly [sort: string, dir: 'asc' | 'desc']>> = {
  big: ['size', 'desc'], short: ['dur', 'asc'], long: ['dur', 'desc'],
};

/* 词表puede换: 关注página排esEn线Actualizar, 列Nouno样(热度eseuno列SoloCon它Con), pero"点no选en proceso项换列, 
   点选en proceso项翻方向" y 箭头怎么画两página完Todo相同. 传表进来, estetres函数就No必各写uno.  */
export const sortDirWord = (key: string, dir: string, words: SortDirWords = SORT_DIR_WORDS): string =>
  (words[key] || [])[dir === 'asc' ? 1 : 0] || '';

/** uno列Predeterminado方向: puedeVoltear列从 desc 起, Aleatorioeste类Sin方向列es空串.  */
export const defaultSortDir = (key: string, words: SortDirWords = SORT_DIR_WORDS): string => (words[key] ? 'desc' : '');

/* 点no选en proceso项＝换列y用该列Predeterminado方向; 点选en proceso项＝翻方向. AleatorioSin方向, Repetir点它
   什么都No做—换uno批es它旁边ese按钮事.  */
export function nextSortState(
  key: string, current: string, dir: string, words: SortDirWords = SORT_DIR_WORDS,
): { sort: string; dir: string } | null {
  if (key !== current) return { sort: key, dir: defaultSortDir(key, words) };
  if (!words[key]) return null;
  return { sort: key, dir: dir === 'asc' ? 'desc' : 'asc' };
}

/** primeropáginano指定方向时使用Explorar偏bien; 显 URL 始终优先.  */
export function preferredDirection(sort: string, preferredSort: string, direction: unknown): string {
  return sort === 'seed' ? '' : sort === preferredSort && direction === 'asc' ? 'asc' : 'desc';
}

/** 地址en la `sort` y `dir` uno次解成列 y 方向. antiguoClave自带方向; `dir` 显写就听它; 写列, 没写方向eseseuno列
 *  Predeterminado方向(Directorio地址省掉正es它); 两样都没写按Explorar偏bien. AleatorioSin方向. 认No出列换成 `fallback`.  */
export function sortFromAddress(
  rawSort: string | null, rawDir: string | null, preferredSort: string, direction: unknown, fallback = preferredSort,
): { sort: string; dir: string } {
  const alias = rawSort ? SORT_ALIASES[rawSort] : undefined;
  const key = alias ? alias[0] : rawSort;
  const sort = key && SORT_KEYS.includes(key) ? key : fallback;
  if (!SORT_DIR_WORDS[sort]) return { sort, dir: '' };
  const dir = rawDir === 'asc' || rawDir === 'desc' ? rawDir
    : alias ? alias[1] : rawSort ? 'desc' : preferredDirection(sort, preferredSort, direction);
  return { sort, dir };
}
