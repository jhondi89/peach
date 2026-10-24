/* 关注Lista: 同uno来源集合两视Imagen, exterior加VerificarActualizareseuno趟posteriorTarea. 
 *
 * 两视Imagen共用uno勾选集合(身es来源 ID) y unoOrdenarEstado. 表格视Imagen由
 * `@tanstack/react-table` 驱动: 列定义, OrdenarEstado, 行Seleccionary分página都En它手dentro, 行Datoses
 * ya经按共用比较Dispositivo排bien**Todo集**—Ordenar作用En todoResultadoarriba, 分páginaSolo切最posterioruno步, 所以
 * "Siguientepágina"ver到es真Siguiente批, 而Noes本páginainterior部pesado排. 
 *
 * Seleccionar跨página也跨视Imagen: 换página, 换Ordenar, 从卡片切到表格, 选en proceso仍es同uno批来源, 底部ese批量
 * 操作发出去也esCompleto ID 集合, 而Noes屏幕arribaesteunopágina.  */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RiArrowDownLine, RiArrowDownSLine, RiArrowUpLine, RiArrowUpSLine, RiCheckDoubleLine,
  RiDeleteBinLine, RiLayoutGridLine, RiRefreshLine, RiRssLine, RiTableLine,
} from '@remixicon/react';
import { useMutation } from '@tanstack/react-query';
import {
  createColumnHelper, createPaginatedRowModel, flexRender, rowPaginationFeature,
  rowSelectionFeature, rowSortingFeature, tableFeatures, useTable,
  type RowSelectionState, type SortingState,
} from '@tanstack/react-table';
import { VisuallyHidden } from 'react-aria-components';

import { mapLimit } from '@peach/legacy/core';
import { confirmModal } from '@peach/legacy/ui';

import { Button, ButtonLink } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Select, SelectItem } from '@/components/base/select/select';
import { Switch } from '@/components/base/switch/switch';
import {
  Table, TableBody, TableCell, TableColumn, TableHeader, TableRow,
} from '@/components/base/table/table';
import { ChevronSortDown } from '@/components/foundations/icons/chevrons';

import { errorMessage } from '../../api';
import { DataTableFooter } from '../components/table-controls';
import { useBackgroundJob } from '../background-job';
import { cardClass } from '../components/card';
import { DataTableFrame } from '../components/data-table-frame';
import { EmptyState } from '../components/empty-state';
import { clickedBlank } from '../components/row-click';
import { Note } from '../components/note';
import { TaskProgress } from '../components/task-progress';
import { SelectionDock } from '../components/selection-dock';
import { busyProps } from '../settings/use-action';
import {
  authorGroups, authorName, checkedText, checkEvidenceGap, checkFailures, checkReceipt, checkSummary,
  COLUMN_SORT, dropSources, errorHeadline, fetchCheckJob, fetchPending, FOLLOW_CHECK_KEY, isBroken,
  LAYOUTS, markItem, pageWindow, patchSource, removeSource,
  reloadFollowManage, selectionState, setSourceEnabled, SORT_DEFAULT_DIR, SORT_OPTIONS,
  sortLabel, startCheck, tableRows, toggleGroup,
  type CheckJob, type FollowData, type FollowSource, type Layout, type SortDir, type SortKey,
  type TableRow as SourceTableRow,
} from './follow-manage';
import { AuthorAvatar, ErrorLine, SourceIcon, SourceLink, StatusBadge } from './source-view';

const sourceTableFeatures = tableFeatures({
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const count = (value: unknown) => (Number(value) || 0).toLocaleString();

/** 列头点就es工具栏en laeseuno档Ordenar, 所以两边共用同uno对照表, 方向也共用uno值.  */
const SORT_COLUMN = Object.fromEntries(
  Object.entries(COLUMN_SORT).map(([column, sort]) => [sort, column]),
) as Partial<Record<SortKey, string>>;

/** 工具行estrecho到esteancho度以abajo, 带字按钮就SoloDeja字形. 取自antiguo版实测ese断点.  */
const TOOLBAR_COMPACT_PX = 740;

/** esteuno行自己Conmásancho. 
 *
 * 判据Solo能esesteuno行自己ancho度, Noes视口: 同uno视口abajo侧栏收起y展开Deja给它ancho度差两cien
 * 像素, 按视口断点会Enuno边早折, En另uno边照样超框. 塌abajo去用es `Button` 自己 `iconOnly`
 * —exterior面改它interiorMargen exterior会被 `no-restyle` 挡abajo, eseRegla说就esEspaciado归Controles自己.  */
function useCompactToolbar(): [(node: HTMLDivElement | null) => void, boolean] {
  const [compact, setCompact] = useState(false);
  const observer = useRef<ResizeObserver | null>(null);
  const attach = useCallback((node: HTMLDivElement | null) => {
    observer.current?.disconnect();
    if (!node) { observer.current = null; return }
    const watch = new ResizeObserver(() => setCompact(node.clientWidth < TOOLBAR_COMPACT_PX));
    watch.observe(node);
    observer.current = watch;
    setCompact(node.clientWidth < TOOLBAR_COMPACT_PX);
  }, []);
  useEffect(() => () => observer.current?.disconnect(), []);
  return [attach, compact];
}

const COLUMN_LABELS: Record<string, string> = {
  select: 'Seleccionar', author: 'Creador', source: 'Fuente', provider: 'Sitio',
  status: 'Estado', checked: 'Última verificación', actions: 'Acción',
};

/** 行arribaese两动作由调用方给, pero列定义No该跟着每uno次渲染pesado建; 两者之间放uno当anterior值盒子.  */
interface RowHandlers {
  check(ids: number[]): void;
  /** 行尾启用开关: Solo写esteuno, No动勾选, No弹批量ese句 toast,  y 订阅源表开关uno样.  */
  toggle(source: FollowSource, enabled: boolean): void;
  remove(source: FollowSource): void;
  busy: boolean;
  readOnly: boolean;
}

export interface SourceListProps {
  data: FollowData;
  sort: SortKey;
  dir: SortDir;
  page: number;
  layout: Layout;
  pageSize: number;
  selected: ReadonlySet<number>;
  readOnly: boolean;
  onSort(sort: SortKey, dir: SortDir): void;
  onPage(page: number): void;
  onLayout(layout: Layout): void;
  onPageSize(size: number): void;
  onSelected(next: Set<number>): void;
  toast(message: string): void;
  openFollow(): void;
}

/** página码. Anteriorpágina/SiguientepáginaEn两端, página码居en proceso, página数más时两侧折成"...".  */
export { Pagination } from '../components/table-pagination';

/** uno来源En创作者卡en laeseuno行: 勾选, 名字, 站点, Estado, Última vezVerificar, 动作.  */
function SourceRow(
  { source, selected, onToggle, handlers }:
  { source: FollowSource; selected: boolean; onToggle(on: boolean): void; handlers: RowHandlers },
) {
  /* 点esteuno行空白处就es勾arriba或Cancelar: 勾选框SoloCon 16px, uno行dentro其余地方点没反应话, 选几要瞄几次. 
     estrecho屏固定两行: Anterior行勾选, 名字, 站标yEstado, Siguiente行Última vezVerificar, 开关y两动作Clave.  */
  return (
    <div data-selected={selected || undefined} data-follow-source-row=""
      className="flex min-h-16 flex-wrap items-center gap-3 px-2 py-3 max-sm:gap-x-2"
      onClick={(event) => { if (clickedBlank(event, event.currentTarget)) onToggle(!selected) }}>
      <Checkbox isSelected={selected} onChange={onToggle} aria-label={`Seleccionar ${source.label}`} />
      {/* 名字列从ceroancho起largo: largo名字 y 报错En列interior折行或截断, No站标, Estado y 操作Clave挤到Siguiente行.  */}
      <span className="flex min-w-0 grow basis-0 flex-col gap-0.5">
        <SourceLink source={source} />
        {source.last_error ? <ErrorLine text={source.last_error} /> : null}
      </span>
      {/* 卡片dentro站名Solo出unoImagen标: esteuno行紧挨着就es作者名 y Estado徽章, 站名写出来es同uno词
          y排两次. 名字仍En DOM dentro, 读屏 y 取No到Imagen标时都还读得到; 表格ese边"站点"esIndependiente
          uno列, 列头就叫este名字, esedentro才出文字.  */}
      <span className="flex shrink-0 items-center gap-1.5 text-body-2-regular text-text-secondary"
        title={source.provider_label}>
        <SourceIcon provider={source.provider} label={source.provider_label} />
      </span>
      <StatusBadge source={source} />
      <span data-follow-source-controls="" className="contents max-sm:flex max-sm:w-full max-sm:flex-wrap max-sm:items-center max-sm:gap-1.5">
        <span className="shrink-0 text-body-2-regular whitespace-nowrap text-text-secondary max-sm:mr-auto max-sm:text-caption-1-regular">
          {checkedText(source)}
        </span>
        <Switch aria-label={`Activar ${source.label}`} isSelected={source.enabled}
          isDisabled={handlers.readOnly} onChange={(on) => handlers.toggle(source, on)} />
        <span className="flex shrink-0 items-center gap-1">
          <Button variant="secondary" size="small" iconOnly leadingIcon={RiRefreshLine}
            aria-label={`Verificar ${source.label} Actualizar`}
            disabled={!source.enabled || handlers.readOnly} {...busyProps(handlers.busy)}
            onClick={() => handlers.check([source.id])} />
          <Button variant="secondary" size="small" iconOnly leadingIcon={RiDeleteBinLine}
            aria-label={`Quitar ${source.label}`} disabled={handlers.readOnly}
            onClick={() => handlers.remove(source)} />
        </span>
      </span>
    </div>
  );
}

/** uno创作者uno卡. 同uno人En几站en la来源收Enuno处, Título行给出este人Completo体Estado.  */
function AuthorCard(
  { group, name, open, selected, handlers, onOpen, onToggleGroup, onToggle }:
  {
    group: FollowSource[]; name: string; open: boolean; selected: ReadonlySet<number>;
    handlers: RowHandlers;
    onOpen(open: boolean): void;
    onToggleGroup(on: boolean): void;
    onToggle(id: number, on: boolean): void;
  },
) {
  const ids = group.map((source) => source.id);
  const enabled = group.filter((source) => source.enabled).map((source) => source.id);
  const bad = group.filter(isBroken).length;
  const providers = [...new Set(group.map((source) => source.provider_label || source.provider))].join(', ');
  const panel = `follow-author-${group[0]!.id}`;
  const state = selectionState(selected, ids);
  return (
    <section aria-label={`${name} Seguir fuente`}
      className={cardClass({
        variant: 'raised', padding: 'none', className: 'flex flex-col overflow-hidden p-2',
      })}>
      <div data-follow-author-header data-open={open || undefined}
        className="flex flex-wrap items-center gap-3 px-2 py-2.5">
        <AuthorAvatar group={group} name={name} />
        <b className="min-w-0 grow text-body-medium wrap-anywhere text-text-primary max-sm:basis-0">{name}</b>
        <Button variant="secondary" size="small" iconOnly leadingIcon={RiRefreshLine}
          aria-label={`Verificar ${name} TodoFuente`} disabled={!enabled.length || handlers.readOnly}
          {...busyProps(handlers.busy)} onClick={() => handlers.check(enabled)} />
        {/* estrecho屏固定两行: Anterior行Avatar, 名字yVerificarClave, Siguiente行站标, Fallo数ySeleccionar todo, 收起.  */}
        <span data-follow-author-controls="" className="contents max-sm:flex max-sm:w-full max-sm:items-center max-sm:gap-2">
          <span className="flex shrink-0 items-center gap-1 max-sm:mr-auto max-sm:min-w-0 max-sm:shrink max-sm:flex-wrap" title={providers}>
            {group.map((source) => <SourceIcon key={source.id} provider={source.provider} />)}
            {/* Solo读屏用文字走 `VisuallyHidden`: 它样写En元素arriba, No会生成uno y antiguo
                样表同名工具类(`web/css/01-base.css` dentroese `.sr-only` 带 !important).  */}
            <VisuallyHidden>{`Fuente: ${providers}`}</VisuallyHidden>
          </span>
          {bad
            ? <span className="shrink-0 text-body-2-regular text-text-error-primary">{`${bad} Fallido`}</span>
            : null}
          <Button variant="secondary" size="small" leadingIcon={RiCheckDoubleLine}
            aria-pressed={state.all ? 'true' : state.some ? 'mixed' : 'false'}
            aria-label={`${state.all ? 'Deseleccionar todo' : 'Seleccionar todo'} ${name} Fuente`}
            onClick={() => onToggleGroup(!state.all)}>{state.all ? 'Deseleccionar todo' : 'Seleccionar todo'}</Button>
          <Button variant="secondary" size="small" aria-expanded={open} aria-controls={panel}
            leadingIcon={open ? RiArrowUpSLine : RiArrowDownSLine}
            aria-label={`${open ? 'Colapsar' : 'Expandir'} ${name} Fuente`}
            onClick={() => onOpen(!open)}>{open ? 'Colapsar' : 'Expandir'}</Button>
        </span>
      </div>
      <div id={panel} hidden={!open} data-source-divider>
        {group.map((source) => (
          <SourceRow key={source.id} source={source} handlers={handlers}
            selected={selected.has(source.id)} onToggle={(on) => onToggle(source.id, on)} />
        ))}
      </div>
    </section>
  );
}

export function SourceList(props: SourceListProps) {
  const {
    data, sort, dir, page, layout, pageSize, selected, readOnly,
    onSort, onPage, onLayout, onPageSize, onSelected, toast, openFollow,
  } = props;
  const sources = data.sources;
  const aliases = useMemo(() => data.author_aliases || [], [data.author_aliases]);
  const counts = data.counts || {};
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set<string>());
  const [toolbar, compact] = useCompactToolbar();
  const [problem, setProblem] = useState('');

  const groups = useMemo(() => authorGroups(sources, sort, dir, aliases), [sources, sort, dir, aliases]);
  const rows = useMemo(() => tableRows(groups, sort, dir, aliases), [groups, sort, dir, aliases]);

  const { job, running, outcome, start: check } = useBackgroundJob<CheckJob, number[]>({
    queryKey: FOLLOW_CHECK_KEY,
    queryFn: ({ signal }) => fetchCheckJob(signal),
    start: (ids) => startCheck(ids),
    onError: (cause) => setProblem(errorMessage(cause)),
    onFinish: (state) => {
      void reloadFollowManage();
      toast(state.status === 'failed' ? (state.error || 'Error de verificación') : checkReceipt(state));
    },
  });

  const startChecking = (ids: number[]) => {
    if (running || check.isPending) return;
    setProblem('');
    check.mutate(ids);
  };

  const toggleOne = (id: number, on: boolean) => onSelected(toggleGroup(selected, [id], on));
  const toggleMany = (ids: number[], on: boolean) => onSelected(toggleGroup(selected, ids, on));

  /* 单QuitarSoloeseuno从缓存dentro去掉, 顺手它从勾选dentro也去掉: 否则底部ese会uno直算着
     unoya经No存En来源.  */
  const remove = useMutation({
    mutationFn: (id: number) => removeSource(id),
    onSuccess: (_result, id) => {
      dropSources([id]);
      onSelected(toggleGroup(selected, [id], false));
      toast('YaDejar de seguirFuente');
    },
    onError: (cause) => setProblem(errorMessage(cause)),
  });

  /* 行尾开关Solo写esteunoy改本地eseuno行; 批量ese路会顺手清勾选, 弹"ya启用 n ", 
     uno开关No该Coneste两样动静.  */
  const toggleEnabled = useMutation({
    mutationFn: (work: { id: number; enabled: boolean }) => setSourceEnabled(work.id, work.enabled),
    onSuccess: (_result, work) => {
      patchSource(work.id, { enabled: work.enabled });
      setProblem('');
    },
    onError: (cause) => setProblem(errorMessage(cause)),
  });

  const removeSourceRow = (source: FollowSource) => void confirmModal({
    title: 'Dejar de seguirFuente', body: '将Quitareste fuente(s)及YaObtenerResultado目, MediosArchivoConservar. ',
    confirmLabel: 'Dejar de seguirFuente', danger: true,
    onConfirm: () => remove.mutateAsync(source.id),
  });

  /** 批量: uno次Por favor求uno, Con界y发. 串行发几cienes实测卡点, uno次Todo发出去又会自己挤自己.  */
  const bulk = useMutation({
    mutationFn: async (work: { ids: number[]; action: 'enabled' | 'paused' | 'remove' }) => {
      const results = await mapLimit(work.ids, 4, async (id: number) => {
        if (work.action === 'remove') await removeSource(id);
        else await setSourceEnabled(id, work.action === 'enabled');
      });
      return { ...work, done: work.ids.filter((_id, at) => results[at]?.ok), results };
    },
    onSuccess: (result) => {
      if (result.action === 'remove') dropSources(result.done);
      else for (const id of result.done) patchSource(id, { enabled: result.action === 'enabled' });
      onSelected(toggleGroup(selected, result.done, false));
      const failed = result.results.filter((row) => !row.ok);
      if (failed.length) {
        setProblem(`${failed.length}/${result.ids.length}  fuente(s)NoActualizar: ${errorMessage(failed[0]?.error)}`);
        return;
      }
      setProblem('');
      const word = result.action === 'remove' ? 'Eliminar' : result.action === 'enabled' ? 'Activar' : 'Pausar';
      toast(`Ya${word} ${result.done.length} Seguir fuente`);
    },
    onError: (cause) => setProblem(errorMessage(cause)),
  });

  /** noverEntrada批量Etiqueta. 先取uno趟待Procesar清单, 再逐写.  */
  const markAll = useMutation({
    mutationFn: async (to: string) => {
      const pending = await fetchPending();
      const ids = (pending.groups || [])
        .flatMap((group) => [group.primary, ...group.variants, ...group.duplicates])
        .filter((item) => item.status === 'new').map((item) => item.id);
      const results = await mapLimit(ids, 6, (id: number) => markItem(id, to));
      return { ids, failed: results.filter((row) => !row.ok) };
    },
    onSuccess: (result) => {
      void reloadFollowManage();
      if (result.failed.length) {
        setProblem(`LoteActualizar ${result.failed.length}/${result.ids.length} 项NoFinalizar`);
        return;
      }
      setProblem('');
      toast(`YaMarcar en lote ${result.ids.length} 项`);
    },
    onError: (cause) => setProblem(errorMessage(cause)),
  });

  const toggleSourceRow = (source: FollowSource, enabled: boolean) =>
    toggleEnabled.mutate({ id: source.id, enabled });

  const handlers = useRef<RowHandlers>({
    check: startChecking, toggle: toggleSourceRow, remove: removeSourceRow, busy: false, readOnly,
  });
  handlers.current = {
    check: startChecking,
    toggle: toggleSourceRow,
    remove: removeSourceRow,
    busy: running || check.isPending,
    readOnly,
  };
  const rowHandlers = handlers.current;

  /* ── 表格视Imagen: 列定义, Ordenar, 行Seleccionary分página都交给 TanStack Table ── */
  const columns = useMemo(() => {
    const column = createColumnHelper<typeof sourceTableFeatures, SourceTableRow>();
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
            aria-label={`Seleccionar ${context.row.original.source.label}`} />
        ),
      }),
      column.accessor((row) => row.author, {
        id: 'author',
        header: label('author'),
        cell: (context) => (
          <span className="flex min-w-0 items-center gap-2">
            <AuthorAvatar group={context.row.original.group} name={context.row.original.author} />
            <span className="min-w-0 break-words">{context.row.original.author}</span>
          </span>
        ),
      }),
      column.accessor((row) => row.source.label, {
        id: 'source',
        header: label('source'),
        cell: (context) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <SourceLink source={context.row.original.source} />
            {context.row.original.source.last_error ? <ErrorLine text={context.row.original.source.last_error} /> : null}
          </span>
        ),
      }),
      column.accessor((row) => row.source.provider_label, {
        id: 'provider',
        header: label('provider'),
        cell: (context) => (
          <span className="flex items-center gap-1.5">
            <SourceIcon provider={context.row.original.source.provider} />
            {context.row.original.source.provider_label}
          </span>
        ),
      }),
      column.display({
        id: 'status',
        header: label('status'),
        cell: (context) => <StatusBadge source={context.row.original.source} />,
      }),
      column.accessor((row) => row.source.last_checked_at || '', {
        id: 'checked',
        header: label('checked'),
        cell: (context) => checkedText(context.row.original.source),
      }),
      column.display({
        id: 'actions',
        header: label('actions'),
        cell: (context) => (
          <span className="flex items-center gap-1">
            <Switch aria-label={`Activar ${context.row.original.source.label}`}
              isSelected={context.row.original.source.enabled} isDisabled={rowHandlers.readOnly}
              onChange={(on) => handlers.current.toggle(context.row.original.source, on)} />
            <Button variant="secondary" size="small" iconOnly leadingIcon={RiRefreshLine}
              aria-label={`Verificar ${context.row.original.source.label} Actualizar`}
              disabled={!context.row.original.source.enabled || rowHandlers.readOnly}
              {...busyProps(rowHandlers.busy)}
              onClick={() => handlers.current.check([context.row.original.source.id])} />
            <Button variant="secondary" size="small" iconOnly leadingIcon={RiDeleteBinLine}
              aria-label={`Quitar ${context.row.original.source.label}`} disabled={rowHandlers.readOnly}
              onClick={() => handlers.current.remove(context.row.original.source)} />
          </span>
        ),
      }),
    ]);
  }, [rowHandlers]);

  const sorting: SortingState = useMemo(() => {
    const id = SORT_COLUMN[sort];
    return id ? [{ id, desc: dir === 'desc' }] : [];
  }, [sort, dir]);
  const rowSelection: RowSelectionState = useMemo(
    () => Object.fromEntries([...selected].map((id) => [String(id), true])), [selected]);

  const asTable = layout === 'table';
  // 越界página码落到últimoPágina: 地址栏dentro挂着puede能esAnterior次, 来源更más时página码. 
  const win = pageWindow(asTable ? rows.length : groups.length, pageSize, page);

  const table = useTable({
    features: sourceTableFeatures,
    data: rows,
    columns,
    /* 行身es来源 ID, Noes它Enesteunopáginaen laabajo标: 换página, 换Ordenar之posterior `rowSelection` dentro记着
       仍es同uno批来源, 卡片视Imagen读也es同uno组数.  */
    getRowId: (row) => String(row.source.id),
    state: { sorting, rowSelection, pagination: { pageIndex: win.page - 1, pageSize } },
    /* Ordenar由共用比较Dispositivo算bien再交进来: 表格自己再排uno遍话, 卡片视Imageny表格视Imagen会各Conuno套
       顺序, 同unoDatosEn两视Imagenen la先posterior就Nouno样.  */
    manualSorting: true,
    enableRowSelection: true,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      const first = next[0];
      if (!first) return;
      const key = COLUMN_SORT[first.id as keyof typeof COLUMN_SORT];
      if (key) onSort(key, first.desc ? 'desc' : 'asc');
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      onSelected(new Set(Object.entries(next).filter(([, on]) => on).map(([id]) => Number(id))));
    },
    onPaginationChange: (updater) => {
      const now = { pageIndex: win.page - 1, pageSize };
      const next = typeof updater === 'function' ? updater(now) : updater;
      if (next.pageSize !== pageSize) onPageSize(next.pageSize);
      else if (next.pageIndex !== now.pageIndex) onPage(next.pageIndex + 1);
    },
  });

  const pageRows = table.getRowModel().rows;
  const pageIds = asTable
    ? pageRows.map((row) => row.original.source.id)
    : groups.slice(win.start, win.end).flatMap((group) => group.map((source) => source.id));
  const pageState = selectionState(selected, pageIds);
  const chosen = [...selected];
  const failures = checkFailures(outcome);
  const failedSourceIds = sources.filter((source) => source.enabled
    && (source.last_status === 'error' || source.last_status === 'unauthorized')).map((source) => source.id);
  const evidence = checkEvidenceGap(outcome);
  const allCollapsed = groups.length > 0 && collapsed.size >= groups.length;

  if (!sources.length) {
    return (
      /* 去处写成地址: 遗Deja层eseTodo局点击ProcesarDispositivo认este链continuar, ya经En关注Gestionarpáginaarriba时Solo换到"添加关注"página签.  */
      <EmptyState shell="plain" icon={RiRssLine} title="Aún no haySeguir fuente" actions={
        <ButtonLink variant="primary" size="small" href="/subscriptions?tab=add">Agregar seguimiento</ButtonLink>
      }>Seguir fuente及其VerificarEstado会MostrarEnaquí. </EmptyState>
    );
  }

  return (
    /* antiguo `.followmanage .fmain>.fsec`: Completo关注ListaesunoIntroduce充卡, Título, 工具, 创作者Agrupar
        y 底abajoese汇Total都En同uno卡dentro, Noesuno描边容Dispositivo套着几行.  */
    <div className={cardClass({
      padding: 'none',
      className: 'flex flex-col gap-4 px-6 py-5 max-sm:px-4',
    })}>
      {/* 放Noabajo时带字按钮先收成Imagen标, 再让Completo行换行. 收起posterior名字由 `aria-label` continuar着说. 
          estrecho屏固定两行: Anterior行Título, 读数yVerificarTodo, Siguiente行版, OrdenaryTodo收起.  */}
      <div ref={toolbar} data-follow-toolbar="" className="flex flex-wrap items-center gap-2">
        <span className="contents max-sm:flex max-sm:min-w-0 max-sm:flex-1 max-sm:flex-col">
          <h3 className="mr-auto text-title-2-medium text-text-primary">Lista de seguidos</h3>
          <span className="text-body-2-regular text-text-secondary">
            {`${sources.length.toLocaleString()}  fuente(s)${counts.new ? ` · ${count(counts.new)} ResultadoNover` : ''}`}
          </span>
        </span>
        <Button variant="primary" leadingIcon={RiRefreshLine} disabled={readOnly}
          aria-label="Verificar todo" iconOnly={compact}
          {...busyProps(rowHandlers.busy)} onClick={() => startChecking([])}>Verificar todo</Button>
        {failedSourceIds.length ? <Button variant="secondary" disabled={readOnly}
          {...busyProps(rowHandlers.busy)} onClick={() => startChecking(failedSourceIds)}>Error de verificación项</Button> : null}
        <span data-follow-toolbar-controls="" className="contents max-sm:flex max-sm:w-full max-sm:items-center max-sm:gap-2">
          <span data-button-group role="group" aria-label="Lista de seguidos版">
            <Button variant="ghost" iconOnly
              leadingIcon={RiLayoutGridLine} aria-label={LAYOUTS[0][1]} aria-pressed={!asTable}
              onClick={() => onLayout('default')} />
            <Button variant="ghost" iconOnly
              leadingIcon={RiTableLine} aria-label={LAYOUTS[1][1]} aria-pressed={asTable}
              onClick={() => onLayout('table')} />
          </span>
          <Select aria-label="Lista de seguidosOrdenar" selectedKey={sort}
            onSelectionChange={(key) => {
              if (key === null) return;
              const next = String(key) as SortKey;
              onSort(next, SORT_DEFAULT_DIR[next]);
            }}>
            {SORT_OPTIONS.map(([key, name]) => <SelectItem key={key} id={key}>{name}</SelectItem>)}
          </Select>
          {/* 箭头es装饰, 方向由Sin障碍名称说, 而且说es点abajo去会得到eseuno头.  */}
          <Button variant="secondary" iconOnly
            leadingIcon={dir === 'asc' ? RiArrowUpLine : RiArrowDownLine}
            aria-label={sortLabel(sort, dir)}
            onClick={() => onSort(sort, dir === 'asc' ? 'desc' : 'asc')} />
          {asTable ? null : (
            <Button variant="secondary" iconOnly={compact}
              leadingIcon={allCollapsed ? RiArrowDownSLine : RiArrowUpSLine}
              aria-label={allCollapsed ? 'TodoExpandir' : 'Colapsar todo'}
              onClick={() => setCollapsed(allCollapsed
                ? new Set<string>()
                : new Set(groups.map((group) => String(group[0]!.author_key || group[0]!.id))))}>
              {allCollapsed ? 'TodoExpandir' : 'Colapsar todo'}
            </Button>
          )}
        </span>
      </div>

      {/* esteuno趟Enposterior跑, 关掉página面还EnContinuar, 所以EstadoDejaEnpágina面arriba而NoesSolo让按钮转unoabajo.  */}
      <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
        {running ? <TaskProgress embedded label={job?.message || (job?.total
          ? `${job.older ? 'Historial de búsqueda' : 'Comprobar actualizaciones'}: Completado ${job.checked || 0}/${job.total}  fuente(s)`
          : 'Procesando准备VerificarTarea')} value={job?.checked} total={job?.total} /> : null}
        {problem ? <Note tone="error" title="Operación no completada">{problem}</Note> : null}
        {!running && outcome?.results?.length ? (
          <Note tone="neutral" title="Resultado de verificación">{checkSummary(outcome)}</Note>
        ) : null}
        {failures.length ? (
          <Note tone="error" title={`${failures.length}  fuente(s)Error de verificación`}
            extra={<ul className="flex flex-col gap-0.5 text-body-2-regular">
              {failures.map((row, at) => (
                <li key={`${row.provider || ''}-${row.ref || at}`}>
                  {`${row.provider_label || row.provider || ''} ${row.author || row.label || row.ref || ''}: ${errorHeadline(row.error || '') || 'Motivo no especificado'}`}
                </li>
              ))}
            </ul>}>
            este些来源esteuno轮Sin取到Actualizar. 
          </Note>
        ) : null}
        {evidence ? <Note tone="warning">{`Resultado目Guardado, peroeste次NoGuardarFuenteOriginalRespuesta: ${evidence}`}</Note> : null}
      </div>

        <SelectionDock label="Seguir fuenteOperación en lote" visible={chosen.length > 0} count={`Ya选 ${chosen.length}  fuente(s)`}>
          <Button variant="secondary" size="small" disabled={readOnly}
            {...busyProps(rowHandlers.busy)} onClick={() => startChecking(chosen)}>Verificar seleccionados</Button>
          <Button variant="secondary" size="small" disabled={readOnly} {...busyProps(bulk.isPending)}
            onClick={() => bulk.mutate({ ids: chosen, action: 'enabled' })}>Activar</Button>
          <Button variant="secondary" size="small" disabled={readOnly} {...busyProps(bulk.isPending)}
            onClick={() => bulk.mutate({ ids: chosen, action: 'paused' })}>Pausar</Button>
          <Button variant="danger" size="small" disabled={readOnly} {...busyProps(bulk.isPending)}
            onClick={() => void confirmModal({
              title: `Eliminar ${chosen.length} Seguir fuente`,
              body: '将Quitar所选Seguir fuente及其YaObtenerResultado目, MediosArchivoConservar. ',
              confirmLabel: 'Eliminar所选Fuente', danger: true,
              onConfirm: () => bulk.mutateAsync({ ids: chosen, action: 'remove' }),
            })}>Eliminar</Button>
          <Button variant="ghost" size="small" onClick={() => onSelected(new Set())}>Deseleccionar</Button>
        </SelectionDock>

      {asTable ? (
        <DataTableFrame follow onRowClick={(key) => toggleOne(Number(key), !selected.has(Number(key)))}>
          <Table aria-label="Seguir fuente" size="sm"
            sortDescriptor={sorting[0]
              ? { column: sorting[0].id, direction: sorting[0].desc ? 'descending' : 'ascending' }
              : undefined}
            onSortChange={(descriptor) => table.setSorting([
              { id: String(descriptor.column), desc: descriptor.direction === 'descending' },
            ])}>
            <TableHeader>
              {table.getHeaderGroups()[0]!.headers.map((header) => {
                const sortable = header.column.id in COLUMN_SORT;
                const text = flexRender(header.column.columnDef.header, header.getContext());
                return (
                  <TableColumn key={header.id} id={header.id} allowsSorting={sortable}
                    isRowHeader={header.column.id === 'source'}>
                    {({ sortDirection }) => sortable ? (
                      <span className="flex items-center gap-0.5">
                        {text}
                        <span data-sort-indicator data-direction={sortDirection || undefined}>
                          <ChevronSortDown />
                        </span>
                      </span>
                    ) : <VisuallyHidden>{text}</VisuallyHidden>}
                  </TableColumn>
                );
              })}
            </TableHeader>
            <TableBody renderEmptyState={() => 'esteunopáginaSinFuente'}>
              {pageRows.map((row) => (
                <TableRow key={row.id} id={row.id}
                  data-follow-selected={row.getIsSelected() || undefined}>
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
        <>
          <Checkbox isSelected={pageState.all} isIndeterminate={pageState.some}
            onChange={(on) => toggleMany(pageIds, on)} aria-label="Seleccionar toda la páginaFuente">Seleccionar toda la página</Checkbox>
          <div className="flex flex-col gap-3">
            {groups.slice(win.start, win.end).map((group) => {
              const key = String(group[0]!.author_key || group[0]!.id);
              return (
                <AuthorCard key={key} group={group} name={authorName(group, aliases)}
                  handlers={rowHandlers} selected={selected} open={!collapsed.has(key)}
                  onOpen={(open) => {
                    const next = new Set(collapsed);
                    if (open) next.delete(key); else next.add(key);
                    setCollapsed(next);
                  }}
                  onToggleGroup={(on) => toggleMany(group.map((source) => source.id), on)}
                  onToggle={toggleOne} />
              );
            })}
          </div>
        </>
      )}

      <DataTableFooter label="Lista de seguidos" total={win.total} pagination={{ pageIndex: win.page - 1, pageSize }}
        unit={asTable ? ' fuente(s)' : ' resultado(s)Creador'} pageUnit={asTable ? 'Resultado' : ' resultado(s)'}
        onChange={(next) => { if (next.pageSize !== pageSize) table.setPageSize(next.pageSize); else table.setPageIndex(next.pageIndex); }} />

      {counts.new ? (
        /* antiguo `.fsecfoot`: 汇Totaly它动作es卡底eseuno带, 比卡面暗uno点点, 通到卡片izquierdaderecha两沿.  */
        <div className="-mx-6 -mb-5 flex flex-wrap items-center gap-2 border-t border-separator-border rounded-b-2xl bg-card-footer px-6 py-4 max-sm:-mx-4 max-sm:px-4">
          <span className="mr-auto text-body-2-regular text-text-secondary">
            {`Nover ${count(counts.new)} · Ya visto ${count(counts.seen)} · Guardado ${count(counts.saved)} · Ignorado ${count(counts.ignored)}`}
          </span>
          <Button variant="secondary" size="small" onClick={openFollow}>去verActualizar</Button>
          <Button variant="secondary" size="small" disabled={readOnly} {...busyProps(markAll.isPending)}
            onClick={() => void confirmModal({
              title: 'Marcar como visto', body: '将ActualNoverObraMarcarComoYa visto. ', confirmLabel: 'Marcar como visto',
              onConfirm: () => markAll.mutateAsync('seen'),
            })}>TodoMarcar como visto</Button>
          <Button variant="secondary" size="small" disabled={readOnly} {...busyProps(markAll.isPending)}
            onClick={() => void confirmModal({
              title: 'MarcarIgnorado', body: '将ActualNoverObraMarcarComoIgnorado. ', confirmLabel: 'MarcarIgnorado',
              onConfirm: () => markAll.mutateAsync('ignored'),
            })}>TodoIgnorar</Button>
        </div>
      ) : null}
    </div>
  );
}
