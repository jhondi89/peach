/* 创作者别名：同一个人在几个站上用几个名字，合并之后按一位创作者归组。
 *
 * 待合并是带依据的候选，合并永远由人点：服务端不自行升级，页面也不替他勾。 */
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

const REMOVE_BODY = (alias: string) => `Se quitará el alias “${alias}” y su fuente volverá a ser un grupo de creador independiente.`;
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

/** 一条待合并的身份：一个别名只可能归进一个规范名，所以用别名本身当键。 */
const suggestionKey = (item: AliasSuggestion) => item.alias;

function authorSources(sources: FollowSource[], name: string, canonicalKey?: string) {
  /* 建过档的作者键是 `entity:<id>`，别名表上记的仍是名字键：按名字键找不到就按名字认。 */
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

  /* 合并按顺序一条一条发：一次失败要报出「还有几组没合」，而并发发出去的话，说不清
     停在了哪里。 */
  const merge = useMutation({
    mutationFn: async (items: AliasSuggestion[]) => {
      let done = 0;
      for (const item of items) {
        try {
          await addAlias(item.canonical, item.alias);
        } catch (cause) {
          /* 半路断了要说清停在哪儿：已经合上的那几组先落回列表里去掉，再点一次只发剩下的。 */
          if (done) void reloadFollowManage();
          throw new Error(`${errorMessage(cause)} (faltan ${items.length - done} grupos por fusionar)`);
        }
        done += 1;
      }
      return { done, items };
    },
    onSuccess: (result) => {
      setProblem('');
      setRowSelection({});
      void reloadFollowManage();
      toast(`Se fusionaron ${result.done} grupos de alias de creadores`);
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
      toast('Alias de creador guardado');
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
        throw new Error(`${errorMessage(cause)} (se quitaron ${done} alias, faltan ${pending.length - done})`);
      } finally { void reloadFollowManage(); }
    },
    onSuccess: () => { setProblem(''); setSavedSelection({}); toast('Alias de creador quitado') },
    onError: (cause) => setProblem(errorMessage(cause)),
  });

  const mergeSome = (items: AliasSuggestion[], all: boolean) => {
    if (!items.length) return;
    void confirmModal({
      title: all ? 'Fusionar todos los alias de creadores' : 'Fusionar los alias de creadores seleccionados',
      body: `Se fusionarán estos ${items.length} grupos de creadores: ${items.map(
        (item) => `“${item.alias}” pasa a “${item.canonical}”`).join('；')}.`,
      confirmLabel: all ? 'Fusionar todos los alias' : 'Fusionar alias seleccionados',
      onConfirm: () => merge.mutateAsync(items),
    });
  };

  const removeSome = (name: string) => void confirmModal({
    title: 'Quitar alias de creador', body: REMOVE_BODY(name),
    confirmLabel: 'Quitar alias de creador',
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
            aria-label="Seleccionar todos los alias por fusionar"
            onChange={(on) => context.table.toggleAllRowsSelected(on)} />
        ),
        cell: (context) => (
          <Checkbox slot={null} isSelected={context.row.getIsSelected()}
            aria-label={`Seleccionar alias ${context.row.original.alias}, pasa a ${context.row.original.canonical}`}
            onChange={(on) => context.row.toggleSelected(on)} />
        ),
      }),
      column.accessor('canonical', {
        header: 'Creador principal',
        cell: (context) => <AuthorIdentity sources={handlers.current.sources} name={context.getValue()} />,
      }),
      column.accessor('alias', { header: 'Alias en la plataforma', cell: (context) => context.getValue() }),
      column.accessor('evidence', {
        header: 'Motivo',
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
        <Checkbox slot={null} aria-label="Seleccionar todos los alias guardados" isSelected={table.getIsAllRowsSelected()}
          isIndeterminate={table.getIsSomeRowsSelected()} onChange={(on) => table.toggleAllRowsSelected(on)} />
      ), cell: ({ row }) => (
        <Checkbox slot={null} aria-label={`Seleccionar alias guardado ${row.original.canonical_name}`}
          isSelected={row.getIsSelected()} onChange={(on) => row.toggleSelected(on)} />
      ) }),
      column.accessor('canonical_name', {
        id: 'canonical', header: 'Creador principal',
        cell: (context) => (
          <AuthorIdentity sources={handlers.current.sources} name={context.getValue()}
            canonicalKey={context.row.original.canonical_key} />
        ),
      }),
      column.accessor('aliases', {
        header: 'Alias en la plataforma',
        sortFn: (a, b) => a.original.aliases.map((item) => item.name).join(' ').localeCompare(b.original.aliases.map((item) => item.name).join(' '), 'zh-CN'),
        cell: (context) => (
          <span className="flex flex-wrap items-center gap-1.5">
            {context.getValue().map((item) => (
              <span key={item.key}
                className="inline-flex items-center gap-1 rounded-md bg-background-secondary-default px-1.5 py-1 text-caption-1-medium text-text-secondary">
                {item.name}
                <Button variant="ghost" size="xs" iconOnly leadingIcon={RiCloseLine}
                  aria-label={`Quitar alias ${item.name}`} disabled={handlers.current.readOnly}
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
      <h3 className="text-title-2-medium text-text-primary">Alias de creadores</h3>

      <div className="flex flex-col gap-2">
        <FieldLabel>Añadir alias manualmente</FieldLabel>
        <div className="flex flex-wrap items-end gap-2">
          <Input aria-label="Nombre principal del creador" placeholder="Nombre principal del creador" value={canonical}
            onChange={setCanonical} isDisabled={readOnly} className="w-56" />
          <Input aria-label="Alias en la plataforma" placeholder="Alias en la plataforma" value={alias}
            onChange={setAlias} isDisabled={readOnly} className="w-56" />
          <Button variant="primary" disabled={readOnly || !canonical.trim() || !alias.trim()}
            {...busyProps(save.isPending)}
            onClick={() => save.mutate({ canonical: canonical.trim(), alias: alias.trim() })}>
            Guardar alias
          </Button>
        </div>
      </div>

      {problem ? <ErrorText>{problem}</ErrorText> : null}

      {suggestions.length ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <FieldLabel>Por fusionar</FieldLabel>
            <span className="mr-auto text-body-2-regular text-text-secondary">
              {`${suggestions.length} grupos`}
            </span>
            <Button variant="primary" size="small" disabled={readOnly} {...busy}
              onClick={() => mergeSome(suggestions, true)}>{`Fusionar todos (${suggestions.length})`}</Button>
            <DataTableSort label="Alias de creadores por fusionar" sorting={sorting}
              options={[{ id: 'canonical', label: 'Creador principal' }, { id: 'alias', label: 'Alias en la plataforma' }, { id: 'evidence', label: 'Motivo' }]}
              onChange={(next) => { setSorting(next); setPagination((now) => ({ ...now, pageIndex: 0 })); }} />
          </div>
          <SelectionDock label="Acciones en lote de alias por fusionar" visible={chosen.length > 0} count={`${chosen.length} grupos seleccionados`}>
            <Button variant="secondary" size="small" disabled={readOnly} {...busy}
              onClick={() => mergeSome(chosen, false)}>{`Fusionar seleccionados (${chosen.length})`}</Button>
            <Button variant="ghost" size="small" onClick={() => setRowSelection({})}>Quitar selección</Button>
          </SelectionDock>
          <DataTableFrame follow>
            <Table aria-label="Alias de creadores por fusionar" size="sm"
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
          <DataTableFooter label="Alias de creadores por fusionar" unit="grupos" total={suggestions.length} pagination={suggestionPage} onChange={setPagination} />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <FieldLabel>Alias guardados</FieldLabel>
          <span className="mr-auto text-body-2-regular text-text-secondary">{`${groups.length} grupos`}</span>
          <DataTableSort label="Alias de creador guardado" sorting={savedSorting}
            options={[{ id: 'canonical', label: 'Creador principal' }, { id: 'aliases', label: 'Alias en la plataforma' }]}
            onChange={(next) => { setSavedSorting(next); setSavedPagination((now) => ({ ...now, pageIndex: 0 })); }} />
        </div>
        <SelectionDock label="Acciones en lote de alias guardados" visible={savedNames.length > 0} count={`${savedNames.length} alias seleccionados`}>
          <Button variant="secondary" size="small" disabled={readOnly} {...busyProps(drop.isPending)}
            onClick={() => void confirmModal({ title: 'Quitar alias de creadores seleccionados',
              body: `Se quitarán estos ${savedNames.length} alias y sus fuentes volverán a ser grupos de creador independientes.`,
              items: savedNames,
              confirmLabel: 'Quitar alias seleccionados', onConfirm: () => drop.mutateAsync(savedNames) })}>
            {`Quitar alias seleccionados (${savedNames.length})`}
          </Button>
          <Button variant="ghost" size="small" onClick={() => setSavedSelection({})}>Quitar selección</Button>
        </SelectionDock>
        {groups.length ? (
          <>
          <DataTableFrame follow>
            <Table aria-label="Alias de creador guardado" size="sm"
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
          <DataTableFooter label="Alias de creador guardado" unit="grupos" total={groups.length} pagination={savedPage} onChange={setSavedPagination} />
          </>
        ) : (
          <EmptyState shell="plain" icon={RiUserLine} title="Aún no hay alias de creadores guardados">
            Escribe el nombre principal del creador y el alias en la plataforma para añadirlo.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
