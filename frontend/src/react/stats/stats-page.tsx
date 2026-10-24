/* EstadísticasPágina: DatosBiblioteca此刻样子. 
 *
 * uno屏回答两层问题. arriba面cuatro卡既es读数也espágina签—馆藏, ver过, contenidoEtiqueta, 使用空间, 点哪
 * 就Enabajo面展开哪uno层细节; 再abajo面ese按维度排: contenidoEtiqueta排行, Recientever过, Etiqueta来源. 
 * cuatro卡同时当página签es因ComoesteunopáginaSin别主动作, 读数本身就es入口. 
 *
 * página签走 React Aria  `Tabs`: `role=tablist`/`tab`/`tabpanel`, izquierdaderecha方向Clavey游标
 * `tabindex` 都由它给, Registrarse表en la `tabs` Entradaespágina面级导航, Noeseste同página切. 
 * 体积y来源名共用 `src/core/index.ts` 口径; Etiqueta界面名称由遗Deja层 `tagLabel` 递进来.  */
import {
  RiDatabase2Line, RiEyeLine, RiHardDrive2Line, RiHistoryLine, RiPriceTag3Line, RiVideoLine,
} from '@remixicon/react';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';

import { fmtSize, LOC } from '@peach/legacy/core';
import { MEDIA_SOURCE_ICONS } from '@peach/legacy/ui';

import { Button, ButtonLink } from '@/components/base/buttons/button';

import { errorMessage } from '../../api';
import type { StatsProps } from '../bundle';
import { BarCard } from '../charts/bar-card';
import { CHART_COLORS } from '../charts/chart-card';
import { ActivityHeat } from '../charts/heat-card';
import { cardClass } from '../components/card';
import { EmptyState } from '../components/empty-state';
import { ExpandableRanking } from '../components/expandable-ranking';
import { Note } from '../components/note';
import { Page } from '../components/page';
import { Progress } from '../components/progress';
import { SEGMENT, SEGMENTED_TRACK, SegmentedTabList } from '../components/segmented';
import { StatCard, statCardClass, STAT_STRIP } from '../components/stat-card';
import { RadialCard } from './radial-card';
import {
  bandRows, fetchStats, fmtCount, known, lengthRows, mediumRows, percentText, playedFor, playedItemUrl,
  reachedShare, replayRows, STATS_KEY, watchedShare, watchNote,
  type Attribution, type Count, type RecentPlay, type StatsData, type StorageVolume, type TagSource, type TopTag,
} from './stats';

/** 收起时露este么más排行. tresdiezuno次铺开会abajo面两面板Completo顶到屏exterior.  */
const RANKING_PREVIEW = 10;

/** Imagen表色跟着arriba面ese读数卡强调色走: 馆藏es `chart-6`, ver过es `chart-5`(`StatCard`  `accent`).  */
const INVENTORY_COLOR = CHART_COLORS[5];
const VIEWING_COLOR = CHART_COLORS[4];

const CARD = `${cardClass()} flex flex-col gap-4`;

const NO_VIDEO_HINT = 'Añadir directorio de medios o seguir fuenteposterior, aquí会MostrarColecciónEstadísticas. ';
const NO_TAG_HINT = 'Completar detalles或AñadirEtiquetaposterior, aquí会MostrarColecciónEn procesoEtiquetas de contenido. ';
const NO_WATCH_HINT = 'IniciarReproducirposterior, aquí会MostrarRecienteVisualización real证据. ';
const NO_TAG_SOURCE_HINT = 'Scraping或Manual打标之posterior, aquí会Mostrar每 fuente(s)SobrescribirmásmenosVideos. ';
const NO_VOLUME_HINT = 'AñadirDirectorio de mediosposterior, aquí会Mostrar存储Vacío间. ';
const NO_LIBRARY_HINT = 'Directorio de medios归进Biblioteca de mediosposterior, aquí会按BibliotecaMostrarVideos数. ';
const NO_LENGTH_HINT = '探测Duraciónposterior, aquí会MostrarDuración分布. ';
const NO_QUALITY_HINT = '探测Calidad de imagenposterior, aquí会MostrarCalidad de imagen分布. ';
const NO_PLAY_TIME_HINT = 'IniciarReproducirposterior, aquí会MostrarReproducir落Enuno周哪些时段. ';
const NO_REPLAY_HINT = 'IniciarReproducirposterior, aquí会Mostrar每 obra(s)播几次. ';

/** Progreso读数: 超出Total数时按满格画, 读屏值也No越过arriba限.  */
const within = (value: number, max: number) => Math.min(Math.max(value, 0), max);

/** uno格事实: uno名字配uno数. 面取浮层eseuno档(antiguo `.insightfacts .kv`  `--surface`), 
 *  比卡面亮uno级.  */
function Fact({ term, value }: { term: string; value: Count }) {
  return (
    <div className="flex min-h-16 min-w-0 flex-col gap-1.5 rounded-2lg bg-background-primary-default p-3">
      <span className="text-caption-1-regular text-text-secondary">{term}</span>
      <b className="text-title-3-medium tabular-nums text-text-primary">{fmtCount(value)}</b>
    </div>
  );
}

/** uno带Progreso覆盖率: 读数, 占比yese共用同uno对分子分母.  */
function Coverage({ term, value, total }: { term: string; value: Count; total: number }) {
  const max = Math.max(total, 1);
  return (
    <div className="flex flex-col gap-1.5 border-b border-separator-border py-3 last:border-b-0">
      <p className="flex items-baseline justify-between gap-3 text-body-2-regular text-text-primary">
        <span>{term}</span>
        <b className="tabular-nums">
          {fmtCount(value)}
          {known(value)
            ? <span className="ml-1.5 text-caption-1-regular text-text-secondary">{percentText(value, total)}</span>
            : null}
        </b>
      </p>
      <Progress label={`${term}: ${fmtCount(value)} / ${total.toLocaleString()}`}
        value={known(value) ? within(value, max) : 0} max={max} />
    </div>
  );
}

/** Detalleseseuno格izquierda栏: uno句Categoría, unogrande数, uno句它单. 
 *
 * 两栏之间No画线: antiguo `board.css` 专门 `.insightcopy`  `border-right` 清成 `border:0`, 
 * unoIntroduce充卡dentro再切uno刀, ver起来就es两卡挤Enuno起.  */
function Headline({ term, figure, unit }: { term: string; figure: string; unit: string }) {
  return (
    <div className="flex shrink-0 flex-col gap-0.5 pb-5 md:w-64 md:pr-6 md:pb-0">
      <span className="text-caption-1-regular text-text-secondary">{term}</span>
      <b className="text-display-4-medium tabular-nums text-text-primary">{figure}</b>
      <span className="text-body-2-regular text-text-secondary">{unit}</span>
    </div>
  );
}

/** Detalleseseuno格: izquierda边uno读数, derecha边它展开.  */
function Detail({ headline, children }: { headline: ReactNode; children: ReactNode }) {
  return (
    <div className={`${CARD} md:flex-row md:gap-6`}>
      {headline}
      <div className="min-w-0 grow">{children}</div>
    </div>
  );
}

function InventoryDetail({ data, configurable, openMediaSettings }: { data: StatsData } & StatsProps) {
  const videos = data.by_loc.reduce((sum, row) => sum + row.videos, 0);
  if (!videos) {
    return (
      <EmptyState shell="plain" icon={RiVideoLine} title="Sin videos todavía" actions={
        <>
          {configurable
            ? <Button size="small" onClick={openMediaSettings}>AñadirDirectorio de medios</Button>
            : null}
          <ButtonLink variant="secondary" href="/subscriptions?tab=add" size="small">Agregar seguimiento</ButtonLink>
        </>
      }>{NO_VIDEO_HINT}</EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="inline-grid w-full gap-5 md:grid-cols-2">
        <RadialCard title="Nube y local" empty={NO_VIDEO_HINT} rows={data.by_loc.map((row) => (
          { name: LOC[row.k] ?? row.k, value: row.videos, bytes: row.bytes, mark: MEDIA_SOURCE_ICONS[row.k] || 'database' }))} />
        <RadialCard title="Biblioteca de medios" empty={NO_LIBRARY_HINT} rows={data.by_library.map((row) => (
          { name: row.name, value: row.videos, bytes: row.bytes, mark: MEDIA_SOURCE_ICONS[row.icon] || row.icon || 'database' }))} />
      </div>
      <div className="inline-grid w-full gap-5 md:grid-cols-2 xl:grid-cols-3">
        <BarCard title="Duración" unit=" video(s)" series="Videos" color={INVENTORY_COLOR}
          rows={lengthRows(data.by_length)} empty={NO_LENGTH_HINT} />
        <BarCard title="Calidad de imagen" unit=" video(s)" series="Videos" color={INVENTORY_COLOR}
          rows={bandRows(data.by_quality)} empty={NO_QUALITY_HINT} />
        <BarCard title="Tipo de archivo" unit=" elemento(s)" series="Resultado目" color={INVENTORY_COLOR} layout="horizontal"
          rows={mediumRows(data.by_medium)} empty={NO_VIDEO_HINT} />
      </div>
    </div>
  );
}

/** ver过eseuno层Imagen: Recienteuno次Reproducir落En什么时候,  y 每Obras播几次.  */
function ViewingCharts({ data }: { data: StatsData }) {
  return (
    <>
      <ActivityHeat activity={data.play_activity} title="Tiempo de reproducción" dailyTitle="每日Reproducir"
        words={{ unit: ' obra(s)', series: 'Obra', cellUnit: ' obra(s)' }} tone={5} empty={NO_PLAY_TIME_HINT} />
      <BarCard title="Reproducir次数" unit=" obra(s)" series="Obra" color={VIEWING_COLOR}
        rows={replayRows(data.replays)} empty={NO_REPLAY_HINT} />
    </>
  );
}

function CoverageDetail({ attribution }: { attribution: Attribution }) {
  const videos = attribution.videos;
  return (
    <div className="flex flex-col">
      <Coverage term="ConCreador" value={attribution.creator} total={videos} />
      <Coverage term="ConCódigo JAV" value={attribution.code} total={videos} />
      <Coverage term="ConSello" value={attribution.studio} total={videos} />
      <Coverage term="Ya抽帧" value={attribution.thumb} total={videos} />
      <Coverage term="Ya探测Duración" value={attribution.duration} total={videos} />
    </div>
  );
}

/** uno卷uno行, y覆盖率同uno节律: 名字配ya用量y占比, abajo面unoProgreso, 再abajo面uno行pequeño字
 *  写它挂En哪, 还剩másmenos. 取No到Capacidad卷No画Progreso, 读数eseuno格换成它Estado.  */
function VolumeRow({ volume }: { volume: StorageVolume }) {
  const total = volume.total;
  const used = volume.used ?? 0;
  return (
    <article className="flex min-w-0 flex-col gap-1.5 border-b border-separator-border py-3 last:border-b-0">
      <header className="flex items-baseline justify-between gap-3 text-body-2-regular text-text-primary">
        <h3 className="min-w-0 break-words">{volume.label}</h3>
        {total != null ? (
          <b className="whitespace-nowrap tabular-nums">
            {fmtSize(used)}
            <span className="ml-1.5 text-caption-1-regular text-text-secondary">{percentText(used, total)}</span>
          </b>
        ) : <span className="whitespace-nowrap text-text-secondary">{volume.online ? 'Capacidad no disponible' : 'Sin conexión'}</span>}
      </header>
      {total != null
        ? <Progress label={`${volume.label}Vacío间使用率`} value={within(used, Math.max(total, 1))} max={Math.max(total, 1)} />
        : null}
      <p className="flex justify-between gap-3 text-caption-1-regular text-text-secondary">
        <span className="min-w-0 break-words">{volume.root ?? 'No映射'}</span>
        {total != null
          ? <span className="whitespace-nowrap tabular-nums">{`Disponible ${fmtSize(volume.free ?? 0)} · 共 ${fmtSize(total)}`}</span>
          : null}
      </p>
    </article>
  );
}

function StorageDetail({ volumes, configurable, openMediaSettings }: { volumes: StorageVolume[] } & StatsProps) {
  if (!volumes.length) {
    return (
      <EmptyState shell="plain" icon={RiHardDrive2Line} title="Aún no hay存储Fuente" actions={
        configurable ? <Button size="small" onClick={openMediaSettings}>AñadirDirectorio de medios</Button> : undefined
      }>{NO_VOLUME_HINT}</EmptyState>
    );
  }
  return (
    <div className="flex flex-col">
      {volumes.map((volume) => <VolumeRow key={`${volume.kind}:${volume.label}`} volume={volume} />)}
    </div>
  );
}

function TagRanking({ tags, tagLabel, onTag }: { tags: TopTag[] } & StatsProps) {
  if (!tags.length) {
    return (
      <EmptyState shell="plain" icon={RiPriceTag3Line} title="Aún no hayEtiquetas de contenido"
        actions={<ButtonLink variant="secondary" href="/data-cleanup" size="small">Completar detalles</ButtonLink>}>{NO_TAG_HINT}</EmptyState>
    );
  }
  return (
    <ExpandableRanking previewCount={RANKING_PREVIEW}
      className="inline-grid w-full gap-x-6 gap-y-1 sm:grid-cols-2">
        {tags.map((tag, index) => (
          <li key={`${tag.k}:${index}`} className="min-w-0">
            <button type="button" onClick={() => onTag(tag.k)}
              className="flex min-h-11 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring">
              <span className="w-6 shrink-0 text-caption-1-regular tabular-nums text-text-secondary">{index + 1}</span>
              <span className="min-w-0 grow text-body-2-regular break-words text-text-primary">{tagLabel(tag.k)}</span>
              <b className="text-body-2-medium tabular-nums text-text-secondary">{tag.n.toLocaleString()}</b>
            </button>
          </li>
        ))}
    </ExpandableRanking>
  );
}

function RecentWatches({ rows }: { rows: RecentPlay[] }) {
  if (!rows.length) {
    return (
      <EmptyState shell="plain" icon={RiHistoryLine} title="Aún no hayVerRegistro"
        actions={<ButtonLink variant="secondary" href="/" size="small">Explorar colección</ButtonLink>}>{NO_WATCH_HINT}</EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {rows.map((row) => {
        const real = watchedShare(row);
        return (
          <article key={`${row.kind}:${row.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="min-w-0 grow basis-64">
              <h3 className="min-w-0 text-body-2-medium text-text-primary">
                <a href={playedItemUrl(row)} data-middle-truncate
                  className="block max-w-full overflow-hidden whitespace-nowrap hover:underline">{row.name}</a>
              </h3>
              <p className="flex flex-wrap gap-3 text-caption-1-regular text-text-secondary">
                {row.creator ? <span className="min-w-0 wrap-anywhere">{row.creator}</span> : null}
                <span>{watchNote(row)}</span>
              </p>
            </div>
            <div className="min-w-0 basis-40">
              <Progress label={`Visualización real ${real.toFixed(0)}%`} value={real} />
              <small className="mt-1.5 block text-caption-1-regular text-text-secondary">
                {`真实 ${real.toFixed(0)}% · 到达 ${reachedShare(row).toFixed(0)}%`}
              </small>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function TagSources({ sources, videos }: { sources: TagSource[]; videos: number }) {
  if (!sources.length) {
    return (
      <EmptyState shell="plain" icon={RiPriceTag3Line} title="Aún no hayFuente de etiqueta"
        actions={<ButtonLink variant="secondary" href="/data-cleanup" size="small">Completar detalles</ButtonLink>}>{NO_TAG_SOURCE_HINT}</EmptyState>
    );
  }
  return (
    <div className="inline-grid w-full gap-x-8 gap-y-6 sm:grid-cols-2">
      {sources.map((source) => (
        <article key={source.k} className="flex min-w-0 flex-col gap-1.5">
          <header className="flex items-baseline justify-between gap-3">
            <h3 className="min-w-0 text-body-2-medium break-words text-text-primary">{source.k}</h3>
            <b className="text-body-2-medium whitespace-nowrap text-text-primary">
              {source.assets.toLocaleString()}
              <small className="ml-1 text-caption-1-regular font-normal text-text-secondary"> video(s)</small>
            </b>
          </header>
          <Progress label={`${source.k} SobrescribirVideos`} value={within(source.assets, Math.max(videos, 1))}
            max={Math.max(videos, 1)} />
          <small className="text-caption-1-regular text-text-secondary">{source.n.toLocaleString()} Etiqueta</small>
        </article>
      ))}
    </div>
  );
}

/** uno既es读数也espágina签卡. 选en proceso态es换uno档卡面再压uno圈 2px interior描边, No靠加粗或换字色.  */
function MetricTab(
  { id, label, figure, detail, icon: Icon, accent }:
  { id: string; label: string; figure: string; detail: string; icon: typeof RiEyeLine; accent: number },
) {
  return (
    <Tab id={id} className={statCardClass({ interactive: true, selectable: true })}>
      <StatCard label={label} icon={Icon} accent={accent} figure={figure} footer={detail} />
    </Tab>
  );
}

export function StatsPage(props: StatsProps) {
  const stats = useQuery({ queryKey: STATS_KEY, queryFn: ({ signal }) => fetchStats(signal) });
  const data = stats.data;
  if (!data) {
    return (
      <Page>
        <Note tone="error" title="ColecciónEstadísticas读取Fallido">{stats.error ? errorMessage(stats.error) : 'No disponibleEstadísticasDatos, Por favorActualizarpágina面Reintentar. '}</Note>
      </Page>
    );
  }
  const consumption = data.consumption;
  const storage = data.storage_summary;
  const videos = data.by_loc.reduce((sum, row) => sum + row.videos, 0);
  const bytes = data.by_loc.reduce((sum, row) => sum + row.bytes, 0);
  const coverage = known(data.tag_cov) ? percentText(data.tag_cov, data.attribution.videos) : 'No disponible';
  const covered = `${fmtCount(data.tag_cov)} / ${data.attribution.videos.toLocaleString()}`;
  return (
    <Page>
      <p className="text-caption-1-regular text-text-secondary">
        {`Base de datosEn procesoActualEstadísticas · ${videos.toLocaleString()}  video(s) · ${fmtSize(bytes)}`}
      </p>
      <Tabs defaultSelectedKey="inventory" className="flex flex-col gap-4">
        <TabList aria-label="EstadísticasVista" className={STAT_STRIP}>
          <MetricTab id="inventory" label="Videos de la colección" icon={RiDatabase2Line} accent={0}
            figure={videos.toLocaleString()} detail={fmtSize(bytes)} />
          <MetricTab id="viewing" label="Visto" icon={RiEyeLine} accent={1}
            figure={fmtCount(consumption.played)} detail={playedFor(consumption.play_seconds)} />
          <MetricTab id="coverage" label="Etiquetas de contenido" icon={RiPriceTag3Line} accent={2}
            figure={coverage} detail={covered} />
          <MetricTab id="storage" label="Espacio usado" icon={RiHardDrive2Line} accent={3}
            figure={`${storage.online.toLocaleString()} Volumen`}
            detail={storage.measured ? `Usado ${fmtSize(storage.used)}` : 'Capacidad no disponible'} />
        </TabList>
        <TabPanel id="inventory"><InventoryDetail data={data} {...props} /></TabPanel>
        <TabPanel id="viewing" className="flex flex-col gap-5">
          <Detail headline={<Headline term="Ver" figure={fmtCount(consumption.played)} unit=" obra(s) con historial de reproducción" />}>
            <div className="inline-grid w-full gap-3 sm:grid-cols-2">
              <Fact term="Visualización de la colección" value={consumption.library_played} />
              <Fact term="Ver en línea directamente" value={consumption.online_played} />
              <Fact term="Contador de orgasmos" value={consumption.o_total} />
              <Fact term="Avance rápido" value={consumption.skimmed} />
              <Fact term="Me gusta" value={consumption.liked} />
              <Fact term="明确No me gusta" value={consumption.dislike} />
              <Fact term="Ya lo vi" value={consumption.seen} />
              <Fact term="Papelera" value={consumption.trash} />
            </div>
          </Detail>
          <ViewingCharts data={data} />
        </TabPanel>
        <TabPanel id="coverage">
          <Detail headline={<Headline term="Etiquetas de contenidoSobrescribir" figure={coverage} unit={covered} />}>
            <CoverageDetail attribution={data.attribution} />
          </Detail>
        </TabPanel>
        <TabPanel id="storage">
          <Detail headline={<Headline term="Espacio usado" figure={storage.measured.toLocaleString()} unit=" volumen(es) con capacidad obtenida" />}>
            <StorageDetail volumes={data.storage_volumes} {...props} />
          </Detail>
        </TabPanel>
      </Tabs>
      {/* antiguo `.insightpanel`: Completouno 16px Introduce充卡, página签es卡interior顶arribaese分段Controles.  */}
      <Tabs defaultSelectedKey="tags" className={`${cardClass({ padding: 'none' })} flex flex-col`}>
        <div className="px-4 pt-3">
          <SegmentedTabList aria-label="Estadísticas维度" className={SEGMENTED_TRACK}>
            <Tab id="tags" className={SEGMENT}>Etiquetas de contenido</Tab>
            <Tab id="recent" className={SEGMENT}>Visto recientemente</Tab>
            <Tab id="sources" className={SEGMENT}>Fuente de etiqueta</Tab>
          </SegmentedTabList>
        </div>
        <TabPanel id="tags" className="px-4 pt-3.5 pb-4"><TagRanking tags={data.top_tags} {...props} /></TabPanel>
        <TabPanel id="recent" className="px-4 pt-3.5 pb-4"><RecentWatches rows={data.recent} /></TabPanel>
        <TabPanel id="sources" className="px-4 pt-3.5 pb-4">
          <TagSources sources={data.tag_source} videos={data.attribution.videos} />
        </TabPanel>
      </Tabs>
    </Page>
  );
}
