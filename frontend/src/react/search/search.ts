/* 顶栏Buscar(`search` 岛, ADR-0031 No. 11b 步): Datos形状y菜单模型. 
 *
 * Introducir框 `#q` es壳静态节点, 岛No画它, SoloEnarriba面continuar事件: 它En React 包到之anterior就得能敲字, 壳en la
 * 路由, estrecho屏开合y清空时残影(`clearSearchField`)也都直continuar读写它. abajo拉栏 `#searchMenu` contenido, 
 * BuscarRegistro, Recomendado词, 按字Completar, Clave盘选en procesoy提交都归岛; 提交之posterior跳página回壳(`actions.search`), 同
 * AbrirObras, Abrir资料páginauno样走壳路由函数. 
 *
 * abajo拉栏开合动效esTodo站菜单eseuno副(遗Deja层 `presentMenu`/`dismissMenu`, 由 `helpers` 递进来): 
 * `hidden` 始终es"verNo见", 壳Todo局 Escape yexterior点收起照antiguo读它.  */

/** Completaren launopequeñoPortada: Obras本身, 或人名eseuno行derecha边近作.  */
export interface SuggestCard {
  id: number;
  code?: string | null;
  [key: string]: unknown;
}

export interface SuggestItem {
  value: string;
  /** 命en procesoes别名时, ese别名; 跟En统称posterior面当注脚.  */
  matched?: string | null;
  n?: number;
  /** Obraseseuno类: 点开esDetalles, NoesunoBuscar词.  */
  id?: number;
  who?: string | null;
  code?: string | null;
  title?: string | null;
  card?: SuggestCard | null;
  /** 人eseuno类: uno行dentro摆得abajo几部近作就摆几部.  */
  works?: SuggestCard[];
  agency?: string | null;
  href?: string;
  avatarHtml?: string;
  subtitle?: string;
  followMedia?: 'videos' | 'images';
  mediaIndex?: number | null;
  [key: string]: unknown;
}

export interface SuggestGroup {
  kind: string;
  label: string;
  total?: number;
  items: SuggestItem[];
  href?: string;
  action?: string;
}

export interface SuggestTab {
  kind: string;
  label: string;
  total?: number;
}

export interface SuggestResponse {
  q?: string;
  groups?: SuggestGroup[];
}

/** 跳páginayAbrir: 都回壳, 走它路由函数.  */
export interface SearchActions {
  /** 按este词搜: 壳关掉Detalles, 写 `?q=` ypesado取Directorio.  */
  search(query: string): void;
  openItem(id: number): void;
  openEntity(kind: string, name: string): void;
  openPath?(path: string): void;
  openFollow?(id: number, media: 'videos' | 'images', mediaIndex: number | null): void;
}

/** 仍由遗Deja层给几样.  */
export interface SearchHelpers {
  /** 空Introducir时Recomendado词池: y当anteriorDirectorio同uno组Filtrar, SoloDeja真搜得出东西词(`catalogSuggestions`).  */
  pool(): Promise<string[]>;
  recommendations?(): Promise<SuggestGroup[]>;
  /** pequeñoPortadaeseuno格(卡片 `.pic`)连同dentro面eseImagen(`coverImage` y Portada predeterminada JAVese套取景); 两样都Sines"Sin vista previa".  */
  coverHtml(card: SuggestCard | null | undefined): string;
  present(menu: HTMLElement): void;
  dismiss(menu: HTMLElement): void;
  /** estrecho屏página签排Noabajo时derecha缘渐隐(`wireHorizontalScroller`).  */
  wireScroller(row: Element | null): void;
  /** Introducir框字变: 离开BuscarResultado时ese段残影记es哪句话, 由壳记(`rememberSearchValue`).  */
  typed(input: HTMLInputElement): void;
  /** Empezar组字: En curso散开残影当场收掉.  */
  composing(): void;
  /** Con字时按 Escape: 清空yDejauno段残影(`clearSearchField`).  */
  clearField(input: HTMLInputElement): void;
}

/** 壳手en la命令入口, 挂arriba时由 `expose` 交出去, Desinstalar时交回 null.  */
export interface SearchApi {
  /** 收起abajo拉栏, 清掉Clave盘选en proceso. Todo局 Escape, exterior点y失焦都走aquí.  */
  close(): void;
}

export interface SearchProps {
  /** 顶栏ese静态 `#q`.  */
  input: HTMLInputElement;
  /** BuscarRegistroDeja几(Configuraciónpáginaeseuno项); 0 就esNo记也No显示.  */
  historyLimit: number;
  actions: SearchActions;
  helpers: SearchHelpers;
  expose(api: SearchApi | null): void;
}

/** 敲unoabajo就查uno次Completar: 150ms interiorContinuar敲就换掉Anterior次排期, Solo发uno次Por favor求.  */
export const SUGGEST_DEBOUNCE = 150;
/** más类Vista previa每类cinco; 单类Vista previayCategoríapágina签各展示dosdiez.  */
export const SUGGEST_EACH = 5;
export const SUGGEST_ONE_KIND = 20;
/** Con脸ese几类点开es资料página; EtiquetaSin资料página, 点它照antiguoes按este词搜.  */
export const SUGGEST_PROFILE_KINDS = new Set(['performer', 'creator', 'studio', 'agency', 'series']);
/** abajo拉栏按ancho度分两栏: izquierda栏es身 y 词, derecha栏esObrasPortada格.  */
export const SUGGEST_RIGHT_KINDS = new Set(['asset', 'jav', 'post', 'photo', 'release']);
/** 空Introducir时Recomendado几.  */
export const PICKS = 5;

/** 名字比较uno律折叠Todomedio角yTamaño写, 同遗Deja层 `foldName`.  */
export const fold = (value: unknown): string => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase();

/** abajo拉栏dentro能被Clave盘选en procesouno行. `index` es它EnCompleto栏en la次序, arribaabajoClave按它走.  */
export type SearchOption =
  | { index: number; type: 'history' | 'pick'; value: string }
  | { index: number; type: 'more'; value: string; total: number }
  | { index: number; type: 'suggest'; value: string; kind: string; item: SuggestItem };

export interface MenuSection {
  kind?: string;
  label: string;
  options: SearchOption[];
  more?: SearchOption;
  href?: string;
  action?: string;
}

export interface MenuModel {
  /** 命en procesoNo止uno类时página签; SoloConuno类话"Todo" y eseuno类es同uno屏.  */
  tabs: SuggestTab[] | null;
  /** ConIntroducir且没选página签时, 列En最arriba面BuscarRegistro.  */
  recent: MenuSection | null;
  /** 两栏: izquierda栏身 y 词, derecha栏Obras. 空Introducir时esRegistroyRecomendado两组corto词.  */
  left: MenuSection[];
  right: MenuSection[];
  /** este词Completarya经回来, uno都Sin: 栏dentro写uno行"Sin找到", 分得清es没Resultado还es还没搜.  */
  empty: boolean;
  options: SearchOption[];
}

export interface MenuInput {
  query: string;
  history: readonly string[];
  /** 画eseuno刻洗bienRecomendado(`shufflePicks`).  */
  picks: readonly string[];
  /** Completareseste词才算数; lento回来Anterior词No画.  */
  suggestFor: string;
  groups: readonly SuggestGroup[];
  tabs: readonly SuggestTab[];
  kind: string;
  recommendations?: readonly SuggestGroup[];
}

/** 从uno刻Estado算出abajo拉栏dentroCon什么, 以及Clave盘arribaabajo时次序. página签管Completo栏, 所以排En最arriba面; 选uno类
 *  时BuscarRegistro让.  */
export function menuModel({ query, history, picks, suggestFor, groups, tabs, kind, recommendations = [] }: MenuInput): MenuModel {
  let index = 0;
  const options: SearchOption[] = [];
  const add = <T extends Omit<SearchOption, 'index'>>(option: T): SearchOption => {
    const next = { ...option, index: index++ } as SearchOption;
    options.push(next);
    return next;
  };
  // ConIntroducir时Historial跟着筛: esteuno刻用户En找uno词, NoesEn回顾自己搜过什么. 
  const matching = history.filter((value) => !query || fold(value).includes(fold(query)));
  if (!query) {
    if (recommendations.length) {
      const sections = recommendations.map(group => ({ ...group,
        options: group.items.map(item => add({ type: 'suggest', value: item.value, kind: group.kind, item })),
      }));
      const recent = matching.length ? { label: 'Historial de búsqueda', options: matching.map(value => add({ type: 'history', value })) } : null;
      return { tabs: null, recent,
        left: sections.filter(group => !SUGGEST_RIGHT_KINDS.has(group.kind)),
        right: sections.filter(group => SUGGEST_RIGHT_KINDS.has(group.kind)), empty: false, options };
    }
    const recent = matching.length ? { label: 'Historial de búsqueda', options: matching.map((value) => add({ type: 'history', value })) } : null;
    const suggested = picks.length ? { label: 'Recomendado', options: picks.map((value) => add({ type: 'pick', value })) } : null;
    return { tabs: null, recent: null, left: recent ? [recent] : [], right: suggested ? [suggested] : [], empty: false, options };
  }
  const fresh = suggestFor === query;
  const recent = !kind && matching.length
    ? { label: 'Historial de búsqueda', options: matching.map((value) => add({ type: 'history', value })) } : null;
  // 选uno类就Solo画esteuno类; 拉满eseuno类Por favor求还En路arriba时, 先用"Todo"en laese几顶着. 
  const shown = (fresh ? groups : []).filter((group) => !kind || group.kind === kind);
  const section = (group: SuggestGroup): MenuSection => {
    const rows = group.items.map((item) => add({ type: 'suggest', value: item.value, kind: group.kind, item }));
    const more = group.kind === 'asset' && (group.total ?? 0) > rows.length
      ? add({ type: 'more', value: query, total: group.total! }) : undefined;
    return { kind: group.kind, label: group.label, options: rows, more };
  };
  const left = shown.filter((group) => !SUGGEST_RIGHT_KINDS.has(group.kind)).map(section);
  const right = shown.filter((group) => SUGGEST_RIGHT_KINDS.has(group.kind)).map(section);
  const empty = fresh && !shown.some((group) => group.items.length);
  return { tabs: fresh && tabs.length > 1 ? [...tabs] : null, recent, left, right, empty, options };
}

/** 空Introducir时从词池dentro洗出几Recomendado, 搜过No再推. 每画uno次abajo拉栏洗uno次; 删unoRegistroNo算pesado画, 
 *  所以esteuno批En画eseuno刻定abajo, 删掉eseRegistro即便也En词池dentro, 也No会顶进Recomendado.  */
export function shufflePicks(pool: readonly string[], history: readonly string[],
  random: () => number = Math.random): string[] {
  const out = [...pool];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out.filter((value) => !history.some((h) => fold(h) === fold(value))).slice(0, PICKS);
}
