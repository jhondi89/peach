/* 创作者别名: 同uno人En几站arriba用几名字, 合y之posterior按uno创作者归组. 
 *
 * 待合yes带依据候选, 合y永远由人点: 服务端No自行Actualizar a, página面也No替他勾.  */
import { useMemo, useRef, useState } from 'react';
import { RiCloseLine, RiUserLine } from '@remixicon/react';
import { useMutation } from '@tanstack/react-query';
import {
  createColumnHelper, createPaginatedRowModel, createSortedRowModel, flexRender,
  rowPaginationFeature, rowSelectionFeature, rowSortingFeature, tableFeatures, useTable,
  type RowSelectionState, type SortingState,
} from '@tanstack/react-table';
import { confirmModal } from '@peach/legacy/ui';

import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Input } from '@/components/base/input/input';
import {
  Table, TableBody, TableCell, TableColumn, TableHeader, TableRow,
} from '@/components/base/table/table';

import { errorMessage } from '../../api';
import { cardClass } from '../components/card';
import { DataTableFrame } from '../components/data-table-frame';
import { DataTableFooter, DataTableSort } from '../components/table-controls';
import { SelectionDock } from '../components/selection-dock';
import { useTableSelection } from '../components/use-table-selection';
import { ChevronSortDown } from '@/components/foundations/icons/chevrons';
import { EmptyState } from '../components/empty-state';
import { ErrorText, FieldLabel } from '../settings/section';
import { busyProps } from '../settings/use-action';
import {
  addAlias, reloadFollowManage, removeAlias,
  type AliasGroup, type AliasSuggestion, type FollowSource,
} from './follow-manage';
import { AuthorAvatar } from './source-view';

const REMOVE_BODY = (alias: string) => `将QuitarAlias"${alias}", 对应FuenteRestaurarComoIndependienteCreadorGrupo. `;
const suggestionFeatures = tableFeatures({ rowSelectionFeature, rowSortingFeature, rowPaginationFeature,
  sortedRowModel: createSortedRowModel(), paginatedRowModel: createPaginatedRowModel() });
const savedFeatures = suggestionFeatures;

export interface AliasManagerProps {
  groups: AliasGroup[];
  suggestions: AliasSuggestion[];
  sources?: FollowSource[];
  readOnly: boolean;
  toast(message: string): void;
}

/** uno待合y身: uno别名Solopuede能归进unoNormalizar名, 所以用别名本身当Clave.  */
const suggestionKey = (item: AliasSuggestion) => item.alias;

function authorSources(sources: FollowSource[], name: string, canonicalKey?: string) {
  /* 建过档作者Clavees `entity:<id>`, 别名表arriba记仍es名字Clave: 按名字Clave找No到就按名字认.  */
  const expected = canonicalKey ? `name:${canonicalKey}` : '';
  const anchor = (expected && sources.find((source) => source.author_key === expected))
    || sources.find((source) => source.author_name === name || source.entity_name === name);
  return anchor ? sources.filter((source) => source.author_key === anchor.author_key) : [];
}

function AuthorIdentity({ sources, name, canonicalKey }: {
  sources: FollowSource[]; name: string; canonicalKey?: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <AuthorAvatar group={authorSources(sources, name, canonicalKey)} name={name} />
      <b className="text-body-medium">{name}</b>
    </span>
  );
}

export function AliasManager({ groups, suggestions, sources = [], readOnly, toast }: AliasManagerProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [savedSelection, setSavedSelection] = useState<RowSelectionState>({});
  const activateSuggestion = useTableSelection(() => setRowSelection({}));
  const activateSaved = useTableSelection(() => setSavedSelection({}));
  const [sorting, setSorting] = useState<SortingState>([]);
  const [savedSorting, setSavedSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [savedPagination, setSavedPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const suggestionPage = { ...pagination, pageIndex: Math.min(pagination.pageIndex, Math.max(0, Math.ceil(suggestions.length / pagination.pageSize) - 1)) };
  const savedPage = { ...savedPagination, pageIndex: Math.min(savedPagination.pageIndex, Math.max(0, Math.ceil(groups.length / savedPagination.pageSize) - 1)) };
  const [problem, setProblem] = useState('');
  const [canonical, setCanonical] = useState('');
  const [alias, setAlias] = useState('');

  /* 合y按顺序unouno发: uno次Fallo要报出"还Con几组没合", 而y发发出去话, 说No清
     停En哪dentro.  */
  const merge = useMutation({
    mutationFn: async (items: AliasSuggestion[]) => {
      let done = 0;
      for (const item of items) {
        try {
          await addAlias(item.canonical, item.alias);
        } catch (cause) {
          /* medio路断要说清停En哪儿: ya经合en laese几组先落回Listadentro去掉, 再点uno次Solo发剩abajo.  */
          if (done) void reloadFollowManage();
          throw new Error(`${errorMessage(cause)}(还Con ${items.length - done} GrupoSinFusionar)`);
        }
        done += 1;
      }
      return { done, items };
    },
    onSuccess: (result) => {
      setProblem('');
      setRowSelection({});
      void reloadFollowManage();
      toast(`YaFusionar ${result.done} GrupoCreadorAlias`);
    },
    onError: (cause) => setProblem(errorMessage(cause)),
  });

  const save = useMutation({
    mutationFn: (pair: { canonical: string; alias: string }) => addAlias(pair.canonical, pair.alias),
    onSuccess: () => {
      setProblem('');
      setCanonical('');
      setAlias('');
      void reloadFollowManage();
      toast('GuardadoCreadorAlias');
    },
    onError: (cause) => setProblem(errorMessage(cause)),
  });

  const drop = useMutation({
    mutationFn: async (names: string | string[]) => {
      const pending = typeof names === 'string' ? [names] : names;
      let done = 0;
      try {
        for (const name of pending) { await removeAlias(name); done += 1; }
      } catch (cause) {
        throw new Error(`${errorMessage(cause)}(YaQuitar ${done} Alias, 还Con ${pending.length - done} NoQuitar)`);
      } finally { void reloadFollowManage(); }
    },
    onSuccess: () => { setProblem(''); setSavedSelection({}); toast('YaQuitarCreadorAlias') },
    onError: (cause) => setProblem(errorMessage(cause)),
  });

  const mergeSome = (items: AliasSuggestion[], all: boolean) => {
    if (!items.length) return;
    void confirmModal({
      title: all ? 'FusionarTodoCreadorAlias' : 'Fusionar所选CreadorAlias',
      body: `将Fusionar以abajo ${items.length} GrupoCreador: ${items.map(
        (item) => `"${item.alias}"归入"${item.canonical}"`).join('; ')}. `,
      confirmLabel: all ? 'FusionarTodoAlias' : 'Fusionar所选Alias',
      onConfirm: () => merge.mutateAsync(items),
    });
  };

  const removeSome = (name: string) => void confirmModal({
    title: 'QuitarCreadorAlias', body: REMOVE_BODY(name),
    confirmLabel: 'QuitarCreadorAlias',
    onConfirm: () => drop.mutateAsync(name),
  });
  const handlers = useRef({ sources, readOnly, merging: merge.isPending,
    removing: drop.isPending, merge: mergeSome, remove: removeSome });
  handlers.current = { sources, readOnly, merging: merge.isPending,
    removing: drop.isPending, merge: mergeSome, remove: removeSome };

  const suggestionColumns = useMemo(() => {
    const column = createColumnHelper<typeof suggestionFeatures, AliasSuggestion>();
    return column.columns([
      column.display({
        id: 'select',
        header: (context) => (
          <Checkbox slot={null} isSelected={context.table.getIsAllRowsSelected()}
            isIndeterminate={context.table.getSelectedRowModel().rows.length > 0 && !context.table.getIsAllRowsSelected()}
            aria-label="Seleccionar todoPendienteFusionarAlias"
            onChange={(on) => context.table.toggleAllRowsSelected(on)} />
        ),
        cell: (context) => (
          <Checkbox slot={null} isSelected={context.row.getIsSelected()}
            aria-label={`SeleccionarAlias ${context.row.original.alias}, 归入 ${context.row.original.canonical}`}
            onChange={(on) => context.row.toggleSelected(on)} />
        ),
      }),
      column.accessor('canonical', {
        header: 'Normalizar creador',
        cell: (context) => <AuthorIdentity sources={handlers.current.sources} name={context.getValue()} />,
      }),
      column.accessor('alias', { header: 'Alias de plataforma', cell: (context) => context.getValue() }),
      column.accessor('evidence', {
        header: 'Criterio',
        cell: (context) => <span className="text-body-2-regular text-text-secondary">{context.getValue()}</span>,
      }),
      column.display({
        id: 'actions', header: 'Acción',
        cell: (context) => (
          <Button variant="secondary" size="small" disabled={handlers.current.readOnly}
            {...busyProps(handlers.current.merging)}
            onClick={() => handlers.current.merge([context.row.original], false)}>Fusionar</Button>
        ),
      }),
    ]);
  }, []);
  const savedColumns = useMemo(() => {
    const column = createColumnHelper<typeof savedFeatures, AliasGroup>();
    return column.columns([
      column.display({ id: 'select', header: ({ table }) => (
        <Checkbox slot={null} aria-label="Seleccionar todoGuardadoAlias" isSelected={table.getIsAllRowsSelected()}
          isIndeterminate={table.getIsSomeRowsSelected()} onChange={(on) => table.toggleAllRowsSelected(on)} />
      ), cell: ({ row }) => (
        <Checkbox slot={null} aria-label={`SeleccionarGuardadoAlias ${row.original.canonical_name}`}
          isSelected={row.getIsSelected()} onChange={(on) => row.toggleSelected(on)} />
      ) }),
      column.accessor('canonical_name', {
        id: 'canonical', header: 'Normalizar creador',
        cell: (context) => (
          <AuthorIdentity sources={handlers.current.sources} name={context.getValue()}
            canonicalKey={context.row.original.canonical_key} />
        ),
      }),
      column.accessor('aliases', {
        header: 'Alias de plataforma',
        sortFn: (a, b) => a.original.aliases.map((item) => item.name).join(' ').localeCompare(b.original.aliases.map((item) => item.name).join(' '), 'zh-CN'),
        cell: (context) => (
          <span className="flex flex-wrap items-center gap-1.5">
            {context.getValue().map((item) => (
              <span key={item.key}
                className="inline-flex items-center gap-1 rounded-md bg-background-secondary-default px-1.5 py-1 text-caption-1-medium text-text-secondary">
                {item.name}
                <Button variant="ghost" size="xs" iconOnly leadingIcon={RiCloseLine}
                  aria-label={`QuitarAlias ${item.name}`} disabled={handlers.current.readOnly}
                  {...busyProps(handlers.current.removing)}
                  onClick={() => handlers.current.remove(item.name)} />
              </span>
            ))}
          </span>
        ),
      }),
    ]);
  }, []);
  const suggestionTable = useTable({
    features: suggestionFeatures,
    data: suggestions,
    columns: suggestionColumns,
    getRowId: suggestionKey,
    state: { rowSelection, sorting, pagination: suggestionPage },
    onRowSelectionChange: (next) => { activateSuggestion(); setRowSelection(next); },
    onSortingChange: (next) => { setSorting(next); setPagination((now) => ({ ...now, pageIndex: 0 })); },
    onPaginationChange: setPagination,
    enableRowSelection: true,
  });
  const savedTable = useTable({
    features: savedFeatures,
    data: groups,
    columns: savedColumns,
    getRowId: (group) => group.canonical_key,
    state: { rowSelection: savedSelection, sorting: savedSorting, pagination: savedPage },
    onRowSelectionChange: (next) => { activateSaved(); setSavedSelection(next); }, enableRowSelection: true,
    onSortingChange: (next) => { setSavedSorting(next); setSavedPagination((now) => ({ ...now, pageIndex: 0 })); },
    onPaginationChange: setSavedPagination,
  });
  const chosen = suggestionTable.getSelectedRowModel().rows.map((row) => row.original);
  const savedNames = savedTable.getSelectedRowModel().rows.flatMap((row) => row.original.aliases.map((item) => item.name));
  const busy = busyProps(merge.isPending);

  return (
    <div className={cardClass({ padding: 'none', className: 'flex flex-col gap-4 px-6 py-5 max-sm:px-4' })}>
      <h3 className="text-title-2-medium text-text-primary">CreadorAlias</h3>

      <div className="flex flex-col gap-2">
        <FieldLabel>ManualAñadirAlias</FieldLabel>
        <div className="flex flex-wrap items-end gap-2">
          <Input aria-label="Normalizar nombre de creador" placeholder="Normalizar nombre de creador" value={canonical}
            onChange={setCanonical} isDisabled={readOnly} className="w-56" />
          <Input aria-label="Alias de plataforma" placeholder="Alias de plataforma" value={alias}
            onChange={setAlias} isDisabled={readOnly} className="w-56" />
          <Button variant="primary" disabled={readOnly || !canonical.trim() || !alias.trim()}
            {...busyProps(save.isPending)}
            onClick={() => save.mutate({ canonical: canonical.trim(), alias: alias.trim() })}>
            Guardar别名
          </Button>
        </div>
      </div>

      {problem ? <ErrorText>{problem}</ErrorText> : null}

      {suggestions.length ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <FieldLabel>PendienteFusionar</FieldLabel>
            <span className="mr-auto text-body-2-regular text-text-secondary">
              {`${suggestions.length} Grupo`}
            </span>
            <Button variant="primary" size="small" disabled={readOnly} {...busy}
              onClick={() => mergeSome(suggestions, true)}>{`TodoFusionar(${suggestions.length})`}</Button>
            <DataTableSort label="PendienteFusionarCreadorAlias" sorting={sorting}
              options={[{ id: 'canonical', label: 'Normalizar creador' }, { id: 'alias', label: 'Alias de plataforma' }, { id: 'evidence', label: 'Criterio' }]}
              onChange={(next) => { setSorting(next); setPagination((now) => ({ ...now, pageIndex: 0 })); }} />
          </div>
          <SelectionDock label="PendienteFusionarAliasOperación en lote" visible={chosen.length > 0} count={`Ya选 ${chosen.length} Grupo`}>
            <Button variant="secondary" size="small" disabled={readOnly} {...busy}
              onClick={() => mergeSome(chosen, false)}>{`Fusionar所选(${chosen.length})`}</Button>
            <Button variant="ghost" size="small" onClick={() => setRowSelection({})}>Deseleccionar</Button>
          </SelectionDock>
          <DataTableFrame follow>
            <Table aria-label="PendienteFusionarCreadorAlias" size="sm"
              sortDescriptor={sorting[0] ? { column: sorting[0].id, direction: sorting[0].desc ? 'descending' : 'ascending' } : undefined}
              onSortChange={(sort) => suggestionTable.getColumn(String(sort.column))?.toggleSorting(sort.direction === 'descending')}>
            <TableHeader>
              {suggestionTable.getHeaderGroups()[0]!.headers.map((header) => (
                <TableColumn key={header.id} id={header.id} isRowHeader={header.column.id === 'alias'} allowsSorting={header.column.getCanSort()}>
                  {({ sortDirection }) => <span className="flex items-center gap-0.5">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() ? <span data-sort-indicator data-direction={sortDirection || undefined}><ChevronSortDown /></span> : null}
                  </span>}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {suggestionTable.getRowModel().rows.map((row) => (
                <TableRow key={row.id} id={row.id} data-board-selected={row.getIsSelected() || undefined}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </DataTableFrame>
          <DataTableFooter label="PendienteFusionarCreadorAlias" unit="Grupo" total={suggestions.length} pagination={suggestionPage} onChange={setPagination} />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <FieldLabel>GuardadoAlias</FieldLabel>
          <span className="mr-auto text-body-2-regular text-text-secondary">{`${groups.length} Grupo`}</span>
          <DataTableSort label="GuardadoCreadorAlias" sorting={savedSorting}
            options={[{ id: 'canonical', label: 'Normalizar creador' }, { id: 'aliases', label: 'Alias de plataforma' }]}
            onChange={(next) => { setSavedSorting(next); setSavedPagination((now) => ({ ...now, pageIndex: 0 })); }} />
        </div>
        <SelectionDock label="GuardadoAliasOperación en lote" visible={savedNames.length > 0} count={`Ya选 ${savedNames.length} Alias`}>
          <Button variant="secondary" size="small" disabled={readOnly} {...busyProps(drop.isPending)}
            onClick={() => void confirmModal({ title: 'Quitar所选CreadorAlias',
              body: `将Quitar以abajo ${savedNames.length} Alias, 对应FuenteRestaurarComoIndependienteCreadorGrupo. `,
              items: savedNames,
              confirmLabel: 'Quitar所选Alias', onConfirm: () => drop.mutateAsync(savedNames) })}>
            {`Quitar所选Alias(${savedNames.length})`}
          </Button>
          <Button variant="ghost" size="small" onClick={() => setSavedSelection({})}>Deseleccionar</Button>
        </SelectionDock>
        {groups.length ? (
          <>
          <DataTableFrame follow>
            <Table aria-label="GuardadoCreadorAlias" size="sm"
              sortDescriptor={savedSorting[0] ? { column: savedSorting[0].id, direction: savedSorting[0].desc ? 'descending' : 'ascending' } : undefined}
              onSortChange={(sort) => savedTable.getColumn(String(sort.column))?.toggleSorting(sort.direction === 'descending')}>
            <TableHeader>
              {savedTable.getHeaderGroups()[0]!.headers.map((header) => (
                <TableColumn key={header.id} id={header.id} isRowHeader={header.column.id === 'canonical'} allowsSorting={header.column.getCanSort()}>
                  {({ sortDirection }) => <span className="flex items-center gap-0.5">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() ? <span data-sort-indicator data-direction={sortDirection || undefined}><ChevronSortDown /></span> : null}
                  </span>}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {savedTable.getRowModel().rows.map((row) => (
                <TableRow key={row.id} id={row.id} data-board-selected={row.getIsSelected() || undefined}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </DataTableFrame>
          <DataTableFooter label="GuardadoCreadorAlias" unit="Grupo" total={groups.length} pagination={savedPage} onChange={setSavedPagination} />
          </>
        ) : (
          <EmptyState shell="plain" icon={RiUserLine} title="Aún no hayGuardarCreadorAlias">
            Introduce写Normalizar创作者名 y Plataforma别名以添加. 
          </EmptyState>
        )}
      </div>
    </div>
  );
}
