/* 顶栏Buscarabajo拉栏yClave盘(`search` 岛). 
 *
 * Estado放Enuno随组件活着puede变仓dentro, Introducir框en laOriginal生事件改它再pesado画: `#q` es壳节点, 事件Solo能用
 * `addEventListener` continuar, ProcesarDispositivodentro要读esesteuno刻值, Noes挂arribaeseuno刻闭包en laese. Introducir法组字期间
 * 按Clave读Original生事件 `isComposing`: 方向ClaveEn挑候选字, 回车En定字, 都Noes给este菜单. 
 *
 * BoardUI Registrarse表dentroSin Combobox/Command(`https://www.boardui.com/r/registry.json`, 2026-10-01), 
 * React Aria  ComboBox 要自己画Introducir框, Opcioneses listbox en la option: Opcionesdentro嵌删RegistroClave, 近作
 * pequeñoPortadaClave y 最arriba面ese排página签都放No进去. 所以aquí按遗Deja层eseuno套逐照做: arribaabajo环绕着选, 回车提交, 
 * Escape 先关abajo拉再清字, 空Introducir回车用占dentroeseRecomendado词.  */
import { useLayoutEffect, useReducer, useRef, type MouseEvent, type ReactNode } from 'react';
import { avatarInner } from '@peach/card-art';

import { apiGet, apiSend } from '../../api';
import { TabCount } from '../components/board-tabs';
import {
  menuModel, shufflePicks, SUGGEST_DEBOUNCE, SUGGEST_EACH, SUGGEST_ONE_KIND, SUGGEST_PROFILE_KINDS, fold,
  type MenuModel, type MenuSection, type SearchApi, type SearchOption, type SearchProps, type SuggestCard,
  type SuggestGroup, type SuggestItem, type SuggestResponse, type SuggestTab,
} from './search';

interface Store {
  history: string[];
  pool: string[];
  poolRequest: number;
  recommendations: SuggestGroup[];
  recommendationRequest: number;
  /** 画eseuno刻Introducir框en la词y洗bienRecomendado.  */
  query: string;
  picks: string[];
  suggestFor: string;
  groups: SuggestGroup[];
  tabs: SuggestTab[];
  suggestRequest: number;
  /** Recienteuno次NoCategoríaCompletar问词: 聚焦时Datos晚到, 框dentro还eseste词就No再问uno遍.  */
  asked: string;
  timer: number;
  kind: string;
  active: number;
  /** esteuno次选en procesoesClave盘挪: 画完eseuno行滚进视野.  */
  reveal: boolean;
  /** 选uno类: 画完abajo拉栏滚回顶arriba.  */
  rewind: boolean;
}

const emptyStore = (): Store => ({
  history: [], pool: [], poolRequest: 0, recommendations: [], recommendationRequest: 0, query: '', picks: [], suggestFor: '', groups: [], tabs: [],
  suggestRequest: 0, asked: '', timer: 0, kind: '', active: -1, reveal: false, rewind: false,
});

const modelOf = (s: Store): MenuModel => menuModel({
  query: s.query, history: s.history, picks: s.picks, suggestFor: s.suggestFor, groups: s.groups, tabs: s.tabs,
  kind: s.kind,
  recommendations: s.recommendations,
});
const hasContent = (m: MenuModel) => !!(m.tabs || m.recent || m.left.length || m.right.length || m.empty);

const Sprite = ({ name }: { name: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><use href={`#i-${name}`} /></svg>
);

export function SearchPage(props: SearchProps) {
  const latest = useRef(props);
  latest.current = props;
  const store = useRef<Store | null>(null);
  store.current ??= emptyStore();
  const s = store.current;
  const root = useRef<HTMLDivElement>(null);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  /* ProcesarDispositivouno次建bien, 挂EnIntroducir框arriba; 读都es `latest` y仓dentroesteuno刻值.  */
  const ops = useRef<ReturnType<typeof createOps> | null>(null);
  ops.current ??= createOps(() => latest.current, s, () => root.current?.closest<HTMLElement>('[data-search-menu]') ?? null, bump);
  const op = ops.current;

  useLayoutEffect(() => {
    const { input } = latest.current;
    const onInput = (event: Event) => op.input(event as InputEvent);
    const onStart = () => latest.current.helpers.composing();
    const onKey = (event: KeyboardEvent) => op.key(event);
    const onFocus = () => op.focus();
    input.addEventListener('input', onInput);
    input.addEventListener('compositionend', onInput);
    input.addEventListener('compositionstart', onStart);
    input.addEventListener('keydown', onKey);
    input.addEventListener('focus', onFocus);
    const api: SearchApi = { close: op.close };
    latest.current.expose(api);
    return () => {
      input.removeEventListener('input', onInput);
      input.removeEventListener('compositionend', onInput);
      input.removeEventListener('compositionstart', onStart);
      input.removeEventListener('keydown', onKey);
      input.removeEventListener('focus', onFocus);
      clearTimeout(s.timer);
      s.recommendationRequest++;
      latest.current.expose(null);
    };
  }, [op, s]);

  useLayoutEffect(() => {
    const menu = root.current?.closest<HTMLElement>('[data-search-menu]');
    if (s.rewind && menu) menu.scrollTop = 0;
    s.rewind = false;
    if (s.reveal) root.current?.querySelector('[data-search-option][data-active]')?.scrollIntoView({ block: 'nearest' });
    s.reveal = false;
  });

  const model = modelOf(s);
  const limit = props.historyLimit;
  const option = (entry: SearchOption): ReactNode => (
    <Row key={`${entry.type}:${entry.value}:${entry.index}`} entry={entry} active={entry.index === s.active}
      helpers={props.helpers} onPick={op.pick} onPeek={op.peek} onRemove={op.remove} />
  );
  const section = (group: MenuSection) => (
    <section key={group.kind ?? group.label} data-search-group="" data-kind={group.kind}>
      <h3>{group.label}{group.href ? (
        <a href={group.href} onMouseDown={keep} onClick={event => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault(); op.openPath(group.href!);
        }}>{group.action || 'verTodo'}</a>
      ) : null}</h3>
      {group.kind ? <div data-search-items="">{group.options.map(option)}</div> : group.options.map(option)}
      {group.more ? option(group.more) : null}
    </section>
  );
  const columns = (left: MenuSection[], right: MenuSection[]) => (left.length || right.length ? (
    <div data-search-results="" data-split={left.length && right.length ? '' : undefined}>
      {left.length ? <div data-search-col="">{left.map(section)}</div> : null}
      {right.length ? <div data-search-col="">{right.map(section)}</div> : null}
    </div>
  ) : null);
  return (
    <div ref={root} data-search-root="" data-search-recommendations={!s.query && s.recommendations.length ? '' : undefined} data-history-limit={limit}>
      {model.tabs ? <Tabs tabs={model.tabs} kind={s.kind} onPick={op.pickKind} wire={props.helpers.wireScroller} /> : null}
      {s.query && model.recent ? section(model.recent) : null}
      {columns(model.left, model.right)}
      {!s.query && model.recent ? section(model.recent) : null}
      {model.empty ? <p data-search-empty="" role="status">No encontrado</p> : null}
    </div>
  );
}

function createOps(props: () => SearchProps, s: Store, menu: () => HTMLElement | null, bump: () => void) {
  const input = () => props().input;
  const focused = () => document.activeElement === input();
  const readHistory = () => s.history.slice(0, props().historyLimit);
  const writeHistory = (list: string[]) => { s.history = list.slice(0, props().historyLimit) };

  const loadHistory = async () => {
    const limit = props().historyLimit;
    if (!limit) { s.history = []; return }
    try {
      const data = await apiGet<{ items?: unknown }>(`/api/search-history?limit=${limit}`);
      s.history = Array.isArray(data.items) ? data.items.map(String) : [];
    } catch {
      // Registro读No到就用手arribaeste: Buscar本身No受影响. 
    }
  };
  /* Buscar本身esSolo读能力; DatosBiblioteca暂时Solo读时, HistorialRegistroDegradar aComo本次página面interior存, 写FalloNo妨碍Buscar.  */
  const rememberSearch = (query: string) => {
    if (!query || !props().historyLimit) return;
    writeHistory([query, ...readHistory().filter((value) => fold(value) !== fold(query))]);
    void apiSend('/api/search-history', { query }).catch(() => null);
  };
  const loadPool = async () => {
    const request = ++s.poolRequest;
    s.pool = [];
    const field = input();
    field.dataset.suggestion = '';
    field.placeholder = 'BuscarColección';
    try {
      const names = await props().helpers.pool();
      if (request !== s.poolRequest) return;
      s.pool = names;
      const pick = names[Math.floor(Math.random() * names.length)] || '';
      field.dataset.suggestion = pick;
      field.placeholder = pick || 'BuscarColección';
    } catch {
      // RecomendadoNopuede用时仍puede直continuarIntroducirBuscar. 
    }
  };
  const loadRecommendations = async () => {
    if (!props().helpers.recommendations) return;
    const request = ++s.recommendationRequest;
    try {
      const groups = await props().helpers.recommendations!();
      if (request !== s.recommendationRequest) return;
      s.recommendations = groups;
      if (focused() && !input().value.trim()) paint();
    } catch {
      // Recomendado读取Fallo仍puedeBuscar, 保Deja手en laRecomendado. 
    }
  };
  /* Agrupar顺序 y 每组名字都由 `/api/suggest` 给出, aquí照抄. lentoantiguoRespuestaNo许盖掉Nuevo: 连敲两字时
     先发ese次完Todopuede能posterior回来.  */
  const loadSuggestions = async (query: string, kind = '') => {
    const request = ++s.suggestRequest;
    if (!kind) s.asked = query;
    try {
      const data = await apiGet<SuggestResponse>(`/api/suggest?q=${encodeURIComponent(query)}`
        + (kind ? `&kind=${kind}` : '') + `&limit=${SUGGEST_ONE_KIND}`);
      if (request !== s.suggestRequest) return;
      s.suggestFor = data.q || '';
      s.groups = data.groups || [];
      if (!kind && s.groups.length > 1) {
        s.groups = s.groups.map((group) => ({ ...group, items: group.items.slice(0, SUGGEST_EACH) }));
      }
      if (!kind) s.tabs = s.groups.map(({ kind: k, label, total }) => ({ kind: k, label, total }));
    } catch {
      if (request === s.suggestRequest) { s.suggestFor = query; s.groups = [] }
    }
  };

  const isOpen = () => { const el = menu(); return !!el && !el.hidden };
  const close = () => {
    s.recommendationRequest++;
    const el = menu();
    if (el) props().helpers.dismiss(el);
    s.active = -1;
    bump();
  };
  /** 按此刻Introduciry手en laDatos画uno遍: Con东西就掀开, Sin就收起. Recomendado每画uno次洗uno次.  */
  const paint = () => {
    s.query = input().value.trim();
    s.picks = s.query ? [] : shufflePicks(s.pool, readHistory());
    s.active = -1;
    const el = menu();
    if (el) {
      if (hasContent(modelOf(s))) props().helpers.present(el);
      else props().helpers.dismiss(el);
    }
    bump();
  };
  /* 每unoabajoIntroducir都排uno次Completar, peroSolo发uno次Por favor求. 先按手头yaConcontenidopesado画uno遍; Por favor求返回时核对焦点, 
     点击página面或移到其他ControlesposteriorNo再Abrir建议.  */
  const refresh = () => {
    s.active = -1;
    // 换词就回到"Todo": Anterior词选en procesoeseuno类, este词abajopuede能uno都Sin. 
    s.kind = '';
    clearTimeout(s.timer);
    const query = input().value.trim();
    if (!query) { s.suggestFor = ''; s.groups = [] }
    if (isOpen()) paint();
    if (!query) return;
    s.timer = window.setTimeout(() => void loadSuggestions(query).then(() => { if (focused()) paint() }), SUGGEST_DEBOUNCE);
  };
  const pickKind = (kind: string) => {
    const query = input().value.trim();
    if (!query || kind === s.kind) return;
    s.kind = kind;
    clearTimeout(s.timer);
    paint();
    s.rewind = true;
    void loadSuggestions(query, kind).then(() => { if (focused() && s.kind === kind) paint() });
  };
  const options = () => (isOpen() ? modelOf(s).options : []);
  const move = (step: number) => {
    const list = options();
    if (!list.length) return false;
    s.active = (s.active + step + list.length) % list.length;
    s.reveal = true;
    bump();
    return true;
  };
  const runSearch = (useSuggestion: boolean, committed: boolean) => {
    const field = input();
    let query = field.value.trim();
    if (useSuggestion && !query) { query = field.dataset.suggestion || ''; field.value = query }
    if (committed) rememberSearch(query);
    props().actions.search(query);
  };
  /* 人, 公司 y Serie点开就es资料página, No绕uno趟Buscar: 按名字搜出来esuno屏Obras, 而用户点es"este人". 
     记进BuscarRegistroeseste名字, abajo次聚焦还找得回来.  */
  const openEntity = (kind: string, name: string) => {
    input().blur();
    rememberSearch(name);
    props().actions.openEntity(kind, name);
  };
  /** 选en procesouno行, 点它 y 回车落En同uno处. Obras开Detalles, Con资料página开资料página, 其余按este词搜.  */
  const choose = (entry: SearchOption) => {
    if (entry.type === 'suggest' && entry.item.followMedia && entry.item.id && props().actions.openFollow) {
      input().blur();
      props().actions.openFollow!(entry.item.id, entry.item.followMedia, entry.item.mediaIndex ?? null);
      return;
    }
    if (entry.type === 'suggest' && entry.item.href) { openPath(entry.item.href); return }
    if (entry.type === 'more') { runSearch(false, true); input().blur(); return }
    if (entry.type === 'suggest' && entry.kind === 'asset' && entry.item.id != null) {
      input().blur();
      props().actions.openItem(entry.item.id);
      return;
    }
    if (entry.type === 'suggest' && SUGGEST_PROFILE_KINDS.has(entry.kind)) { openEntity(entry.kind, entry.value); return }
    input().value = entry.value;
    runSearch(false, true);
  };
  const openPath = (path: string) => { close(); input().blur(); props().actions.openPath?.(path) };
  const pick = (entry: SearchOption) => { close(); choose(entry) };
  const peek = (card: SuggestCard) => { close(); input().blur(); props().actions.openItem(card.id) };
  const remove = async (value: string) => {
    await apiSend('/api/search-history', { operation: 'remove', query: value }).catch(() => null);
    writeHistory(readHistory().filter((row) => fold(row) !== fold(value)));
    // 行没, Clave盘选en procesoabajo标就指No回同uno项, 归ceropesado来. RecomendadoNopesado洗: 删unoRegistro却换uno批Recomendado, ver着像Lista自己跳. 
    s.active = -1;
    bump();
  };

  const key = (event: KeyboardEvent) => {
    if (event.isComposing) return;
    const field = input();
    if (event.key === 'Escape') {
      if (isOpen()) { close(); event.preventDefault(); return }
      if (field.value) {
        props().helpers.clearField(field);
        s.active = -1;
        event.preventDefault();
        refresh();
        return;
      }
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (move(event.key === 'ArrowDown' ? 1 : -1)) event.preventDefault();
      return;
    }
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const picked = options()[s.active];
    close();
    // 选en proceso某uno项时用它Original样Buscar; 没选en proceso才回退到"空Introducir按 Enter 用Recomendado词". 
    if (picked) {
      choose(picked);
      if (picked.type !== 'suggest' || picked.kind !== 'asset') field.blur();
      return;
    }
    runSearch(true, true);
    field.blur();
  };
  const onInput = (event: InputEvent) => {
    if (event.isComposing) return;
    props().helpers.typed(input());
    refresh();
  };
  const focus = () => {
    void loadRecommendations();
    void Promise.all([loadHistory(), loadPool()]).then(() => {
      if (!focused()) return;
      // 带着 `?q=` 进来再点回Introducir框时, 框dentroya经Con词, Completar该跟着este词给. este两Datos回来之anterior
      // 人puede能ya经敲完字, ese词Completar也问过, 同uno词No再问No.dos遍. 
      paint();
      if (input().value.trim() !== s.asked) refresh();
    });
  };
  return { input: onInput, key, focus, close, pick, peek, remove, pickKind, openPath };
}

function Tabs({ tabs, kind, onPick, wire }: {
  tabs: SuggestTab[]; kind: string; onPick(kind: string): void; wire(row: Element | null): void;
}) {
  const row = useRef<HTMLDivElement>(null);
  // estrecho屏página签排Noabajo时derecha缘渐隐, ver得出还能往derecha拨. 
  useLayoutEffect(() => { wire(row.current) }, [wire, tabs]);
  const tab = (k: string, label: string, total?: number) => (
    <button key={k || 'all'} type="button" role="tab" data-suggest-kind={k} aria-selected={kind === k}
      // página签Seleccionar保DejaIntroducir焦点, 便于ContinuarIntroduciry使用方向Clave. 
      onMouseDown={(event) => event.preventDefault()} onClick={() => onPick(k)}>
      {label}{total ? <TabCount value={total} /> : null}
    </button>
  );
  return (
    <div ref={row} data-search-tabs="" role="tablist" aria-label="Ver completado por tipo">
      {tab('', 'Todo')}
      {tabs.map((t) => tab(t.kind, t.label, t.total))}
    </div>
  );
}

const keep = (event: MouseEvent) => event.preventDefault();

function Row({ entry, active, helpers, onPick, onPeek, onRemove }: {
  entry: SearchOption; active: boolean; helpers: SearchProps['helpers'];
  onPick(entry: SearchOption): void; onPeek(card: SuggestCard): void; onRemove(value: string): Promise<void>;
}) {
  const shared = {
    'data-search-value': entry.value, 'data-active': active ? '' : undefined,
    onClick: (event: MouseEvent) => {
      if ((event.target as Element).closest('[data-remove-history]')) return;
      onPick(entry);
    },
  };
  if (entry.type === 'more') {
    return (
      <button type="button" data-search-option="more" {...shared} onMouseDown={keep}>
        verTodo {entry.total.toLocaleString()} 视频
        <Sprite name="chevron-right" />
      </button>
    );
  }
  if (entry.type !== 'suggest') {
    return (
      <div data-search-option="" {...shared}>
        <Sprite name={entry.type === 'history' ? 'history' : 'sparkles'} />
        <span>{entry.value}</span>
        {entry.type === 'history' ? (
          /* 按abajo就 preventDefault, No让EliminarClave焦点从Introducir框抢走: 抢走会触发 `#q` 失焦, eseProcesarDispositivo
             140ms posterior收起Completoabajo拉栏, 于es"删unoRegistro"实际etc.于"关掉Completoabajo拉栏".  */
          <button type="button" data-remove-history={entry.value} aria-label={`EliminarHistorial ${entry.value}`}
            onMouseDown={keep} onClick={(event) => { event.stopPropagation(); void onRemove(entry.value) }}>
            <Sprite name="x" />
          </button>
        ) : null}
      </div>
    );
  }
  const { item, kind } = entry;
  const opens = SUGGEST_PROFILE_KINDS.has(kind) ? kind : undefined;
  if (['asset', 'jav', 'post', 'photo', 'release'].includes(kind)) {
    /* Obras点开esDetalles, NoesunoBuscar词: Completo句TítuloIntroduce回Buscar框, Siguiente次Buscar会因Como其en proceso任何uno字符对Noarriba
       而落空.  */
    const byline = [item.who, item.code ? item.title : ''].filter(Boolean).join(' · ');
    return (
      <button type="button" data-search-option="work" data-open-item={kind === 'asset' ? item.id : undefined} {...shared} onMouseDown={keep}>
        <Cover card={item.card} helpers={helpers} />
        <span data-search-meta=""><span data-search-name=""><span>{item.value}</span></span><span data-search-sub="">{byline}</span></span>
      </button>
    );
  }
  const matched = item.matched ? <span data-search-matched="">{item.matched}</span> : null;
  if (kind === 'performer' || kind === 'creator' || kind === 'author') {
    // uno行dentro摆得abajo几部近作就摆几部; estrechoabajo拉Completo排收起, Datos照给. 
    const works = item.works ?? [];
    const sub = item.subtitle || [`${(item.n ?? 0).toLocaleString()}  video(s)`, item.agency].filter(Boolean).join(' · ');
    return (
      <div data-search-option="person" data-open-entity={opens} {...shared} onMouseDown={keep}>
        <Face item={item} kind={kind} />
        <button type="button" data-search-person="" data-search-meta="" aria-label={`ver ${item.value}`}>
          <span data-search-name=""><span>{item.value}</span>{matched}</span>
          <span data-search-sub="">{sub}</span>
        </button>
        {works.length ? (
          <span data-search-peeks="">
            {works.map((card) => (
              <button key={card.id} type="button" data-open-work={card.id} aria-label={`Abrir ${card.code || item.value}`}
                onMouseDown={keep} onClick={(event) => { event.stopPropagation(); onPeek(card) }}>
                <Cover card={card} helpers={helpers} />
              </button>
            ))}
          </span>
        ) : null}
      </div>
    );
  }
  return (
    <div data-search-option="" data-open-entity={opens} {...shared}>
      {kind === 'studio' || kind === 'agency' ? <Face item={item} kind={kind} /> : null}
      <span>{item.value}</span>
      {matched}
      {item.n ? <span data-search-n="">{item.n.toLocaleString()}</span> : null}
    </div>
  );
}

/** pequeñoImagen y 卡片同uno套取景: 卡片eseuno格(`.pic`)连同dentro面eseImagen都归遗Deja层, aquíSolo定它Conmásancho.  */
function Cover({ card, helpers }: { card: SuggestCard | null | undefined; helpers: SearchProps['helpers'] }) {
  return <span data-search-pic="" dangerouslySetInnerHTML={{ __html: helpers.coverHtml(card) }} />;
}

/** 门面uno律圆片, 走索引página同uno兜底链: 人es实体Imagen → Obra representativaAvatar, Selloes标识, Agenciaes官网
 *  站点圆标; 都取No到就esprimero字母. uno屏几diez, 取派生件.  */
function Face({ item, kind }: { item: SuggestItem; kind: string }) {
  if (item.avatarHtml) return <span data-search-face="" dangerouslySetInnerHTML={{ __html: item.avatarHtml }} />;
  const ref = { id: item.entity_id as number | null | undefined, has_image: item.has_image as boolean | undefined,
    image_version: item.image_version as string | undefined, avatar_focus: item.avatar_focus,
    avatar_stand_in: item.avatar_stand_in as boolean | undefined };
  const html = avatarInner(item.value, ref, (item.rep as number | null | undefined) || null, kind,
    (item.mark as number | null | undefined) || null, item.has_logo ? item.value : '', 'icon', undefined, true);
  return <span data-search-face="" data-kind={kind} dangerouslySetInnerHTML={{ __html: html }} />;
}
