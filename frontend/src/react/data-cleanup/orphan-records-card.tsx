/* DatosGestionarpáginaen la"HuérfanoRegistro": ArchivoyaNoEn盘arriba, 带着人RegistroObras(ADR-0087). 
 *
 * 每行unoya消失Obras: rápido照Imagen供认片, posterior面es它带Registro, EnBibliotecadentropuede能es它NuevoVersiónArchivo. 
 * 选unoArchivocontinuar过去, Registro搬到eseArchivoarriba, antiguo行删掉, Completo批puede按批次号撤回; 彻底Eliminar连Registrouno起
 * 删, 过危险档Confirmar弹层. Sinya消失Obras时CompletoNo出现.  */
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
    onSuccess: (data) => { toast(`RegistroYacontinuar到Nuevo archivo, 批次 ${data.batch}`); void refresh(); },
    onError: (error) => toast(errorMessage(error)),
  });
  const purge = useMutation({
    mutationFn: () => purgeOrphan(item.id),
    onSuccess: (data) => {
      toast(data.blocked.length
        ? `${item.name} Archivo又回到盘arriba, SinEliminar; Siguiente次Escanear会它continuar回EnBiblioteca`
        : `YaEliminar permanentemente ${item.name}`);
      void refresh();
    },
  });
  const remove = () => {
    void confirmModal({
      title: 'Eliminar permanentemente',
      body: `将Eliminar"${item.name}"esteunoResultado y 它带Registro(${recordsText(item.records)}). 此AcciónNopuedeDeshacer. `,
      confirmLabel: 'Eliminar permanentemente',
      danger: true,
      onConfirm: () => purge.mutateAsync(),
    });
  };
  const busy = attach.isPending || purge.isPending;
  return (
    <span className="flex min-w-48 flex-wrap items-center gap-2">
        {item.candidates.length
          ? <Select aria-label={` ${item.name} Registrocontinuar到哪Archivo`} className="w-52" selectedKey={target}
              onSelectionChange={(key) => { if (key !== null) setTarget(Number(key)) }}>
              {item.candidates.map((candidate) => (
                <SelectItem key={candidate.id} id={candidate.id} textValue={candidateText(candidate)}>
                  {candidateText(candidate)}
                </SelectItem>
              ))}
            </Select>
          : <span className="text-text-secondary">SinCódigo JAV或Nombre de archivo对得en laArchivo</span>}
        {item.candidates.length
          ? <Button size="small" disabled={target === null} {...busyProps(busy)}
              onClick={() => attach.mutate()}>continuar到esteArchivo</Button>
          : null}
        <Button variant="danger" size="small" {...busyProps(busy)} onClick={remove}>Eliminar permanentemente</Button>
    </span>
  );
}

function OrphanIdentity({ item }: { item: OrphanRecord }) {
  return (
        <span className="flex min-w-0 items-center gap-3">
          {/* rápido照Imagen供认片; SinImagen或取No到时Dejauno格带描边占,  y RepetirArchivopáginaPortada格同uno样子. 
              estrecho屏收起, ancho度让给名字yRegistro.  */}
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
      toast(`YaEliminar permanentemente ${data.purged}  registro(s)${data.blocked.length ? `, ${data.blocked.length} ResultadoArchivoYaRestaurar, NoEliminar` : ''}`);
      setSelected([]); void refresh();
    },
  });
  const removeSelected = (chosen: OrphanRecord[]) => void confirmModal({
    title: 'Eliminar permanentemente los registros seleccionados',
    body: `将Eliminar以abajo ${chosen.length} ResultadoObra y 它们带TodoRegistro. 此AcciónNopuedeDeshacer. `,
    items: chosen.map((item) => item.name),
    confirmLabel: 'Eliminar permanentemente los registros seleccionados', danger: true,
    onConfirm: () => purge.mutateAsync(chosen.map((item) => item.id)),
  });
  const columns: DataColumn<OrphanRecord>[] = [
    { id: 'item', label: 'Obra', value: (item) => item.name, render: (item) => <OrphanIdentity item={item} /> },
    { id: 'records', label: '带Registro', value: (item) => recordsText(item.records),
      render: (item) => <span className="block min-w-28">{recordsText(item.records) || 'Ninguno人Registro'}</span> },
    { id: 'target', label: 'continuar到yAcción', value: (item) => item.candidates.length,
      render: (item) => <OrphanActions item={item} toast={toast} /> },
  ];
  if (!query.isError && !items.length) return null;
  return (
    <section id="orphan-records" aria-labelledby="orphan-records-title" className="flex scroll-mt-20 flex-col gap-4">
        {query.isError
          ? <Fieldset layout="stack" labelledBy="orphan-records-title">
              <FieldsetTitle id="orphan-records-title">Registros huérfanos</FieldsetTitle>
              <Note tone="error" title="Registros huérfanos读取Fallido">{errorMessage(query.error)}</Note>
            </Fieldset>
          : <DataTable label="ArchivoYa消失Obra" items={items} columns={columns}
              title="Registros huérfanos" titleId="orphan-records-title" unit="ResultadoObra"
              description="este些ObraArchivoYaNoEn盘arriba, Me gusta, Ver más tarde, Lista de reproducciónyVerHistorial都还Deja着. continuar到Nuevo archivoposteriorRegistro跟过去, antiguoesteunoResultado删掉. "
              rowId={(item) => String(item.id)} rowLabel={(item) => item.name}
              selected={selected} onSelected={setSelected}
              actions={(chosen) => <Button variant="danger" size="small" disabled={!chosen.length}
                {...busyProps(purge.isPending)} onClick={() => removeSelected(chosen)}>
                {`Eliminar permanentemente所选(${chosen.length})`}
              </Button>} />}
    </section>
  );
}
