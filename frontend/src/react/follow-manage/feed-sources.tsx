/* 关注Gestionarpágina"JAV 订阅源"página签: arriba面uno"添加 JAV 订阅"卡, abajo面uno y 关注Lista同unoexterior观表, 
 * uno行uno源, 名字anteriores她资料Imagen, 列出Tipo, 来源, Estado, 频率, Última vez拉取yAgregar, 行尾es启用开关, 
 * 拉取ClaveyQuitarClave(ADR-0042). 行尾estetres样 y 关注Listaeseuno行unouno对应, 两表ver起来esuno回事. 
 *
 * 订阅从人物página"订阅Nuevas obras"或aquí按名字进, 两路都No收地址(ADR-0047, ADR-0083). 拉回来
 * Nuevas obras排Enprimeropáginay人物páginaFiltrar栏abajo面eseuno行, NoEnaquí列—aquí再列uno遍就成No.dos入口, 两处
 * ya读Estado会各说各话. 
 * 服务端es唯uno真相: 开关yQuitar之posteriorpesado取esteuno, NoEnanterior端按Respuesta拼unoNuevo本地Estado. 
 *
 * 勾选 y 关注Lista同uno套: 勾En行primero, 点uno行空白处也es选esteuno行, 选en proceso底部浮出批量操作.  */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createColumnHelper, createPaginatedRowModel, createSortedRowModel, flexRender, rowPaginationFeature,
  rowSelectionFeature, rowSortingFeature, tableFeatures, useTable,
  type RowSelectionState, type SortingState,
} from '@tanstack/react-table';
import { RiDeleteBinLine, RiRefreshLine, RiRssLine } from '@remixicon/react';
import { VisuallyHidden } from 'react-aria-components';

import { avatarInner } from '@peach/card-art';
import { mapLimit } from '@peach/legacy/core';
import { confirmModal } from '@peach/legacy/ui';

import { Chip } from '@/components/base/badges/chip';
import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Switch } from '@/components/base/switch/switch';
import {
  Table, TableBody, TableCell, TableColumn, TableHeader, TableRow,
} from '@/components/base/table/table';
import { ChevronSortDown } from '@/components/foundations/icons/chevrons';

import { errorMessage } from '../../api';
import { DataTableFrame } from '../components/data-table-frame';
import { DataTableFooter, DataTableSort } from '../components/table-controls';
import { cardClass } from '../components/card';
import { EmptyState } from '../components/empty-state';
import { LEGACY_AVATAR_IMG } from '../components/legacy-avatar';
import { Note } from '../components/note';
import { SelectionDock } from '../components/selection-dock';
import { queryClient } from '../query';
import { ErrorText, Help } from '../settings/section';
import { busyProps, useAction } from '../settings/use-action';
import { localTime } from '../time';
import { AddFeed } from './add-feed';
import {
  checkFeeds, errorHeadline, FEEDS_KEY, feedIntervalText, fetchFeeds, removeFeed, setFeedEnabled,
  pageWindow, type FeedSource,
} from './follow-manage';

const feedTableFeatures = tableFeatures({
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

const COLUMN_LABELS: Record<string, string> = {
  select: 'Seleccionar',
  name: 'Nombre',
  kind: 'Tipo',
  origin: 'Fuente',
  status: 'Estado',
  interval: 'Frecuencia',
  fetched: 'Última extracción',
  fresh: 'Última adición',
  actions: 'Acción',
};

/** 表头dentroNo占字列: 勾选eseuno格自己会说"Seleccionar 谁", 行尾tresControles也各带自己名字.  */
const SILENT_COLUMNS = new Set(['select', 'actions']);

const reload = () => queryClient.invalidateQueries({ queryKey: FEEDS_KEY, exact: true });

const feedName = (source: FeedSource) => source.name || source.url;


/** 来源eseuno格Solo摆站名: 地址Completo写出来会este表撑到uno屏之exterior, 点开就esOriginalpágina面.  */
function originHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** uno源此刻Estado: 拉No动最要紧, 其次才es开着还es停着.  */
function StatusChip({ source }: { source: FeedSource }) {
  if (source.last_error) return <Chip variant="caption" color="rose">ExtraerFallido</Chip>;
  if (!source.enabled) return <Chip variant="caption" color="neutral">Pausado</Chip>;
  return <Chip variant="caption" color="lime">Normal</Chip>;
}

/** 名字anterior圆框:  y 关注Lista创作者圆标同uno尺寸y底色. dentro面ese段由 `card-art`  `avatarInner` 拼: 
 *  Con资料Imagen按人脸取景出Imagen, 判据es服务端 `has_image`; Sin就esprimero字母. Completo格No进读屏, 名字就En旁边.  */
function FeedAvatar({ source }: { source: FeedSource }) {
  const entity = source.entity_id
    ? {
        id: source.entity_id, has_image: !!source.has_image, image_version: source.image_version,
        avatar_focus: source.avatar_focus,
      }
    : null;
  return (
    <span aria-hidden
      className={`relative inline-grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-background-tertiary-default text-caption-1-semibold text-text-secondary ${LEGACY_AVATAR_IMG}`}
      dangerouslySetInnerHTML={{ __html: avatarInner(feedName(source), entity, null, 'performer') }} />
  );
}

/** esteunopáginaEn站arriba挂另uno名字. uno人常Con两página, 本名página y antiguo艺名páginaEn表dentro同名, 
 *  SoloConesteuno段说得出哪uno行es哪unopágina. SoloEnesteNo止uno行时写: 站en laTítulo栏常几写法
 *  连成uno串("涼森玲夢, 涼森れむ"), SoloConuno行人再摆uno遍Soloes噪音;  y 统称uno样时也NoRepetir.  */
const pageAlias = (source: FeedSource, shared: ReadonlySet<number>) =>
  (source.entity_id !== null && shared.has(source.entity_id)
    && source.page_name && source.page_name !== source.name ? source.page_name : '');

/** 挂着No止uno源人.  */
function sharedEntities(sources: FeedSource[]): ReadonlySet<number> {
  const seen = new Set<number>();
  const shared = new Set<number>();
  for (const { entity_id: id } of sources) {
    if (id === null) continue;
    if (seen.has(id)) shared.add(id); else seen.add(id);
  }
  return shared;
}

interface RowHandlers {
  readOnly: boolean;
  /** 挂着No止uno源人, 名字旁página名Solo给他们写.  */
  shared: ReadonlySet<number>;
  /** En curso跑ese动作Clave(`useAction`  `busy`), 行尾拉取Clave按它挂忙态.  */
  busy: string | null;
  toggle(source: FeedSource, enabled: boolean): void;
  fetch(source: FeedSource): void;
  remove(source: FeedSource): void;
}

/** Quitaranterior先弹Confirmar,  y 关注Listaeseuno行同uno套: 删eseste源 y 它去pesado记忆, 拉回来Nuevas obrasDeja着
 *  (`feed_discovery.source_id` 置空). 写入交给弹层, 忙态 y FalloOriginal因都落En弹层dentro.  */
function confirmRemove(sources: FeedSource[], write: () => Promise<unknown>) {
  const one = sources.length === 1 ? sources[0] : null;
  return confirmModal({
    title: one ? 'Desuscribirse de la fuente' : `Quitar ${sources.length} ResultadoSuscribirse源`,
    body: one
      ? `将Desuscribirse de la fuente"${feedName(one)}", 之posteriorNo再Extraer它Nuevas obras; Ya经拉到Nuevas obrasConservar. `
      : '将Quitar所选Suscribirse源, 之posteriorNo再Extraer它们Nuevas obras; Ya经拉到Nuevas obrasConservar. ',
    confirmLabel: one ? 'Desuscribirse de la fuente' : 'Quitar所选Suscribirse源', danger: true,
    onConfirm: write,
  });
}

export function FeedSources({ readOnly, toast }: {
  readOnly: boolean; toast(message: string): void;
}) {
  const feeds = useQuery({ queryKey: FEEDS_KEY, queryFn: ({ signal }) => fetchFeeds(signal) });
  const action = useAction();
  const data = feeds.data;
  const sources = useMemo(() => data?.sources ?? [], [data]);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set<number>());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sorting, setSorting] = useState<SortingState>([]);
  const win = pageWindow(sources.length, pageSize, page);
  useEffect(() => { setPage((current) => Math.min(current, win.pages)) }, [win.pages]);

  /* 删掉源No该还占着计数: 清单换uno就ya经NoEndentro面 ID 丢掉.  */
  useEffect(() => {
    setSelected((now) => {
      const alive = new Set(sources.map((source) => source.id));
      const next = new Set([...now].filter((id) => alive.has(id)));
      return next.size === now.size ? now : next;
    });
  }, [sources]);

  const bulk = useMutation({
    mutationFn: async (work: { ids: number[]; action: 'enabled' | 'paused' | 'remove' }) => {
      const results = await mapLimit(work.ids, 4, async (id: number) => {
        if (work.action === 'remove') await removeFeed(id);
        else await setFeedEnabled(id, work.action === 'enabled');
      });
      return { ...work, results };
    },
    onSuccess: (result) => {
      const failed = result.results.filter((row) => !row.ok);
      const done = result.ids.length - failed.length;
      setSelected(new Set());
      void reload();
      if (result.action === 'remove' && done) toast(`YaQuitar ${done} ResultadoSuscribirse源`);
      if (failed.length) {
        const first = failed[0]!;
        action.setError(`${failed.length} ResultadoSin写入: ${first.ok ? '' : errorMessage(first.error)}`);
      }
    },
    onError: (cause) => action.setError(errorMessage(cause)),
  });

  /* 列定义Solo建uno次, 行en laControles到点击eseuno刻再从aquí取最NuevoProcesarDispositivoySolo读态.  */
  const shared = useMemo(() => sharedEntities(sources), [sources]);
  const handlers = useRef<RowHandlers>({
    readOnly, shared, busy: null, toggle: () => {}, fetch: () => {}, remove: () => {},
  });
  handlers.current = {
    readOnly,
    shared,
    busy: action.busy,
    toggle: (source, enabled) => void action.run(`enabled-${source.id}`,
      (signal) => setFeedEnabled(source.id, enabled, signal), () => void reload()),
    /* Solo拉esteuno, 停着也拉: 点esteClave人就es想现Enver她ConSinNuevas obras, No必先去开开关.  */
    fetch: (source) => void action.run(`check-${source.id}`,
      (signal) => checkFeeds(signal, [source.id]), () => void reload()),
    remove: (source) => void confirmRemove([source], async () => {
      await removeFeed(source.id);
      toast(`YaDesuscribirse de la fuente"${feedName(source)}"`);
      void reload();
    }),
  };

  const columns = useMemo(() => {
    const column = createColumnHelper<typeof feedTableFeatures, FeedSource>();
    const label = (id: string) => () => COLUMN_LABELS[id] || id;
    return column.columns([
      column.display({
        id: 'select',
        header: label('select'),
        /* `slot={null}`: 表格自带uno叫 selection 插槽, 摆进去勾No声明归属就会被它
           拦abajo报错. esteuno列勾归 TanStack Table ese行Seleccionar管, No走 Table 自己Seleccionar.  */
        cell: (context) => (
          <Checkbox slot={null} isSelected={context.row.getIsSelected()}
            onChange={(on) => context.row.toggleSelected(on)}
            aria-label={`Seleccionar ${feedName(context.row.original)}`} />
        ),
      }),
      column.accessor(feedName, {
        id: 'name',
        header: label('name'),
        /* 名字, 频率yTiempo都No换行: estrecho屏arribaeste表靠 Table 自带容Dispositivo横着滚, 让格子换行Solo会
           "tresarriba悠亜"竖着摆成cuatro行, 滚动反而没用处.  */
        cell: (context) => {
          const alias = pageAlias(context.row.original, handlers.current.shared);
          return (
            <span className="flex items-center gap-2 whitespace-nowrap text-body-medium text-text-primary">
              <FeedAvatar source={context.row.original} />
              {context.getValue()}
              {alias ? (
                <span className="text-body-2-regular text-text-secondary" title={`站arribaesteunopágina挂En"${alias}"名abajo`}>
                  {alias}
                </span>
              ) : null}
            </span>
          );
        },
      }),
      column.accessor((row) => row.kind_label, {
        id: 'kind',
        header: label('kind'),
        cell: (context) => <span className="whitespace-nowrap">{context.getValue()}</span>,
      }),
      column.accessor((row) => row.url, {
        id: 'origin',
        header: label('origin'),
        cell: (context) => (
          <a href={context.getValue()} target="_blank" rel="noreferrer noopener" title="Abrir página de fuente"
            className="text-text-primary underline-offset-2 hover:underline">
            {originHost(context.getValue())}
          </a>
        ),
      }),
      column.accessor((source) => source.last_error ? 'ExtraerFallido' : source.enabled ? 'Activado' : 'Pausado', {
        id: 'status',
        header: label('status'),
        cell: (context) => <StatusChip source={context.row.original} />,
      }),
      column.accessor((row) => row.interval_minutes, {
        id: 'interval',
        header: label('interval'),
        cell: (context) => <span className="whitespace-nowrap">{feedIntervalText(context.getValue())}</span>,
      }),
      column.accessor((row) => row.last_fetched_at ? Date.parse(row.last_fetched_at) || 0 : 0, {
        id: 'fetched',
        header: label('fetched'),
        cell: (context) => <span className="whitespace-nowrap tabular-nums">{context.row.original.last_fetched_at ? localTime(context.row.original.last_fetched_at) : 'Nunca extraído'}</span>,
      }),
      column.accessor((row) => row.last_new_count, {
        id: 'fresh',
        header: label('fresh'),
        cell: (context) => <span className="whitespace-nowrap tabular-nums">{`${context.getValue()} Resultado`}</span>,
      }),
      column.display({
        id: 'actions',
        header: label('actions'),
        /* 行尾 y 关注Lista表格同uno次序: 启用开关, 拉取Clave, QuitarClave挨Enuno起. 两Clave次级描边, 
           Actualizary垃圾桶字形, xs eseuno档 y 开关uno样alto.  */
        cell: (context) => (
          <span className="flex items-center gap-1">
            <Switch aria-label={`Activar ${feedName(context.row.original)}`}
              isSelected={context.row.original.enabled} isDisabled={handlers.current.readOnly}
              onChange={(enabled) => handlers.current.toggle(context.row.original, enabled)} />
            <Button variant="secondary" size="xs" iconOnly leadingIcon={RiRefreshLine}
              aria-label={`Extraer ${feedName(context.row.original)}`}
              disabled={handlers.current.readOnly}
              {...busyProps(handlers.current.busy === `check-${context.row.original.id}`)}
              onClick={() => handlers.current.fetch(context.row.original)} />
            <Button variant="secondary" size="xs" iconOnly leadingIcon={RiDeleteBinLine}
              aria-label={`Quitar ${feedName(context.row.original)}`}
              disabled={handlers.current.readOnly}
              onClick={() => handlers.current.remove(context.row.original)} />
          </span>
        ),
      }),
    ]);
  }, []);

  const rowSelection = useMemo<RowSelectionState>(
    () => Object.fromEntries([...selected].map((id) => [String(id), true])), [selected]);
  const table = useTable({
    features: feedTableFeatures,
    data: sources,
    columns,
    getRowId: (row) => String(row.id),
    state: { rowSelection, sorting, pagination: { pageIndex: win.page - 1, pageSize } },
    onSortingChange: (next) => { setSorting(next); setPage(1); },
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      setSelected(new Set(Object.entries(next).filter(([, on]) => on).map(([id]) => Number(id))));
    },
  });

  if (!data) {
    return feeds.error
      ? <Note tone="error" title="打No开Suscribirse源">{errorMessage(feeds.error)}</Note>
      : <Help>Procesando读Suscribirse源. </Help>;
  }

  const check = () => void action.run('check', (signal) => checkFeeds(signal), () => void reload());
  const toggleRow = (id: number) => setSelected((now) => {
    const next = new Set(now);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const chosen = sources.filter((source) => selected.has(source.id));
  const failing = sources.filter((source) => source.last_error);

  return (
    <div className="flex flex-col gap-3">
      <AddFeed readOnly={readOnly} toast={toast} onAdded={() => void reload()} />
      <section aria-label="Lista de suscripciones JAV"
        className={cardClass({ padding: 'none', className: 'flex flex-col gap-4 px-6 py-5 max-sm:px-4' })}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto text-title-2-medium text-text-primary">Fuente de suscripción JAV</h3>
        <span className="text-body-2-regular text-text-secondary">{`${sources.length.toLocaleString()}  fuente(s) de suscripción · ${(Number(data.unread) || 0).toLocaleString()} ResultadoNover`}</span>
        <Button onClick={check} disabled={readOnly} {...busyProps(action.busy === 'check')}>立即Extraer</Button>
        <DataTableSort label="Fuente de suscripción JAV" sorting={sorting} onChange={(next) => { setSorting(next); setPage(1); }}
          options={['name', 'kind', 'origin', 'status', 'interval', 'fetched', 'fresh'].map((id) => ({ id, label: COLUMN_LABELS[id]! }))} />
      </div>

      {failing.length || action.error ? (
        <div className="flex flex-col gap-3">
          {/* 拉No动源y成uno: 每源uno行"源名: 报错primero行", 几源同时坏也No表格推出primero屏; 
              表格dentroeseuno行Estado徽章同时标着"拉取Fallo".  */}
          {failing.length ? (
            <Note tone="error" title={`${failing.length.toLocaleString()} ResultadoSuscribirse源ExtraerFallido`}
              extra={<ul className="flex flex-col gap-0.5 text-body-2-regular">
                {failing.map((source) => (
                  <li key={source.id} className="min-w-0 truncate" title={source.last_error || ''}>
                    {`${feedName(source)}: ${errorHeadline(source.last_error || '') || 'Motivo no especificado'}`}
                  </li>
                ))}
              </ul>}>
              este些订阅源esteuno轮Sin取到NuevoEntrada. 
            </Note>
          ) : null}
          {action.error ? <ErrorText>{action.error}</ErrorText> : null}
        </div>
      ) : null}

        <SelectionDock visible={chosen.length > 0} label="Suscribirse源Operación en lote" count={`Ya选 ${chosen.length} ResultadoSuscribirse源`}>
          <Button variant="secondary" size="small" disabled={readOnly} {...busyProps(bulk.isPending)}
            onClick={() => bulk.mutate({ ids: chosen.map((row) => row.id), action: 'enabled' })}>Activar</Button>
          <Button variant="secondary" size="small" disabled={readOnly} {...busyProps(bulk.isPending)}
            onClick={() => bulk.mutate({ ids: chosen.map((row) => row.id), action: 'paused' })}>Pausar</Button>
          <Button variant="danger" size="small" disabled={readOnly} {...busyProps(bulk.isPending)}
            onClick={() => void confirmRemove(chosen,
              () => bulk.mutateAsync({ ids: chosen.map((row) => row.id), action: 'remove' }))}>Quitar</Button>
          <Button variant="ghost" size="small" onClick={() => setSelected(new Set())}>Deseleccionar</Button>
        </SelectionDock>

      {sources.length ? (
        <DataTableFrame follow onRowClick={(key) => toggleRow(Number(key))}>
          <Table aria-label="Fuente de suscripción JAV" size="sm"
            sortDescriptor={sorting[0] ? { column: sorting[0].id, direction: sorting[0].desc ? 'descending' : 'ascending' } : undefined}
            onSortChange={(sort) => table.getColumn(String(sort.column))?.toggleSorting(sort.direction === 'descending')}>
            <TableHeader>
              {table.getHeaderGroups()[0]!.headers.map((header) => {
                const text = flexRender(header.column.columnDef.header, header.getContext());
                return (
                  <TableColumn key={header.id} id={header.id} isRowHeader={header.column.id === 'name'} allowsSorting={header.column.getCanSort()}>
                    {({ sortDirection }) => SILENT_COLUMNS.has(header.column.id) ? <VisuallyHidden>{text}</VisuallyHidden>
                      : <span className="flex items-center gap-0.5">{text}
                        {header.column.getCanSort() ? <span data-sort-indicator data-direction={sortDirection || undefined}><ChevronSortDown /></span> : null}
                      </span>}
                  </TableColumn>
                );
              })}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} id={row.id} data-follow-selected={row.getIsSelected() || undefined}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableFrame>
      ) : (
        <EmptyState icon={RiRssLine} title="Aún no haySuscribirse源" shell="plain">
          Enarriba面按Actriz名添加, 或En人物página点"订阅Nuevas obras". 
        </EmptyState>
      )}
      {sources.length ? (
        <DataTableFooter label="Suscripción JAV" total={win.total} unit=" fuente(s) de suscripción"
          pagination={{ pageIndex: win.page - 1, pageSize }}
          onChange={(next) => { setPageSize(next.pageSize); setPage(next.pageIndex + 1); }} />
      ) : null}
      <footer className="-mx-6 -mb-5 flex flex-wrap items-center gap-2 border-t border-separator-border rounded-b-2xl bg-card-footer px-6 py-4 max-sm:-mx-4 max-sm:px-4">
        <span role="status" className="mr-auto text-body-2-regular text-text-secondary">
          {`Nover ${(Number(data.unread) || 0).toLocaleString()} · Activado ${sources.filter((source) => source.enabled).length.toLocaleString()} / ${sources.length.toLocaleString()}`}
        </span>
      </footer>
      </section>
    </div>
  );
}
