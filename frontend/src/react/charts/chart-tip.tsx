/* Imagen表Pasar el ratón浮层: 柱状, 径向, 雷达y热力Imagen共用esteuno面. 
 *
 * 面, 边线, 阴影, 字阶yuno行排法照 EvilCharts  `ChartTooltipContent`. eseuno容Dispositivo写es
 * `grid` 类,  y antiguo样表卡片Cuadrícula `.grid` 同名: 落到página面arriba, 浮层会被撑成uno排卡片ancho格子, 
 * 行距也变成 24px. Tailwind este边又No生成 `grid`(`../styles.css`), 所以aquí按同uno套类名pesado组, 
 * 容Dispositivo换成 `flex flex-col`, Recharts eseuno侧仍由arriba游 `ChartTooltip` continuar进Imagendentro. 
 * 差异登记En `../evilcharts/ORIGIN.md`.  */
import type { ReactNode } from 'react';
import type { TooltipContentProps } from 'recharts';

import { getPayloadConfigFromPayload, useChart } from '@/registry/ui/recharts-chart';
import { ChartTooltip } from '@/registry/ui/recharts-tooltip';

/** 浮层面. 热力Imagen浮层自己定, 拼Eneste串posterior面.  */
export const TIP_SURFACE =
  'flex min-w-32 flex-col gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl';

/** 浮层en launo行: 色点, esteuno组数叫法, 数.  */
export function TipRow({ swatch, name, value }: { swatch: ReactNode; name: ReactNode; value: number }) {
  return (
    <div className="flex w-full items-center gap-2">
      {swatch}
      <div className="flex flex-1 items-center justify-between gap-4 leading-none">
        <span className="text-muted-foreground">{name}</span>
        <span className="font-mono font-medium tabular-nums text-foreground">{value.toLocaleString()}</span>
      </div>
    </div>
  );
}

export const TIP_SWATCH = 'size-2.5 shrink-0 rounded-xs';

type TipProps = Partial<Pick<TooltipContentProps<number, string>, 'active' | 'payload' | 'label'>> & {
  nameKey?: string; valueKey?: string; hideLabel?: boolean;
};

function TipContent({ active, payload, label, nameKey, valueKey, hideLabel }: TipProps) {
  const { config } = useChart();
  const items = (payload ?? []).filter((item) => item.type !== 'none');
  /* arriba游同款: Sincontenido时Dejauno空占, 浮层Siguiente次出现才No会从Imagenizquierdaarriba角滑过来.  */
  if (!active || !items.length) return <span className="p-4" />;
  const title = hideLabel || typeof label !== 'string' ? null : (config[label]?.label ?? label);
  return (
    <div className={TIP_SURFACE}>
      {title ? <div className="font-medium text-foreground">{title}</div> : null}
      {items.map((item, index) => {
        const row = (item.payload ?? {}) as Record<string, unknown>;
        const named = nameKey ? row[nameKey] : undefined;
        const key = `${named ?? item.name ?? item.dataKey ?? 'value'}`;
        const entry = getPayloadConfigFromPayload(config, item, key);
        const value = valueKey ? row[valueKey] : item.value;
        return (
          <TipRow key={key + index} name={entry?.label ?? item.name} value={Number(value ?? 0)}
            swatch={(
              // oxlint-disable-next-line shadcn/no-inline-styles -- 色点取 ChartStyle 按SerieClave生成 CSS 变量, 变量名随Clave变
              <i className={TIP_SWATCH} style={{ background: `var(--color-${key}-0)` }} />
            )} />
        );
      })}
    </div>
  );
}

/** continuar进 EvilCharts Imagenen la浮层. `nameKey` es径向Imageneseuno段uno名字Datos列; `valueKey` es
 * 画Imagen列经过刻度换算时, 浮层该读Original数eseuno列(雷达Imagen).  */
export function ChartTip(
  { nameKey, valueKey, hideLabel }: { nameKey?: string; valueKey?: string; hideLabel?: boolean },
) {
  return (
    <ChartTooltip cursor={false}
      content={<TipContent nameKey={nameKey} valueKey={valueKey} hideLabel={hideLabel} />} />
  );
}
