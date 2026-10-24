/* alto清版目标Página: DatosBibliotecadentroEtiquetaComo"还该Con更bienuno版"ese些Obras. 
 *
 * uno屏回答两件事: 还欠másmenos部, 每uno部欠En哪dentro. 所以卡片arriba除Título就SoloCon来源, Duración, 
 * 体积 y 判定Original因—决定要No要去找更bienuno版, ver就eseste几项. 
 *
 * Código JAVTítuloy来源徽标由遗Deja层以 HTML 字符串传进来: 它们esTodo站语义契约唯uno实现, 
 * Enaquípesado写uno就会漂. Duración, 体积, 来源名走 `src/core/index.ts` 同uno套Formato化口径, 同理.  */
import { useState } from 'react';
import { RiSparklingLine } from '@remixicon/react';
import { useQuery } from '@tanstack/react-query';

import { LOC, fmtDur, fmtSize } from '@peach/legacy/core';

import { Button } from '@/components/base/buttons/button';

import { errorMessage } from '../../api';
import { CloudDownloadDialog, type DownloadPrefill } from '../activity/cloud-download-dialog';
import type { QualityGoalsProps } from '../bundle';
import { cardClass } from '../components/card';
import { CollectionSummary } from '../components/collection-summary';
import { EmptyState } from '../components/empty-state';
import { Note } from '../components/note';
import { Page } from '../components/page';
import {
  fetchQualityGoals, previewUrl, QUALITY_GOALS_KEY, type QualityGoal,
} from './quality-goals';

/** uno部待Actualizar aObrasuno卡.  */
function GoalCard({ item, openItem, searchResources, javTitleHtml, javDisplayName, srcBadge }: { item: QualityGoal }
  & Omit<QualityGoalsProps, 'toast'> & { searchResources(prefill: DownloadPrefill): void }) {
  const open = () => openItem(item.id);
  return (
    <li data-goal-id={item.id}
      className={cardClass({ padding: 'none', bordered: 'soft', className: 'flex flex-col gap-3 p-3' })}>
      <div className="flex min-w-0 gap-4">
        {/* 居en procesoese句占文字用 `inline-grid`: antiguo样表dentro `.grid` es海报Muroese带列ancho y 
            EspaciadoRegla, 排En `peach-app.css` posterior面会赢. este按钮es flex 子项, 行interior格
            会被级化, 算出来仍es `display:grid`.  */}
        <button type="button" onClick={open} aria-label={`Abrir ${javDisplayName(item)}`}
          className="relative inline-grid w-card-cover shrink-0 self-start aspect-card-cover cursor-pointer place-items-center overflow-hidden rounded-2lg bg-background-tertiary-default">
          {/* Imagen片取No到时(onError  img 摘掉)露出来就eseste句.  */}
          <span className="text-caption-1-regular text-text-secondary">暂Sin vista previa</span>
          <img src={previewUrl(item)} alt="" loading="lazy"
            onError={(event) => event.currentTarget.remove()}
            className="absolute inset-0 size-full object-contain" />
        </button>
        <div className="flex min-w-0 flex-col gap-1.5">
          {/* Título从Código JAV读起, largo折到No.dos行再截尾: en proceso段截断会Código JAV y 片名uno起切掉.  */}
          <h3 className="text-headline-medium text-text-primary">
            <button type="button" onClick={open} title={javDisplayName(item)}
              className="line-clamp-2 w-full cursor-pointer text-left wrap-anywhere"
              dangerouslySetInnerHTML={{ __html: javTitleHtml(item) }} />
          </h3>
          <p className="flex flex-wrap items-center gap-2 text-body-2-regular text-text-secondary">
            {/* 插Original HTML 要Con宿主元素, 而来源徽标En遗DejaVersióndentroeseste flex 容Dispositivo直continuar
                子项. `contents` 让宿主从Diseñodentro消失, 徽标对齐yEspaciado保持No变.  */}
            <span className="contents" dangerouslySetInnerHTML={{ __html: srcBadge(item.location, item.cost) }} />
            <span>{LOC[item.location] ?? item.location}</span>
            <span>{fmtDur(item.duration)}</span>
            <span>{Number(item.size) > 0 ? fmtSize(Number(item.size)) : 'Tamaño desconocido'}</span>
          </p>
          {item.reason
            ? <p className="border-t border-separator-border pt-3 text-body-2-regular text-text-secondary wrap-anywhere">
                {item.reason}
              </p>
            : null}
        </div>
      </div>
      <footer className="flex flex-wrap justify-end gap-2">
        {item.code ? <Button variant="secondary" size="small" onClick={() => searchResources({
          code: item.code!, title: javDisplayName(item), origin: `asset:${item.id}`, searchReason: item.reason || '',
          duration: item.duration, cover: previewUrl(item),
        })}>Buscar recursos</Button> : null}
        <Button variant="secondary" size="small" onClick={open}>Ver versión</Button>
      </footer>
    </li>
  );
}

export function QualityGoalsPage({ toast, ...props }: QualityGoalsProps) {
  const [download, setDownload] = useState<DownloadPrefill | null>(null);
  const goals = useQuery({ queryKey: QUALITY_GOALS_KEY, queryFn: ({ signal }) => fetchQualityGoals(signal) });
  const data = goals.data;
  if (!data) {
    return (
      <Page>
        <Note tone="error" title="Versión HD目标读取Fallido">{goals.error ? errorMessage(goals.error) : 'No disponibleVersión HD目标, Por favorActualizarpágina面Reintentar. '}</Note>
      </Page>
    );
  }
  const items = data.items || [];
  if (!items.length) {
    return (
      <Page>
        <EmptyState shell="plain" icon={RiSparklingLine} title="SinMarcarEn procesoVersión HD目标">
          现ConVersión都ya满足Condición, 或还Sin加入追踪. 
        </EmptyState>
      </Page>
    );
  }
  return (
    <Page>
      {/* Total数取服务端 `total` 而Noesesteunopágina数: `limit` 截断时两者Noesuno数, 
          而esteuno行要回答es"uno共还欠másmenos部".  */}
      <CollectionSummary label="Pendiente de actualización" figure={`${Number(data.total || 0).toLocaleString()}  obra(s)`} flush />
      <ul className="card-grid-cover gap-5">
        {items.map((item) => <GoalCard key={item.id} item={item} {...props} searchResources={setDownload} />)}
      </ul>
      {/* ListaSolo取anterior 200 部; Total数比estemás时说清楚esteunopáginaNoesTodo.  */}
      {Number(data.total || 0) > items.length
        ? <p className="mt-6 text-center text-caption-1-regular text-text-secondary">
            {`Mostraranterior ${items.length.toLocaleString()}  título(s), 共 ${Number(data.total).toLocaleString()}  título(s). `}
          </p>
        : null}
      <CloudDownloadDialog prefill={download} close={() => setDownload(null)} receipt={toast} />
    </Page>
  );
}
