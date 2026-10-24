import { useState } from 'react';
import { RiFileListLine } from '@remixicon/react';
import { Button } from '@/components/base/buttons/button';
import { LinkButton } from '@/components/base/buttons/link-button';
import { fmtDur, fmtSize, LOC } from '@peach/legacy/core';
import { DataTable, type DataColumn } from '../components/data-table';
import { EmptyState } from '../components/empty-state';
import { Note } from '../components/note';
import { Disclosure, Stack } from '../settings/section';
import { busyProps, useAction } from '../settings/use-action';
import type { LibraryGroup, LibraryItem } from './diagnostics';

const identity = (item: LibraryItem) => item.title || item.name || item.code || `Obra n.º ${item.id}`;
const listText = (items: LibraryItem[]) => [
  ['Obra', 'Código', 'Nombre de archivo', 'Biblioteca', 'Ruta', 'Duración (s)', 'Tamaño (bytes)'],
  ...items.map(item => [identity(item), item.code ?? '', item.name, LOC[item.location] || item.location,
    item.path, item.duration ?? '', item.size ?? '']),
].map(row => row.map(value => String(value ?? '').replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n');

export function HealthList({ group, openItem, receipt }: {
  group: LibraryGroup; openItem(id: number): void; receipt(message: string): void;
}) {
  const action = useAction();
  const [selected, setSelected] = useState<string[]>([]);
  const copy = (items: LibraryItem[]) => void action.run('copy',
    () => navigator.clipboard.writeText(listText(items)), () => receipt('Lista copiada'));
  const columns: DataColumn<LibraryItem>[] = [
    { id: 'title', label: 'Obra', value: identity, render: item => <span className="flex min-w-48 max-w-72 flex-col gap-1">
      <LinkButton variant="primary" className="justify-start whitespace-normal text-left"
        onClick={() => openItem(item.id)}>{identity(item)}</LinkButton>
      {item.name && item.name !== identity(item)
        ? <span data-middle-truncate title={item.name} className="block min-w-0 text-caption-1-regular text-text-secondary">{item.name}</span> : null}
    </span> },
    { id: 'code', label: 'Código', value: item => item.code || '',
      render: item => <span className="whitespace-nowrap">{item.code || 'Sin identificar'}</span> },
    { id: 'location', label: 'Biblioteca', value: item => LOC[item.location] || item.location,
      render: item => LOC[item.location] || item.location || 'No obtenidos' },
    { id: 'path', label: 'Ruta del archivo', value: item => item.path,
      render: item => <span data-middle-truncate title={item.path}
        className="block w-64 text-body-2-regular text-text-secondary">{item.path || 'No obtenidos'}</span> },
    { id: 'duration', label: 'Duración', value: item => item.duration ?? 0,
      render: item => item.duration && item.duration > 0 ? fmtDur(item.duration) : 'No obtenidos' },
    { id: 'size', label: 'Tamaño', value: item => item.size ?? 0,
      render: item => item.size !== null ? fmtSize(item.size) : 'No obtenidos' },
  ];
  return <Disclosure summary={`${group.label} · ${group.count === null ? 'No obtenidos' : `${group.count.toLocaleString()} elementos`}`}>
    {group.count === null ? <Note tone="neutral">No se obtuvo la lista; vuelve a revisar.</Note> : !group.items.length
      ? <EmptyState icon={RiFileListLine} title="La lista está vacía" shell="plain">No hay obras que requieran acción.</EmptyState>
      : <Stack>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {group.truncated ? <span className="text-body-2-regular text-text-secondary">
            Cargados {group.items.length.toLocaleString()} / {group.count.toLocaleString()}
          </span> : null}
          <Button size="small" variant="secondary" {...busyProps(action.busy === 'copy')}
            onClick={() => copy(group.items)}>Copiar la lista actual</Button>
        </div>
        {action.error ? <Note tone="error">{action.error}</Note> : null}
        <DataTable label={group.label} title="Lista de obras" unit="obras" panel={false}
          items={group.items} columns={columns} rowId={item => String(item.id)} rowLabel={identity}
          selected={selected} onSelected={setSelected}
          actions={items => <Button size="small" variant="secondary" {...busyProps(action.busy === 'copy')}
            onClick={() => copy(items)}>Copiar seleccionados</Button>} />
      </Stack>}
  </Disclosure>;
}
