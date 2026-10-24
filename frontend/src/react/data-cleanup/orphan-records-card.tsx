/* 数据管理页上的「孤儿记录」：文件已不在盘上、带着个人记录的作品（ADR-0087）。
 *
 * 每行一条已消失的作品：快照图供认片，后面是它带的记录、在库里可能是它新版本的文件。
 * 选一个文件接过去，记录搬到那个文件上、旧行删掉，整批可按批次号撤回；彻底删除连记录一起
 * 删，过危险档确认弹层。没有已消失的作品时整块不出现。 */
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { confirmModal } from '@peach/legacy/ui';
import { LOC } from '@peach/legacy/core';

import { Button } from '@/components/base/buttons/button';
import { Select, SelectItem } from '@/components/base/select/select';

import { errorMessage } from '../../api';
import { DataTable, type DataColumn } from '../components/data-table';
import { Fieldset, FieldsetTitle } from '../components/fieldset';
import { Note } from '../components/note';
import { spriteGlyph } from '../components/sprite-glyph';
import { queryClient } from '../query';
import { busyProps } from '../settings/use-action';
import {
  attachOrphan, candidateText, fetchOrphanRecords, ORPHAN_RECORDS_KEY, purgeOrphan, recordsText,
  type OrphanRecord,
} from './orphan-records';

const PLAY = spriteGlyph('play');

const refresh = () => queryClient.invalidateQueries({ queryKey: ORPHAN_RECORDS_KEY, exact: true });

function OrphanActions({ item, toast }: { item: OrphanRecord; toast(message: string): void }) {
  const [target, setTarget] = useState<number | null>(item.candidates[0]?.id ?? null);
  const attach = useMutation({
    mutationFn: () => attachOrphan(item.id, Number(target)),
    onSuccess: (data) => { toast(`Registro conectado al archivo nuevo, lote ${data.batch}`); void refresh(); },
    onError: (error) => toast(errorMessage(error)),
  });
  const purge = useMutation({
    mutationFn: () => purgeOrphan(item.id),
    onSuccess: (data) => {
      toast(data.blocked.length
        ? `El archivo de ${item.name} volvió al disco, así que no se borró; el próximo escaneo lo volverá a enlazar`
        : `${item.name} eliminado definitivamente`);
      void refresh();
    },
  });
  const remove = () => {
    void confirmModal({
      title: 'Eliminar definitivamente',
      body: `Se borrará “${item.name}” junto con sus registros (${recordsText(item.records)}). No se puede deshacer.`,
      confirmLabel: 'Eliminar definitivamente',
      danger: true,
      onConfirm: () => purge.mutateAsync(),
    });
  };
  const busy = attach.isPending || purge.isPending;
  return (
    <span className="flex min-w-48 flex-wrap items-center gap-2">
        {item.candidates.length
          ? <Select aria-label={`A qué archivo conectar los registros de ${item.name}`} className="w-52" selectedKey={target}
              onSelectionChange={(key) => { if (key !== null) setTarget(Number(key)) }}>
              {item.candidates.map((candidate) => (
                <SelectItem key={candidate.id} id={candidate.id} textValue={candidateText(candidate)}>
                  {candidateText(candidate)}
                </SelectItem>
              ))}
            </Select>
          : <span className="text-text-secondary">No hay archivos cuyo código o nombre coincida</span>}
        {item.candidates.length
          ? <Button size="small" disabled={target === null} {...busyProps(busy)}
              onClick={() => attach.mutate()}>Conectar a este archivo</Button>
          : null}
        <Button variant="danger" size="small" {...busyProps(busy)} onClick={remove}>Eliminar definitivamente</Button>
    </span>
  );
}

function OrphanIdentity({ item }: { item: OrphanRecord }) {
  return (
        <span className="flex min-w-0 items-center gap-3">
          {/* 快照图供认片；没有图或取不到时留一格带描边的占位，和重复文件页的封面格同一个样子。
              窄屏收起，把宽度让给名字与记录。 */}
          <span className="relative inline-grid aspect-16/10 w-24 flex-none place-items-center max-cleanup-tight:hidden overflow-hidden rounded-lg border border-separator-border bg-background-tertiary-default text-text-tertiary">
            <PLAY aria-hidden className="size-5" />
            {item.has_thumb
              ? <img src={`/thumb?id=${item.id}&c=4`} alt="" loading="lazy"
                  onError={(event) => event.currentTarget.remove()}
                  className="absolute inset-0 size-full object-contain" />
              : null}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span title={item.name} className="max-w-56 truncate text-body-regular text-text-primary">{item.name}</span>
            <small className="max-w-56 truncate text-caption-1-regular text-text-secondary">
              {[item.code, LOC[item.location] || item.location].filter(Boolean).join(' · ')}
            </small>
          </span>
        </span>
  );
}

export function OrphanRecordsCard({ toast }: { toast(message: string): void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const query = useQuery({ queryKey: ORPHAN_RECORDS_KEY, queryFn: ({ signal }) => fetchOrphanRecords(signal) });
  const items = query.data?.items ?? [];
  const purge = useMutation({
    mutationFn: (ids: number[]) => purgeOrphan(ids),
    onSuccess: (data) => {
      toast(`Se eliminaron definitivamente ${data.purged} registros${data.blocked.length ? `, ${data.blocked.length} archivos se recuperaron y no se borraron` : ''}`);
      setSelected([]); void refresh();
    },
  });
  const removeSelected = (chosen: OrphanRecord[]) => void confirmModal({
    title: 'Eliminar definitivamente los registros seleccionados',
    body: `Se borrarán estas ${chosen.length} obras y todos sus registros. No se puede deshacer.`,
    items: chosen.map((item) => item.name),
    confirmLabel: 'Eliminar definitivamente los registros seleccionados', danger: true,
    onConfirm: () => purge.mutateAsync(chosen.map((item) => item.id)),
  });
  const columns: DataColumn<OrphanRecord>[] = [
    { id: 'item', label: 'Obra', value: (item) => item.name, render: (item) => <OrphanIdentity item={item} /> },
    { id: 'records', label: 'Registros', value: (item) => recordsText(item.records),
      render: (item) => <span className="block min-w-28">{recordsText(item.records) || 'Sin registros personales'}</span> },
    { id: 'target', label: 'Conexión y acciones', value: (item) => item.candidates.length,
      render: (item) => <OrphanActions item={item} toast={toast} /> },
  ];
  if (!query.isError && !items.length) return null;
  return (
    <section id="orphan-records" aria-labelledby="orphan-records-title" className="flex scroll-mt-20 flex-col gap-4">
        {query.isError
          ? <Fieldset layout="stack" labelledBy="orphan-records-title">
              <FieldsetTitle id="orphan-records-title">Registros huérfanos</FieldsetTitle>
              <Note tone="error" title="No se pudieron cargar los registros huérfanos">{errorMessage(query.error)}</Note>
            </Fieldset>
          : <DataTable label="Obras cuyo archivo desapareció" items={items} columns={columns}
              title="Registros huérfanos" titleId="orphan-records-title" unit="obras"
              description="Los archivos de estas obras ya no están en el disco, pero sus me gusta, Ver más tarde, listas e historial siguen guardados. Al conectarlas a un archivo nuevo, los registros pasan a él y se borra la entrada vieja."
              rowId={(item) => String(item.id)} rowLabel={(item) => item.name}
              selected={selected} onSelected={setSelected}
              actions={(chosen) => <Button variant="danger" size="small" disabled={!chosen.length}
                {...busyProps(purge.isPending)} onClick={() => removeSelected(chosen)}>
                {`Eliminar definitivamente los seleccionados (${chosen.length})`}
              </Button>} />}
    </section>
  );
}
