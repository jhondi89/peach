/* 口味Página: 两套证据说同uno件事. 
 *
 * izquierda边esExplorar dispositivoRegistro(este机Dispositivoarriba读到, 或从别处导进来私ConExportar), derecha边es Peach 自己
 * 观ver行Como. 两套各Con自己读数, Imagen y 名次, 由顶en lapágina签CompletoCambiar—它们es两证据, Noes
 * 同unoDatos两画法, y排摆会被读成互相印证. 
 *
 * AnálisisRango带En `queryKey` arriba(`['taste', window]`), Cambiar时 `keepPreviousData` Deja住Anterior: 
 * esteuno屏结构No变, SoloCon数En变, 退回骨架etc.于ya经读到东西收走再放回来. Rango本身es
 * 组件Estado, No进地址栏: 路由仍归遗Deja壳, 进esteunopágina就es从"TodoTiempo"pesadoNuevoveruno遍. esteunopáginaNo设
 * `staleTime`, 所以换到哪Rango都pesado取uno趟—Importar或Quitar之posterior回到先anteriorver过Rango, 读到es写
 * 之posterior数, 而Noes缓存dentroese写之anterior. 
 *
 * "读取Explorar dispositivoHistorial"esposteriorTarea, 关掉página面照样En跑. primero屏读到antiguo终态No冒充NuevoResultado: SoloCon本次
 * 点过读取, 或者本次亲眼见过它En跑, 终态才发回执y让 dashboard pesado取(ADR-0031).  */
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  RiArrowDownSLine, RiArrowRightSLine, RiCompassLine, RiDatabase2Line, RiDeleteBinLine,
  RiEyeLine, RiHistoryLine, RiPriceTag3Line, RiSearchLine, RiThumbDownLine,
  RiThumbUpLine, RiUploadLine, RiBookmarkLine,
} from '@remixicon/react';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Popover, Tab, TabPanel, Tabs } from 'react-aria-components';
import { MenuDialog as Dialog } from '../components/menu-dialog';

import { avatarInner } from '@peach/card-art';
import { firstGrapheme, fmtSize, siteMarkUrl } from '@peach/legacy/core';
import { confirmModal } from '@peach/legacy/ui';

import { Button } from '@/components/base/buttons/button';
import {
  MENU_ITEM, MENU_ITEM_INTERACTIVE, MENU_POPOVER_SURFACE,
} from '@/components/base/dropdown/menu-styles';
import { Select, SelectItem } from '@/components/base/select/select';
import { cx } from '@/utils/cx';

import { errorMessage } from '../../api';
import { useBackgroundJob } from '../background-job';
import type { TasteProps } from '../bundle';
import { cardClass } from '../components/card';
import { EmptyState } from '../components/empty-state';
import { ExpandableRanking } from '../components/expandable-ranking';
import { LEGACY_AVATAR_IMG } from '../components/legacy-avatar';
import { TaskProgress } from '../components/task-progress';
import { Note } from '../components/note';
import { Page } from '../components/page';
import { Progress } from '../components/progress';
import { SEGMENT, SEGMENTED_TRACK, SegmentedTabList as TabList } from '../components/segmented';
import { StatCard, statCardClass, STAT_STRIP } from '../components/stat-card';
import { queryClient } from '../query';
import { Disclosure } from '../settings/section';
import { busyProps } from '../settings/use-action';
import { ActivityHeat } from '../charts/heat-card';
import { CreatorSankey, RankedBars, TasteRadar } from './charts';
import { BrowserSources, SOURCE_TILE } from './browser-sources';
import {
  DEFAULT_WINDOW, fetchTaste, fetchTasteJob, historySpan, IDLE_POLL_MS, importTasteExport, radarRows,
  rankDetail, rankShares, removeTasteSource, startTasteRefresh, tasteDate, tasteDimensions, tasteHours,
  tasteKey, TASTE_REFRESH_KEY, TASTE_WINDOWS, type RankRow, type TasteData, type TasteJob,
} from './taste';

/** 收起时露este么más名次. dosdiezuno次铺开会abajo面几Completo顶到屏exterior.  */
const RANK_PREVIEW = 10;

const MENU_ROW = cx(MENU_ITEM, MENU_ITEM_INTERACTIVE, 'text-body-2-medium');
const CARD = `${cardClass()} flex flex-col gap-4`;
/** 卡en launo格: antiguo `.tastelead`/`.tastesource` 用es浮层eseuno档面, 比卡面亮uno级.  */
const TILE = 'rounded-xl bg-background-primary-default p-3';

/* en proceso文正文写成常量: JSX dentro换行文字会Encontinuar缝处más出uno空格, en proceso文句子dentrover得见.  */
const REFRESH_TITLE = '读取运行 Peach este电脑en laExplorarHistorialy书签';
const NO_SOURCE_HINT = 'Importar或读取Historial de navegaciónposterior, aquí会列出YaRecolectarDispositivo. ';
const NO_LEAD_HINT = 'Coleccióndentro暂时Sin对得arribaExplorar信号Etiqueta. ';
const NO_CATEGORY_HINT = 'RecolectarHistorial de navegaciónposterior, aquí会Mostrar聚合posteriorPreferencias证据. ';
const GAP_HINT = 'este些词EnHistorial de navegaciónEn proceso出现, pero Reproducido en PeachRegistroAún no hay对应证据';
const NO_BROWSER_TAG_HINT = 'RecolectarHistorial de navegaciónposterior, aquí会列出Explorar过Etiqueta. ';
const NO_BROWSER_CREATOR_HINT = 'RecolectarHistorial de navegaciónposterior, aquí会列出Explorar过Creador. ';
const NO_DOMAIN_HINT = 'RecolectarHistorial de navegaciónposterior, aquí会列出常AccesoSitio web. ';
const NO_PEACH_TAG_HINT = 'En Peach dentroReproducir或ValoraciónObraposterior, aquí会列出对应Etiqueta. ';
const NO_PEACH_CREATOR_HINT = 'En Peach dentroReproducir或ValoraciónObraposterior, aquí会列出对应Creador. ';
const NO_PEACH_PERFORMER_HINT = 'En Peach dentroReproducir或ValoraciónObraposterior, aquí会列出对应Actriz. ';
const GUIDE_LOCAL = 'En运行 Peach 电脑arriba使用Explorar dispositivo: 点arriba面"读取Historial del navegador". ';
const GUIDE_REMOTE = 'RegistroEnOtroDispositivoarriba: ExportarArchivoposterior, Seleccionar"ImportarHistorialArchivo"或"Importar书签Archivo". 书签支持Explorar dispositivoExportar HTML Archivo y  Chromium Bookmarks JSON Archivo. ';
const GUIDE_REFRESH = 'NecesarioActualizar时再次读取或Importar; Fuente de datospuedeEnpágina面底 título(s)Quitar. ';
const REMOVE_BODY = 'Eliminareste fuente(s)YaImportarRegistro, OriginalArchivoConservar. 若Explorar dispositivo仍Activar, abajo次读取会再次Importar. ';

/** OmitirGuíaesesteExplorar dispositivo持久偏bien,  y AnálisisResultadoSin关, 所以No进 Query.  */
export const TASTE_GUIDE_KEY = 'peach-taste-guide-dismissed';

type Glyph = typeof RiEyeLine;

/** uno格读数: uno名字, unogrande数, uno句它来历.  y Estadísticaspágina读数卡es同uno卡.  */
function SummaryCard({ icon: Icon, term, figure, detail, detailTitle, accent }:
{ icon: Glyph; term: string; figure: string; detail?: string; detailTitle?: string; accent: number }) {
  return (
    <div className={statCardClass()}>
      <StatCard label={term} icon={Icon} accent={accent} figure={figure}
        footer={<span className="block min-w-0 truncate" title={detailTitle || detail}>{detail ?? ''}</span>} />
    </div>
  );
}

/** 站点圆标: 先垫primero字母, 服务端ese圆标叠arriba去; 取No到就 `<img>` 摘掉, 露出primero字母. 
 *
 *  圆标走 `/site-mark`, Explorar dispositivoNo向对方站点也No向任何No.tres方Imagen标Proxy发Por favor求—esePor favor求
 *  会逐报出esteuno列en la每uno站, 换回来Soloesuno 16px Imagen.  */
function SiteAvatar({ name, domain }: { name: string; domain: string }) {
  return (
    <span className="relative inline-grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-background-tertiary-default text-caption-1-medium text-text-secondary">
      {firstGrapheme(name).toUpperCase()}
      <img src={siteMarkUrl({ domain })} alt="" loading="lazy" width={20} height={20}
        onError={(event) => event.currentTarget.remove()}
        className="absolute size-5 object-contain" />
    </span>
  );
}

/** 实体圆标. `card-art`  `avatarInner` es唯unoese回落链实现, página面Nopesado画uno遍.  */
function EntityAvatar({ html }: { html: string }) {
  return (
    <span className={`relative inline-grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-background-tertiary-default text-caption-1-medium text-text-secondary ${LEGACY_AVATAR_IMG}`}
      dangerouslySetInnerHTML={{ __html: html }} />
  );
}

interface RankListProps {
  rows: RankRow[];
  /** 点得动时交回给壳信号Tipo(`tag`/`creator`/`performer`). 空串表示esteuno榜Nopuede点.  */
  kind: string;
  /** 每行izquierda边画什么: 实体圆标, 站点圆标, 或什么都No画.  */
  visual: 'entity' | 'domain' | 'creator' | 'none';
  empty: string;
  onSignal: TasteProps['onSignal'];
}

/** uno榜名次. 点得动ese些es按钮, 其余es行—馆藏dentroSin对应Entrada时点进去Solo会esuno空página.  */
function RankList({ rows, kind, visual, empty, onSignal }: RankListProps) {
  if (!rows.length) {
    return <EmptyState shell="plain" icon={RiSearchLine} title="暂Ninguno足够证据">{empty}</EmptyState>;
  }
  const shares = rankShares(rows);
  return (
    <ExpandableRanking previewCount={RANK_PREVIEW}
      className="inline-grid w-full gap-x-7 gap-y-2 sm:grid-cols-2">
        {rows.map((row, index) => {
          const clickable = !!kind && !!row.peach_items;
          const domain = String(row.source_domain || '');
          const body = (
            <>
              {/* 名次铺满Completo行: antiguo `.taste-rank-track` es `position:absolute;inset:0` 加 14%
                  No透明度uno底, Noes文字abajo面ese道细线—uno眼veres行Conmáslargo.  */}
              <svg viewBox="0 0 100 1" preserveAspectRatio="none" aria-hidden
                className="absolute inset-0 -z-10 size-full overflow-hidden rounded-lg opacity-15">
                <rect width={shares[index]} height={1} className="fill-chart-4" />
              </svg>
              <span className="w-6 shrink-0 text-caption-1-regular tabular-nums text-text-secondary">
                {index + 1}
              </span>
              {visual === 'domain' ? <SiteAvatar name={row.name} domain={row.name} /> : null}
              {visual === 'creator' && !row.entity_id && !row.has_avatar && domain
                ? <SiteAvatar name={row.name} domain={domain} /> : null}
              {visual !== 'none' && visual !== 'domain'
                && (row.entity_id || row.has_avatar || !domain)
                ? <EntityAvatar html={avatarInner(
                    row.name,
                    row.entity_id
                      ? { id: row.entity_id, has_image: !!row.has_image, image_version: row.image_version,
                        avatar_focus: row.avatar_focus, avatar_stand_in: row.avatar_stand_in }
                      : null,
                    row.has_avatar ? row.representative_asset_id ?? null : null,
                    visual === 'creator' ? 'creator' : kind || 'performer',
                  )} /> : null}
              <span className="flex min-w-0 grow flex-col gap-0.5">
                <b className="min-w-0 text-body-medium break-words text-text-primary">{row.name}</b>
                <small className="text-caption-1-regular text-text-secondary">{rankDetail(row)}</small>
              </span>
              {clickable ? <RiArrowRightSLine aria-hidden className="size-4 shrink-0 text-text-tertiary" /> : null}
            </>
          );
          const shape = 'relative isolate flex min-h-11 w-full min-w-0 items-center gap-2.5'
            + ' rounded-lg px-3 py-2 text-left';
          return (
            <li key={`${row.name}:${index}`} className="min-w-0">
              {clickable
                ? <button type="button" onClick={() => onSignal(kind, row.name)}
                    className={`${shape} cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring`}>
                    {body}
                  </button>
                : <div className={shape}>{body}</div>}
            </li>
          );
        })}
    </ExpandableRanking>
  );
}

/** uno侧证据维度面板. página签走 React Aria, 切es同uno地方几层名次.  */
function DimensionPanels(
  { label, panels, onSignal }:
  {
    label: string;
    panels: { id: string; name: string; props: Omit<RankListProps, 'onSignal'> }[];
  } & Pick<TasteProps, 'onSignal'>,
) {
  return (
    /* antiguo `.insightpanel`: uno 16px Introduce充卡, página签es卡interior顶arribaese分段Controles.  */
    <Tabs className={`${cardClass({ padding: 'none' })} flex flex-col`}>
      <div className="px-4 pt-3">
        <TabList aria-label={label} className={SEGMENTED_TRACK}>
          {panels.map((panel) => <Tab key={panel.id} id={panel.id} className={SEGMENT}>{panel.name}</Tab>)}
        </TabList>
      </div>
      {panels.map((panel) => (
        <TabPanel key={panel.id} id={panel.id} className="px-4 pt-3.5 pb-4">
          <RankList {...panel.props} onSignal={onSignal} />
        </TabPanel>
      ))}
    </Tabs>
  );
}

/** 口味Resumen: uno句结论, 几要点, 加arriba点进去就能做事.  */
function AnalysisCard({ data, onSignal, navigate }:
{ data: TasteData } & Pick<TasteProps, 'onSignal' | 'navigate'>) {
  const analysis = data.analysis;
  if (!analysis?.headline) return null;
  const confidence = analysis.confidence || {};
  const leads = [
    ...(analysis.explore || []).map((item) => (
      { key: `tag:${item.tag}`, title: item.title, detail: item.detail, act: () => onSignal('tag', item.tag) })),
    ...(analysis.next_steps || []).map((item) => (
      { key: `route:${item.route}`, title: item.title, detail: item.detail, act: () => navigate(item.route) })),
  ];
  return (
    <section className={CARD} aria-label="Resumen de preferencias">
      <header className="flex flex-col gap-2">
        <h3 className="text-title-2-medium text-text-primary">Resumen de preferencias</h3>
        {/* 结论句eseste卡主角: antiguo `.tasteleads .tastelede p` es 20/30 主文字色, 比正文
            grandeuno档, 限ancho 64ch. "Conmásmenos握"es它注脚, antiguo版就esuno句灰字配uno 8px 圆点.  */}
        <p className="max-w-prose text-title-2-regular wrap-anywhere text-text-primary">{analysis.headline}</p>
        <p className="flex flex-wrap items-center gap-2 text-body-2-regular text-text-secondary">
          <i aria-hidden className={`size-2 shrink-0 rounded-full ${confidence.level === 'high'
            ? 'bg-status-lime-text'
            : confidence.level === 'medium' ? 'bg-status-yellow-text' : 'bg-text-tertiary'}`} />
          <span className="min-w-0 wrap-anywhere">{confidence.label || 'Aún aprendiendo'}</span>
        </p>
      </header>
      {analysis.points?.length ? (
        <div className="inline-grid w-full gap-3 sm:grid-cols-2">
          {analysis.points.map((point) => (
            <div key={point.label} className={`flex min-w-0 flex-col gap-1 ${TILE}`}>
              <span className="text-caption-1-regular text-text-secondary">{point.label}</span>
              <b className="text-body-2-medium break-words text-text-primary">{point.text}</b>
            </div>
          ))}
        </div>
      ) : null}
      {leads.length ? (
        <div className="flex flex-col gap-2">
          {leads.map((lead) => (
            <button key={lead.key} type="button" onClick={lead.act}
              className={`flex w-full min-w-0 cursor-pointer items-center gap-3 ${TILE} text-left outline-none hover:bg-background-primary-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring`}>
              <span className="flex min-w-0 grow flex-col gap-1">
                <b className="text-body-2-medium wrap-anywhere text-text-primary">{lead.title}</b>
                <small className="text-caption-1-regular wrap-anywhere text-text-secondary">{lead.detail}</small>
              </span>
              <RiArrowRightSLine aria-hidden className="size-4 shrink-0 text-text-tertiary" />
            </button>
          ))}
        </div>
      ) : <EmptyState shell="plain" icon={RiSearchLine} title="Aún no hay entradas para explorar">{NO_LEAD_HINT}</EmptyState>}
    </section>
  );
}

/** ExplorarRegistro怎么来. ya经Recolectar到Registro, 或Omitir之posterior都No再出现, `?onboarding=1` 进来时直continuar展开.  */
function HistoryGuide({ onboarding, done }: { onboarding: boolean; done: boolean }) {
  const [skipped, setSkipped] = useState(() => {
    try { return localStorage.getItem(TASTE_GUIDE_KEY) === '1' } catch { return false }
  });
  if (done || skipped) return null;
  const skip = () => {
    try { localStorage.setItem(TASTE_GUIDE_KEY, '1') } catch { /* 存储Nopuede用时esteuno次仍然收起 */ }
    setSkipped(true);
  };
  return (
    <div className={cardClass({ padding: 'none', className: 'p-4' })}>
      <Disclosure summary="Explorar dispositivoHistorialRegistroImportarGuía" defaultOpen={onboarding}>
        <p className="text-body-2-regular text-text-secondary">{GUIDE_LOCAL}</p>
        <p className="text-body-2-regular text-text-secondary">{GUIDE_REMOTE}</p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-body-2-regular text-text-secondary">
          <li>
            Chrome: En <a href="https://takeout.google.com/" target="_blank" rel="noopener noreferrer"
              className="text-text-primary underline-offset-4 hover:underline">Google Takeout</a>
            {' '}Seleccionar Chrome HistorialRegistro, Descargar ZIP posterior直continuarImportar. 
          </li>
          <li>
            其他Explorar dispositivo: 用 <a href="https://github.com/purarue/browserexport" target="_blank" rel="noopener noreferrer"
              className="text-text-primary underline-offset-4 hover:underline">browserexport</a>
            {' '}ExportarHistorialRegistro, 再ImportarExportarArchivo. 
          </li>
        </ul>
        <p className="text-body-2-regular text-text-secondary">{GUIDE_REFRESH}</p>
        <span className="self-start">
          <Button variant="secondary" size="small" onClick={skip}>Omitir</Button>
        </span>
      </Disclosure>
    </div>
  );
}

/** 主Clave加unoabajo拉: 读取 y Importares同uno件事两来路, 摊成两按钮读No出哪es常用eseuno. 
 *
 *  菜单No.uno项 y izquierda边ese同名同事—Clave盘 y 读屏用户Solo走菜单esteuno路, menos列uno项就esmenosuno动作.  */
function HistoryActions(
  { busy, onRefresh, onImport, onImportBookmarks }:
  { busy: boolean; onRefresh(): void; onImport(): void; onImportBookmarks(): void },
) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const pick = (act: () => void) => { setOpen(false); act() };
  return (
    <>
      <span data-button-group data-split-button data-variant="primary">
        <Button leadingIcon={RiCompassLine} title={REFRESH_TITLE} onClick={onRefresh} {...busyProps(busy)}>
          读取Explorar dispositivoRegistro
        </Button>
        <Button ref={trigger} iconOnly leadingIcon={RiArrowDownSLine}
          aria-label="Método para obtener más historial de navegación" aria-haspopup="dialog" aria-expanded={open}
          {...busyProps(busy)} onClick={() => { if (!busy) setOpen(true) }} />
      </span>
      <Popover triggerRef={trigger} isOpen={open} onOpenChange={setOpen}
        placement="bottom end" offset={4} className={MENU_POPOVER_SURFACE}>
        <Dialog aria-label="Método para obtener más historial de navegación" className="flex w-52 flex-col gap-1 outline-none">
          <button type="button" className={MENU_ROW} onClick={() => pick(onRefresh)}>
            <RiCompassLine aria-hidden className="size-4 shrink-0" />读取Explorar dispositivoRegistro
          </button>
          <button type="button" className={MENU_ROW} onClick={() => pick(onImport)}>
            <RiUploadLine aria-hidden className="size-4 shrink-0" />ImportarHistorialArchivo
          </button>
          <button type="button" className={MENU_ROW} onClick={() => pick(onImportBookmarks)}>
            <RiBookmarkLine aria-hidden className="size-4 shrink-0" />Importar书签Archivo
          </button>
        </Dialog>
      </Popover>
    </>
  );
}

/** yaRecolectar设备. QuitarSolo影响Análisis, OriginalExportarArchivo仍En本机.  */
function SourceList(
  { sources, browsers, window: range, toast }:
  { sources: NonNullable<TasteData['sources']>; browsers: NonNullable<TasteData['browsers']>; window: string } & Pick<TasteProps, 'toast'>,
) {
  const remove = useMutation({
    mutationFn: (sourceKey: string) => removeTasteSource(sourceKey, range),
    onSuccess: (result) => {
      // 服务端连esteunoRangoNuevo dashboard uno起回, 换进缓存即puede, NoComouno次QuitarCompletopáginapesado取uno遍. 
      queryClient.setQueryData(tasteKey(range), result.dashboard);
      toast('YaQuitarPreferenciasFuente de datos');
    },
  });
  return (
    <BrowserSources browsers={browsers} sources={sources} range={range}>
      {remove.error ? <div className="sm:col-span-2"><Note tone="error">{errorMessage(remove.error)}</Note></div> : null}
      {sources.length ? (
        <>
          {sources.filter(source => !browsers.some(browser => browser.source_keys?.includes(source.source_key))).map((source) => (
            <div key={source.source_key} data-taste-source="import"
              className={SOURCE_TILE}>
              <span className="inline-grid size-8 shrink-0 place-items-center rounded-lg text-text-secondary">
                {source.browser === 'browserexport'
                  ? <RiUploadLine aria-hidden className="size-4" />
                  : <RiDatabase2Line aria-hidden className="size-4" />}
              </span>
              <span className="flex min-w-0 grow flex-col gap-0.5">
                <b className="min-w-0 text-body-2-medium break-words text-text-primary">{source.profile}</b>
                <small className="min-w-0 text-caption-1-regular break-words text-text-secondary">
                  {`ImportarArchivo · ${source.host} · ${Number(source.visits || source.bookmarks || 0).toLocaleString()} ${source.bookmarks ? '书签' : 'ResultadoHistorial'}`}
                </small>
              </span>
              <Button variant="secondary" size="small" aria-label={`Quitar ${source.profile}`} className="shrink-0"
                iconOnly leadingIcon={RiDeleteBinLine} {...busyProps(remove.isPending)}
                onClick={() => {
                  if (remove.isPending) return;
                  void confirmModal({
                    title: 'QuitarPreferenciasFuente de datos', body: REMOVE_BODY, confirmLabel: 'QuitarPreferenciasFuente de datos',
                    onConfirm: () => remove.mutateAsync(source.source_key),
                  });
                }} />
            </div>
          ))}
        </>
      ) : !browsers.length ? <EmptyState shell="plain" icon={RiDatabase2Line} title="Aún no hay fuentes de datos">{NO_SOURCE_HINT}</EmptyState> : null}
    </BrowserSources>
  );
}

export function TastePage(props: TasteProps) {
  const { onSignal, navigate, toast, onboarding } = props;
  const [range, setRange] = useState(DEFAULT_WINDOW);
  const [evidence, setEvidence] = useState('browser');
  const file = useRef<HTMLInputElement>(null);
  const bookmarkFile = useRef<HTMLInputElement>(null);

  const taste = useQuery({
    queryKey: tasteKey(range),
    queryFn: ({ signal }) => fetchTaste(range, signal),
    /* 换Rango时Deja住Anterior: esteuno屏结构No变, SoloCon数En变. 退回骨架就esya经读到东西
       收走再放回来, 而服务端eseuno层缓存másmedio立刻就回来.  */
    placeholderData: keepPreviousData,
  });
  const { job, running, outcome, start: refresh } = useBackgroundJob<TasteJob>({
    queryKey: TASTE_REFRESH_KEY,
    queryFn: ({ signal }) => fetchTasteJob(signal),
    start: () => startTasteRefresh(range),
    /* 读取puede以从引导página或Anterior次会话dentro起来, 闲着也隔uno会儿问uno次.  */
    idlePollMs: IDLE_POLL_MS,
    onFinish: (state) => {
      if (state.status === 'failed') return;
      void queryClient.invalidateQueries({ queryKey: ['taste'] });
      toast(state.warnings?.length ? 'ParcialHistorial de navegaciónNo disponible' : 'YaActualizarPreferenciasAnálisis');
    },
  });
  const load = useMutation({
    mutationFn: (chosen: File) => importTasteExport(chosen),
    onSuccess: (result) => {
      /* 服务端回es"TodoTiempo"eseuno, página面跟着切过去: 刚导进来RegistromásmedioNoEn当anterior
         este窗口dentro, DejaEnOriginalRangoarriba会ver见unoSin任何变化Resultado. 先它换进缓存再切Rango, 
         顺序反过来话切过去eseuno刻"TodoTiempo"还es空, página面会Como它más发uno趟Por favor求, 
         回来eseuno又刚换进去esteuno盖掉.  */
      queryClient.setQueryData(tasteKey('all'), result.dashboard);
      setRange('all');
      toast('YaImportarPreferenciasDatos');
    },
  });

  const pickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!chosen || load.isPending) return;
    load.reset();
    load.mutate(chosen);
  };
  const startRefresh = () => {
    if (running || refresh.isPending) return;
    refresh.reset();
    refresh.mutate();
  };

  const data = taste.data;
  if (!data) {
    return (
      <Page>
        <Note tone="error" title="PreferenciasAnálisis读取Fallido">
          {taste.error ? errorMessage(taste.error) : '读取PreferenciasAnálisisFallido'}
        </Note>
      </Page>
    );
  }
  const summary = data.summary || {};
  const coverage = data.coverage || {};
  const rank = data.rankings || {};
  const storage = data.storage || {};
  const categories = tasteDimensions(rank.browser_categories || []);
  const radar = radarRows(categories).length > 0;
  const gaps = data.gaps || [];
  const tagged = coverage.tagged || 0;
  const identified = coverage.identified || 0;
  const problem = refresh.error ? errorMessage(refresh.error)
    : load.error ? errorMessage(load.error)
    : outcome?.status === 'failed' ? (outcome.error || '读取No disponible')
    : '';

  return (
    <Page>
      <Tabs selectedKey={evidence} onSelectionChange={(key) => setEvidence(String(key))}
        className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* antiguo `.insightswitch`: 证据来源es两互斥视Imagen, 形态es分段ControlesNoes两裸按钮.  */}
          <TabList aria-label="Preferencias证据Fuente" className={SEGMENTED_TRACK}>
            <Tab id="browser" className={SEGMENT}>Historial del navegador</Tab>
            <Tab id="peach" className={SEGMENT}>Interno de Peach</Tab>
          </TabList>
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="AnálisisRango" selectedKey={range}
              onSelectionChange={(key) => { if (key !== null) setRange(String(key)) }}>
              {TASTE_WINDOWS.map(([key, name]) => <SelectItem key={key} id={key}>{name}</SelectItem>)}
            </Select>
            <HistoryActions busy={running || refresh.isPending || load.isPending}
              onRefresh={startRefresh} onImport={() => file.current?.click()}
              onImportBookmarks={() => bookmarkFile.current?.click()} />
            {/* Original生ArchivoSeleccionarDispositivolargo相Nopuede控, 按钮归 BoardUI, Introducir框SoloDeja着continuarArchivo.  */}
            <input ref={file} type="file" tabIndex={-1} aria-hidden className="hidden"
              onChange={pickFile} />
            <input ref={bookmarkFile} type="file" tabIndex={-1} aria-hidden className="hidden"
              data-bookmark-import onChange={pickFile} />
          </div>
        </div>
        <HistoryGuide onboarding={onboarding}
          done={!!(summary.history_sources || data.updated_at)} />
        {/* esteuno趟Enposterior跑, 关掉página面还EnContinuar, 所以EstadoDejaEnpágina面arriba而NoesSolo让按钮转unoabajo.  */}
        <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
          {running ? <TaskProgress label={job?.message || 'CargandoHistorial de navegaciónyActualizarPreferenciasAnálisis'}
            value={job?.checked} total={job?.total} /> : null}
          {load.isPending ? <TaskProgress label="ProcesandoImportarPreferenciasDatos" /> : null}
          {problem ? <Note tone="error">{problem}</Note> : null}
          {outcome?.warnings?.length ? <Note tone="warning">{outcome.warnings.join('; ')}</Note> : null}
        </div>
        <TabPanel id="browser" className="flex flex-col gap-5">
          <div className={STAT_STRIP}>
            <SummaryCard accent={0} icon={RiHistoryLine} term="Historial de navegación"
              figure={Number(summary.history_visits || 0).toLocaleString()}
              detail={historySpan(summary)} detailTitle={`${tasteDate(summary.range_start)}—${tasteDate(summary.range_end)}`} />
            <SummaryCard accent={1} icon={RiPriceTag3Line} term="Dimensión de preferencias"
              figure={categories.length.toLocaleString()} detail={categories[0]?.name || 'aúnNinguno主维度'} />
            <SummaryCard accent={2} icon={RiSearchLine} term="Pistas de navegación" figure={gaps.length.toLocaleString()} />
            <SummaryCard accent={3} icon={RiBookmarkLine} term="Marcadores del navegador"
              figure={Number(summary.bookmarks || 0).toLocaleString()}
              detail={`${Number(storage.exports || 0).toLocaleString()} 私ConExportar · ${fmtSize(storage.bytes || 0)}`} />
          </div>
          {/* 维度No足tres画No成雷达: izquierda栏SoloDejaTítuloyActualizarTiempo, 排行占满Completo卡.  */}
          <section className={radar ? `${CARD} md:flex-row md:gap-6` : CARD} aria-label="Perfil del navegador">
            <div className={radar
              ? 'flex shrink-0 flex-col gap-2 pb-5 md:w-80 md:pr-6 md:pb-0'
              : 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'}>
              <span className="text-caption-1-regular text-text-secondary">Perfil del navegador</span>
              {radar ? <TasteRadar rows={categories} label="Dimensiones principales de preferencias" /> : null}
              <small className="text-caption-1-regular text-text-secondary">
                {data.updated_at ? `Actualizar于 ${tasteDate(data.updated_at)}` : 'aúnNoRecolectarHistorial de navegación'}
              </small>
            </div>
            {/* derecha栏跟着雷达eseuno栏etc.alto(行interiorPredeterminado拉伸), 排行En纵向 flex dentro撑满esteuno栏.  */}
            <div className="flex min-w-0 grow flex-col">
              {categories.length
                ? <RankedBars rows={categories} label="Dimensión de preferencias排名" />
                : <EmptyState shell="plain" icon={RiSearchLine} title="暂NingunoDimensión de preferencias">{NO_CATEGORY_HINT}</EmptyState>}
            </div>
          </section>
          <ActivityHeat activity={data.activity} title="Tiempo de actividad de navegación" dailyTitle="Actividad diaria"
            words={{ unit: 'PreferenciasSitio webAcceso', series: 'Acceso', cellUnit: 'Visita(s)' }} tone={4}
            empty="Aún no hayDisponible于AnálisisPreferenciasSitio webAccesoRegistro. " />
          <CreatorSankey flows={data.creator_flows} />
          <DimensionPanels label="Explorar dispositivoDimensión de preferencias" onSignal={onSignal}
            panels={[
              { id: 'tags', name: 'Etiqueta', props: { rows: rank.browser_tags || [], kind: 'tag', visual: 'none', empty: NO_BROWSER_TAG_HINT } },
              { id: 'creators', name: 'Creador', props: { rows: rank.browser_creators || [], kind: 'creator', visual: 'creator', empty: NO_BROWSER_CREATOR_HINT } },
              { id: 'performers', name: 'Actriz', props: { rows: rank.browser_performers || [], kind: 'performer', visual: 'entity', empty: 'Aún no hayyYa建档ActrizAsociarHistorial de navegación. ' } },
              { id: 'domains', name: 'Sitios más visitados', props: { rows: rank.domains || [], kind: '', visual: 'domain', empty: NO_DOMAIN_HINT } },
              { id: 'gaps', name: 'Pistas de navegación', props: { rows: gaps, kind: '', visual: 'none', empty: GAP_HINT } },
            ]} />
        </TabPanel>
        <TabPanel id="peach" className="flex flex-col gap-5">
          <div className={STAT_STRIP}>
            <SummaryCard accent={0} icon={RiEyeLine} term="Visto en Peach"
              figure={Number(summary.peach_items || 0).toLocaleString()}
              detail={tasteHours(summary.peach_seconds || 0)} />
            <SummaryCard accent={1} icon={RiThumbUpLine} term="Me gusta" figure={Number(summary.liked || 0).toLocaleString()} />
            <SummaryCard accent={2} icon={RiThumbDownLine} term="No es de mi gusto" figure={Number(summary.disliked || 0).toLocaleString()} />
            <SummaryCard accent={3} icon={RiPriceTag3Line} term="Con etiqueta" figure={tagged.toLocaleString()} />
          </div>
          <section className={`${CARD} md:flex-row md:gap-6`} aria-label="Reproducido en Peach">
            <div className="flex shrink-0 flex-col gap-0.5 pb-5 md:w-72 md:pr-6 md:pb-0">
              <span className="text-caption-1-regular text-text-secondary">Reproducido en Peach</span>
              <b className="text-display-4-medium tabular-nums text-text-primary">
                {Number(summary.peach_items || 0).toLocaleString()}
              </b>
              <span className="text-body-2-regular text-text-secondary"> obra(s) con evidencia de comportamiento interno</span>
            </div>
            <div className="flex min-w-0 grow flex-col">
              <CoverageMetric term="Con etiqueta" value={tagged} rest={coverage.untagged || 0} />
              <CoverageMetric term="Con identidad" value={identified} rest={coverage.unidentified || 0} />
            </div>
          </section>
          <DimensionPanels label="Dimensiones de preferencias de Peach" onSignal={onSignal}
            panels={[
              { id: 'tags', name: 'Etiqueta', props: { rows: rank.peach_tags || [], kind: 'tag', visual: 'none', empty: NO_PEACH_TAG_HINT } },
              { id: 'creators', name: 'Creador', props: { rows: rank.peach_creators || [], kind: 'creator', visual: 'creator', empty: NO_PEACH_CREATOR_HINT } },
              { id: 'performers', name: 'Actriz', props: { rows: rank.peach_performers || [], kind: 'performer', visual: 'entity', empty: NO_PEACH_PERFORMER_HINT } },
            ]} />
        </TabPanel>
      </Tabs>
      <AnalysisCard data={data} onSignal={onSignal} navigate={navigate} />
      <SourceList sources={data.sources || []} browsers={data.browsers || []} window={range} toast={toast} />
    </Page>
  );
}

/** uno覆盖率: 读数, 待补Cantidadyese共用同uno对分子分母.  */
function CoverageMetric({ term, value, rest }: { term: string; value: number; rest: number }) {
  const total = Math.max(value + rest, 1);
  return (
    <div className="flex flex-col gap-1.5 border-b border-separator-border py-3 last:border-b-0">
      <p className="flex items-baseline justify-between gap-3 text-body-2-regular text-text-primary">
        <span>{term}</span>
        <b className="tabular-nums">
          {value.toLocaleString()}
          <span className="ml-1.5 text-caption-1-regular text-text-secondary">{`${rest.toLocaleString()} 项Pendiente补`}</span>
        </b>
      </p>
      <Progress label={`${term}: ${value.toLocaleString()} / ${total.toLocaleString()}`}
        value={value} max={total} />
    </div>
  );
}
