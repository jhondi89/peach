/* Biblioteca存径向Imagen: uno段uno圈, 读数跟着指到eseuno段走. 
 *
 * 圈由 EvilCharts  `EvilRadialChart` 画, Color按 `chart-1`...`chart-6` 循环, 满圈es最largoese段
 * 1.1 倍(`radialCeiling`). 段数超过seis时y掉尾部(`radialSlices`), NoComo 0 段至menos画unopequeño截
 * 弧(`radialArc`), 浮层y读数仍esOriginal数. alto亮es React Estado: 指针进出y点选各管uno件事—扫过去esveruno眼, 
 * 点abajo去es钉住. Imagenabajoese排格子es同unoEstado按钮, Clave盘也够得着; arriba游puede点选Imagen例SoloConuno
 * 选en proceso态, 分No出"veruno眼" y "钉住", 所以圈形状y点击走 `radialBarProps` continuar到aquí. 
 * 差异登记En `../evilcharts/ORIGIN.md`.  */
import { useState } from 'react';
import { Sector, type SectorProps } from 'recharts';

import { fmtSize } from '@peach/legacy/core';

import { EvilRadialChart } from '@/registry/charts/recharts-radial-chart';

import { CHART_CARD, ChartEmpty, sliceConfig, sliceKey } from '../charts/chart-card';
import { ChartTip } from '../charts/chart-tip';
import { SourceMark } from '../settings/section';
import { radialArc, radialBarSize, radialCeiling, radialSlices, type RadialSlice } from './stats';

/** seis档Imagen表色循环. 类名写成Completo串, Tailwind 扫得到.  */
const TILE_SWATCH = [
  'bg-chart-1', 'bg-chart-2', 'bg-chart-3',
  'bg-chart-4', 'bg-chart-5', 'bg-chart-6',
];
/* 钉住某uno段时eseuno格换成esteuno段自己Color: antiguo `.board-radial-tiles>button[aria-pressed]`
 * es同色 10% 混底加uno圈 1px 同色interior描边. 换成en proceso性色话, seis格dentro哪uno格被钉住es认No出来.  */
const TILE_PINNED = [
  'aria-pressed:bg-chart-1/10 aria-pressed:ring-chart-1',
  'aria-pressed:bg-chart-2/10 aria-pressed:ring-chart-2',
  'aria-pressed:bg-chart-3/10 aria-pressed:ring-chart-3',
  'aria-pressed:bg-chart-4/10 aria-pressed:ring-chart-4',
  'aria-pressed:bg-chart-5/10 aria-pressed:ring-chart-5',
  'aria-pressed:bg-chart-6/10 aria-pressed:ring-chart-6',
];

export function RadialCard(
  { title, rows, empty, unit = ' video(s)' }: { title: string; rows: RadialSlice[]; empty: string; unit?: string },
) {
  /* 钉住eseuno段 y 指针扫过eseuno段分开记: 扫过去要能回到钉住eseuno段, 合成unoEstado话
     鼠标uno离开就用户点abajoSeleccionar也擦.  */
  const [pinned, setPinned] = useState(-1);
  const [hovered, setHovered] = useState(-1);
  const slices = radialSlices(rows);
  if (!slices.length) return <ChartEmpty title={title}>{empty}</ChartEmpty>;

  const focus = hovered >= 0 ? hovered : pinned;
  const total = slices.reduce((sum, row) => sum + row.value, 0);
  const shown = slices[focus];
  const toggle = (index: number) => setPinned((at) => (at === index ? -1 : index));
  const ceiling = radialCeiling(slices.map((row) => row.value));
  const data = slices.map((row, index) => (
    { slice: sliceKey(index), value: row.value, arc: radialArc(row.value, ceiling) }));

  return (
    <section className={CHART_CARD}>
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <span className="flex min-w-0 flex-col gap-1">
          <h3 className="flex items-center gap-1.5 text-title-2-medium wrap-anywhere text-text-primary">
            {shown?.mark ? <SourceMark mark={shown.mark} /> : null}{shown ? shown.name : title}
          </h3>
          <b className="text-display-4-medium tabular-nums text-text-primary">
            {(shown ? shown.value : total).toLocaleString()}
          </b>
        </span>
        <small className="text-caption-1-regular text-text-secondary">{unit}</small>
      </header>
      <div role="img" aria-label={title} onPointerLeave={() => setHovered(-1)}>
        <EvilRadialChart data={data} nameKey="slice" config={sliceConfig(slices.map((row) => row.name))}
          max={ceiling} innerRadius="22%"
          className="aspect-auto h-75 max-sm:h-65">
          <EvilRadialChart.RadialBar dataKey="arc" barSize={radialBarSize(slices.length)} radialBarProps={{
            shape: (props: SectorProps & { index?: number }) => (
              <Sector {...props}
                opacity={focus >= 0 && focus !== props.index ? 0.3 : 1}
                className="cursor-pointer transition-opacity duration-200" />
            ),
            onClick: (_entry: unknown, index: number) => toggle(index),
            onMouseEnter: (_entry: unknown, index: number) => setHovered(index),
          }} />
          <ChartTip nameKey="slice" valueKey="value" hideLabel />
        </EvilRadialChart>
      </div>
      <div className="inline-grid w-full grid-cols-3 gap-2 max-sm:grid-cols-2">
        {slices.map((row, index) => (
          <button key={sliceKey(index)} type="button" aria-pressed={pinned === index}
            onClick={() => toggle(index)}
            onPointerEnter={() => setHovered(index)} onPointerLeave={() => setHovered(-1)}
            onFocus={() => setHovered(index)} onBlur={() => setHovered(-1)}
            className={`flex min-w-0 cursor-pointer flex-col items-start gap-1 rounded-xl bg-background-tertiary-default p-2.5 text-left outline-none aria-pressed:ring-1 aria-pressed:ring-inset focus-visible:ring-2 focus-visible:ring-border-focus-ring ${TILE_PINNED[index % 6]}`}>
            {/* 名字折成几行时色跟No.uno行对齐, No悬En几行en proceso间.  */}
            <span className="flex min-w-0 max-w-full items-start gap-1.5 text-caption-1-regular text-text-secondary">
              <i aria-hidden className={`mt-0.5 size-3 shrink-0 rounded-sm ${TILE_SWATCH[index % 6]}`} />
              <span className="inline-flex min-w-0 items-start gap-1.5 wrap-anywhere">
                {row.mark ? <SourceMark mark={row.mark} /> : null}{row.name}
              </span>
            </span>
            <b className="text-title-2-medium tabular-nums text-text-primary">{row.value.toLocaleString()}</b>
            {row.bytes != null ? <small className="text-caption-1-regular text-text-secondary">{fmtSize(row.bytes)}</small> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
