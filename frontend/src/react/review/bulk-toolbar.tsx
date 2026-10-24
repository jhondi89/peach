/* 复核Filtrary批量动作: AgruparMétodo, CategoríaFiltrar, Seleccionar todo本páginaDejaEn吸顶栏, 所Opciones目判定动作
 * 使用primeropágina同款底部悬浮框. 
 *
 * AgruparMétodo y 筛Opciones按**CompletoCola**算, 卡片Solo画当anterioresteunoPágina: Filtraren la计数说esCola, Noes
 * esteuno屏. Filtraralto度保持No变, 勾Opciones目时No会abajo滑posterior吸顶contenido往abajo推.  */
import { RiCheckDoubleLine } from '@remixicon/react';

import { Button } from '@/components/base/buttons/button';
import { Select, SelectItem } from '@/components/base/select/select';
import { SelectionDock } from '../components/selection-dock';
import type { DecisionStatus, ReviewGroup, ReviewGrouping, ReviewRow } from './review';
import { commonReviewSources } from './review';

export interface BulkToolbarProps {
  groupOptions: [ReviewGrouping, string][];
  groupBy: ReviewGrouping;
  onGroupBy(next: ReviewGrouping): void;
  groups: ReviewGroup[];
  filter: string;
  onFilter(next: string): void;
  /** 当anterioresteunopáginaen la行, Seleccionar todo就esSeleccionar todo它们.  */
  pageKeys: string[];
  selected: ReadonlySet<string>;
  onSelected(next: Set<string>): void;
  /** 选en procesoese些行, 用来算共同来源.  */
  selectedRows: ReviewRow[];
  metadata: boolean;
  /** 所Opciones目dentro还能No能按abajo"通过所选".  */
  approvable: boolean;
  busy: boolean;
  feedback: string;
  onUnifySource(source: string): void;
  onRun(status: Extract<DecisionStatus, 'approved' | 'rejected'>): void;
}

export function BulkToolbar(props: BulkToolbarProps) {
  const {
    groupOptions, groupBy, onGroupBy, groups, filter, onFilter, pageKeys, selected, onSelected,
    selectedRows, metadata, approvable, busy, feedback, onUnifySource, onRun,
  } = props;
  const shown = pageKeys.filter((key) => selected.has(key));
  const allShown = shown.length > 0 && shown.length === pageKeys.length;
  const sources = commonReviewSources(selectedRows);
  const needsSource = metadata && selectedRows.some((row) => (row.candidates?.length || 0) > 1);
  const sourceLabel = sources.length ? 'Selección unificada de fuente' : '所Opciones目Ninguno共同Fuente';

  const toggleAll = () => {
    const next = new Set(selected);
    for (const key of pageKeys) { if (allShown) next.delete(key); else next.add(key) }
    onSelected(next);
  };

  return (
    <>
      <div role="group" aria-label="复核Filtrar" data-review-filter data-glass-pane=""
        className="sticky top-topbar z-10 flex flex-wrap items-center gap-2 p-3">
        <Select aria-label="Filtrar分GrupoMétodo" size="sm" selectedKey={groupBy}
          onSelectionChange={(key) => { if (key !== null) onGroupBy(String(key) as ReviewGrouping) }}>
          {groupOptions.map(([key, name]) => <SelectItem key={key} id={key}>{name}</SelectItem>)}
        </Select>
        {/* SoloConuno组时没什么puede筛: uno"TodoCategoría"abajo拉读起来像坏.  */}
        {groups.length > 1 ? (
          <Select aria-label={groupBy === 'field' ? 'Filtrar字段Categoría' : 'FiltrarActualCategoría'} size="sm"
            selectedKey={filter || '*'}
            onSelectionChange={(key) => { if (key !== null) onFilter(String(key) === '*' ? '' : String(key)) }}>
            <SelectItem id="*">TodoCategoría</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.key} id={group.key}>
                {`${group.title} · ${group.rows.length}`}
              </SelectItem>
            ))}
          </Select>
        ) : null}
        <Button variant="secondary" size="small" leadingIcon={RiCheckDoubleLine}
          aria-pressed={allShown} disabled={busy || !pageKeys.length} onClick={toggleAll}>
          {allShown ? 'LimpiarActualSeleccionar' : filter ? 'Seleccionar todoActualCategoría' : 'Seleccionar toda la página'}
        </Button>
      </div>

        <SelectionDock label="Revisar elementos seleccionados" visible={selected.size > 0} count={`Ya选 ${selected.size} 项`}>
          {needsSource ? (
            <Select aria-label="Selección unificada de fuente" size="sm" selectedKey=""
              isDisabled={busy || !sources.length}
              onSelectionChange={(key) => { if (key !== null && key !== '') onUnifySource(String(key)) }}>
              <SelectItem id="">{sourceLabel}</SelectItem>
              {sources.map((source) => <SelectItem key={source} id={source}>{source}</SelectItem>)}
            </Select>
          ) : null}
          <Button variant="primary" size="small" disabled={busy || !selected.size || !approvable}
            onClick={() => onRun('approved')}>Aceptar所选</Button>
          <Button variant="danger" size="small" disabled={busy || !selected.size}
            onClick={() => onRun('rejected')}>Rechazar所选</Button>
          <Button variant="ghost" size="small" disabled={busy}
            onClick={() => onSelected(new Set())}>Deseleccionar</Button>
          {feedback
            ? <p role="status" className="w-full text-body-2-regular text-text-secondary">{feedback}</p>
            : null}
        </SelectionDock>
    </>
  );
}
