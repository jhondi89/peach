/* 关注GestionarPágina: 加来源, VerificarActualizar, Quitar来源yGestionar JAV 订阅源. 
 *
 * 来源Credenciales由 Peach ConfiguraciónGestionar, 想要清单于 JAV 分区. 
 *
 * 地址栏y人偏bien各管各(ADR-0031"迁移桥continuar"): 
 * - `tab`, `page`, `sort`, `dir` En地址栏arriba. 判据es"exterior面链continuar得过来吗"—uno关注Lista
 *   地址发给自己En另uno机DispositivoarribaAbrir, ver到要es同uno批, 同uno顺序eseunopágina; Ordenar决定
 *   哪些来源落EnNo.dospágina, 所以它 y página码es同uno件事两medio, No能unoEn地址栏unoNoEn. 
 * - `pageSize`, `layout` esesteExplorar dispositivo人偏bien, 跟着 `appSettings` 走, 由壳读写; 它们
 *   换uno值No会改变"esteunopáginaes哪uno批"含义, 挂到地址栏arribaSolo会让Compartir出去链continuar自己
 *   习惯也unoy带给对方. 
 * 两边都SoloConuno真相: React 拿着实时Estado, 写回哪儿由 props en laese两回调说算. 
 *
 * 版判据来自 docs/reference-sources.json  vercel-report-design: 要避开卡片套卡片, 用
 * 边框补救层级, 成排通栏空, 细pequeño灰字加随意Tamaño de fuente. 所以Agrupar靠Título y uno发丝分隔线, 行y
 * 行之间也Solo用分隔线, No各自套框; Tamaño de fuenteSolo取 BoardUI 排bienese几档 token.  */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';

import { resolveFollowSort } from '../../follow-sort';
import type { FollowManageProps } from '../bundle';
import { cardClass } from '../components/card';
import { Note } from '../components/note';
import { Page } from '../components/page';
import { useHorizontalScroller } from '../components/use-horizontal-scroller';
import { STAT_STRIP_SIX } from '../components/stat-card';
import { AddSource } from './add-source';
import { AliasManager } from './alias-manager';
import { Button } from '@/components/base/buttons/button';
import { FeedSources } from './feed-sources';
import {
  credentialDone, DEFAULT_SORT, FEEDS_KEY, fetchCredentials, fetchFeeds, fetchFollow, FOLLOW_CREDENTIALS_KEY,
  FOLLOW_MANAGE_KEY, groupByAuthor, isBroken, isLayout, keepSelected, pageSizeOf,
  SORT_DEFAULT_DIR, type CredentialData, type FollowData, type Layout, type SortDir, type SortKey,
} from './follow-manage';
import { SourceList } from './source-list';

const TABS = [
  ['list', 'Lista de seguidos'], ['add', 'Agregar seguimiento'], ['feeds', 'Fuente de suscripción JAV'],
] as const;
type TabKey = (typeof TABS)[number][0];

const isTab = (value: unknown): value is TabKey => TABS.some(([key]) => key === value);

/** uno格读数: uno名字, unogrande数, uno句它量词. antiguo `.fmanageoverview>div` Introduce充卡.  */
function Reading({ term, figure, unit }: { term: string; figure: number; unit: string }) {
  return (
    <div className={cardClass({ padding: 'none', className: 'flex flex-col gap-3 px-6 py-5 max-sm:gap-2 max-sm:p-4' })}>
      <span className="text-body-medium text-text-secondary">{term}</span>
      {/* seis数起pequeñouno号字, siete数起再pequeñouno号, seis卡y排时读数 y 单仍Enuno行; 更largo时单落到Siguiente行, No顶出卡片.  */}
      <b data-follow-reading="" className={`flex min-w-0 flex-wrap items-baseline gap-x-1 tabular-nums text-text-primary ${
        figure >= 1000000 ? 'text-headline-medium' : figure >= 100000 ? 'text-title-3-medium' : 'text-title-1-medium'}`}>
        <span className="min-w-0 wrap-anywhere">{figure.toLocaleString()}</span>
        <small className="whitespace-nowrap text-body-2-regular text-text-secondary">{` ${unit}`}</small>
      </b>
    </div>
  );
}

export function FollowManagePage(props: FollowManageProps) {
  const sectionScroll = useHorizontalScroller<HTMLDivElement>();
  const {
    route, savePreference, toast, openFollow, openServiceConfiguration, readOnly, readOnlyMessage, writerUrl,
  } = props;
  const [tab, setTab] = useState<TabKey>(isTab(props.tab) ? props.tab : 'list');
  const [page, setPage] = useState(Math.max(1, Math.floor(props.page) || 1));
  const [sort, setSort] = useState<SortKey>(() => resolveFollowSort(props.sort, props.dir).sort);
  const [dir, setDir] = useState<SortDir>(() => resolveFollowSort(props.sort, props.dir).dir);
  const [layout, setLayout] = useState<Layout>(isLayout(props.layout) ? props.layout : 'default');
  const [pageSize, setPageSize] = useState(pageSizeOf(props.pageSize));
  /* 勾选跨página也跨视Imagen, 身es来源 ID: 换página, 换Ordenar, 从卡片切到表格, 选en proceso仍es同uno批. 
     它No进地址栏—eseesesteuno刻手en launo批东西, Noesesteunopágina身.  */
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set<number>());

  const follow = useQuery({ queryKey: FOLLOW_MANAGE_KEY, queryFn: ({ signal }) => fetchFollow(signal) });
  const credentials = useQuery({
    queryKey: FOLLOW_CREDENTIALS_KEY, queryFn: ({ signal }) => fetchCredentials(signal),
  });
  /*  y  JAV 订阅源página签同uno缓存: 读数y表格veres同uno次读取.  */
  const feeds = useQuery({ queryKey: FEEDS_KEY, queryFn: ({ signal }) => fetchFeeds(signal) });
  const data: FollowData = follow.data || { sources: [] };
  const creds: CredentialData = credentials.data || { root: '', providers: [] };
  const sources = data.sources;

  /* 删掉来源No该还占着计数: 清单换uno就ya经NoEndentro面 ID 丢掉.  */
  useEffect(() => {
    setSelected((now) => {
      const next = keepSelected(now, sources);
      return next.size === now.size ? now : next;
    });
  }, [sources]);

  /* Predeterminado值传空串: 哪uno项算PredeterminadoSoloConesteuno边知道(`DEFAULT_SORT` y每uno档Predeterminado方向都En
     Datos层), 壳照este判据决定写No写进地址栏, No必En它ese边再抄unoPredeterminado表.  */
  const go = (next: Partial<{ tab: TabKey; page: number; sort: SortKey; dir: SortDir }>) => {
    const nextSort = next.sort ?? sort;
    const nextDir = next.dir ?? dir;
    route({
      tab: next.tab ?? tab,
      page: next.page ?? page,
      sort: nextSort === DEFAULT_SORT ? '' : nextSort,
      dir: nextDir === SORT_DEFAULT_DIR[nextSort] ? '' : nextDir,
    });
  };

  const groups = groupByAuthor(sources);
  const broken = sources.filter(isBroken).length;
  const enabled = sources.filter((source) => source.enabled).length;
  const pending = (creds.providers || []).filter(
    (row) => row.requirement === 'required' && !credentialDone(row)).length;
  /* 按人数: unoActriz常Con本名página y antiguo艺名página两源, 订es她este人. 没挂人物源各算uno.  */
  const subscribed = new Set((feeds.data?.sources || []).map(
    (source) => source.entity_id ?? `source-${source.id}`)).size;

  return (
    <Page>
      {readOnly ? (
        <Note tone="warning" title="Solo navegación local"
          extra={writerUrl
            ? <p className="text-body-2-regular">
                <a href={writerUrl} className="text-text-primary underline underline-offset-2">
                  anterior往写入端Gestionar关注
                </a>
              </p>
            : undefined}>
          {readOnlyMessage}
        </Note>
      ) : null}

      {/* anteriorcuatroes关注, posterior两es JAV 订阅源: 订几, 拉回来Nuevas obras还Con几没ver.  */}
      <div className={STAT_STRIP_SIX} aria-label="Seguir概览">
        <Reading term="Seguir creador" figure={groups.length} unit=" resultado(s)" />
        <Reading term="Activar fuente" figure={enabled} unit={`/ ${sources.length}`} />
        <Reading term="Error de verificación" figure={broken} unit=" fuente(s)" />
        <Reading term="Actualizaciones sin ver" figure={data.counts?.new || 0} unit="Resultado" />
        <Reading term="Suscripción JAV" figure={subscribed} unit=" resultado(s)" />
        <Reading term="Nuevas obras sin ver" figure={feeds.data?.unread || 0} unit="Resultado" />
      </div>

      <Tabs selectedKey={tab} onSelectionChange={(key) => {
        const next = String(key);
        if (!isTab(next)) return;
        setTab(next);
        go({ tab: next });
      }} className="flex flex-col gap-6">
        <TabList ref={sectionScroll} aria-label="Gestionar seguidos区域" data-section-nav data-section-items
          className="flex max-w-full flex-nowrap overflow-x-auto">
          {TABS.map(([key, name]) => (
            <Tab key={key} id={key} className="cursor-pointer whitespace-nowrap">{name}</Tab>
          ))}
        </TabList>

        <TabPanel id="list" className="flex flex-col gap-4">
          <SourceList data={data} sort={sort} dir={dir} page={page} layout={layout}
            pageSize={pageSize} selected={selected} readOnly={readOnly} toast={toast}
            openFollow={openFollow}
            onSort={(nextSort, nextDir) => {
              setSort(nextSort);
              setDir(nextDir);
              setPage(1);
              go({ sort: nextSort, dir: nextDir, page: 1 });
            }}
            onPage={(next) => { setPage(next); go({ page: next }) }}
            onSelected={setSelected}
            onLayout={(next) => {
              setLayout(next);
              setPage(1);
              savePreference({ layout: next });
              go({ page: 1 });
            }}
            onPageSize={(next) => {
              setPageSize(next);
              setPage(1);
              savePreference({ pageSize: next });
              go({ page: 1 });
            }} />
        </TabPanel>

        <TabPanel id="add" className="flex flex-col gap-8">
          <AddSource data={data} credentials={creds} readOnly={readOnly} toast={toast}
            openCredentials={openServiceConfiguration} />
          <AliasManager groups={data.author_aliases || []} readOnly={readOnly} toast={toast}
            suggestions={data.alias_suggestions || []} sources={data.sources} />
        </TabPanel>

        <TabPanel id="feeds" className="flex flex-col gap-4">
          <FeedSources readOnly={readOnly} toast={toast} />
        </TabPanel>

      </Tabs>
      <div><Button variant="secondary" onClick={openServiceConfiguration}>来源y订阅Configuración{pending ? `(${pending})` : ''}</Button></div>
    </Page>
  );
}
