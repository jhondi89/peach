/* Imagen表卡exterior壳, página头y EvilCharts 配色, Estadísticaspáginay口味página共用. 
 *
 * Imagen表卡比读数卡grandeuno档圆角: antiguo `.board-radial-card`/`.board-heat-card`/`.board-sankey-card`
 * 都es 20px. página头es两列: Título压着grande数Enizquierda, ese句注解贴derechaabajo角对齐grande数基线, 注解largocortoNouno
 * 也No会Título挤走.  */
import type { ReactNode } from 'react';
import { Text } from 'recharts';

import type { ChartConfig } from '@/registry/ui/recharts-chart';

import { cardClass } from '../components/card';

export const CHART_CARD = `${cardClass({ radius: 'chart' })} flex flex-col gap-4 max-sm:p-4`;

/** unoSinpuede画DatosImagen: Título照antiguo, ImagenUbicación换成uno句Descripción. Estadísticaspáginay口味páginaImagen共用.  */
export function ChartEmpty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={CHART_CARD} aria-label={title}>
      <h3 className="text-title-2-medium text-text-primary">{title}</h3>
      <p className="text-body-2-regular text-text-secondary">{children}</p>
    </section>
  );
}

/** 量No字ancho时(Sin canvas)uno字形按másancho估, 宁ancho勿estrecho: en proceso日文, Todo角符号y emoji 按 13 算, 其余按 7 算.  */
const glyphWidth = (glyph: string) => ((glyph.codePointAt(0) ?? 0) > 0x2e7f ? 13 : 7);

const graphemes = (text: string): string[] =>
  [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((part) => part.segment);

/** 坐标轴文字(12px, página面Fuente de letra)量尺, No.uno次用到时建. 取No到 2D 画布就es `null`.  */
let ruler: CanvasRenderingContext2D | null | undefined;
function measureText(text: string): number | null {
  if (ruler === undefined) {
    try {
      ruler = document.createElement('canvas').getContext('2d');
      if (ruler) ruler.font = `12px ${getComputedStyle(document.body).fontFamily || 'sans-serif'}`;
    } catch {
      ruler = null;
    }
  }
  return ruler ? ruler.measureText(text).width : null;
}

/** uno段坐标轴文字ancho度(像素): Explorar dispositivodentro实量, 量No就按字形估.  */
export const labelWidth = (text: string): number =>
  measureText(text) ?? graphemes(text).reduce((sum, glyph) => sum + glyphWidth(glyph), 0);

/** unoCategoría名截到 `room` 像素以interior, 截掉部分换成省略号; 放得abajo就Original样返回.  */
export function fitLabel(text: string, room: number): string {
  if (labelWidth(text) <= room) return text;
  const glyphs = graphemes(text);
  let kept = 0;
  while (kept < glyphs.length && labelWidth(`${glyphs.slice(0, kept + 1).join('')}...`) <= room) kept += 1;
  return `${glyphs.slice(0, kept).join('')}...`;
}

/** 横向柱状ImagenCategoría轴ancho度: 跟着最largo名字走, peroNo超过 `cap`, 柱子No被名字挤没.  */
export const categoryAxisWidth = (names: string[], cap = 104): number =>
  Math.min(cap, Math.max(24, ...names.map(labelWidth)) + 12);

/** Categoría轴en launo名字. Recharts 刻度坐标, 轴anchoypuede见刻度数交进来: 竖柱按每根柱分到
 *  ancho度截断, 横按轴ancho截断. Todo名En `<title>` dentro, Pasar el ratón浮层读也esTodo名.  */
export function CategoryTick(
  props: {
    along: 'x' | 'y'; payload?: { value?: unknown }; width?: number; visibleTicksCount?: number;
  } & Record<string, unknown>,
) {
  const { along, payload, width = 0, visibleTicksCount = 1, ...rest } = props;
  const name = String(payload?.value ?? '');
  // 竖柱名字Enuno根柱分到eseuno格dentro居en proceso, izquierdaderecha各Deja 1px; 横名字y之间隔着 8px  tickMargin. 
  const room = along === 'x' ? width / Math.max(1, visibleTicksCount) - 2 : width - 8;
  return (
    <g>
      <title>{name}</title>
      <Text {...(rest as object)}>{fitLabel(name, room)}</Text>
    </g>
  );
}

/** unoImagen头: unoTítulo, unogrande数, uno句它此刻指es什么.  */
export function ChartHead({ title, figure, note }: { title: string; figure: string; note: string }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <span className="flex min-w-0 flex-col gap-1">
        <h3 className="text-title-2-medium text-text-primary">{title}</h3>
        <b className="text-display-4-medium tabular-nums text-text-primary">{figure}</b>
      </span>
      <small className="min-w-0 text-caption-1-regular break-words text-text-secondary">{note}</small>
    </header>
  );
}

/** BoardUI seis档Imagen表色, `ChartConfig` dentroSolo写este几变量, profundosuperficial两档跟着 token 走.  */
export const CHART_COLORS = [
  'var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)',
  'var(--color-chart-4)', 'var(--color-chart-5)', 'var(--color-chart-6)',
] as const;

/** unoColor EvilCharts 配色.  */
export const tone = (color: string): ChartConfig[string]['colors'] => ({ light: [color] });

/** CategoríaImagen(径向, 每段uno色)Clave. 
 *
 * EvilCharts 拿Clave拼 CSS 变量名 y  SVG 渐变 id, 媒体Biblioteca名, 来源名en la空格yen proceso文进No标识符, 
 * 所以Claveuno律es `s0`, `s1`..., 显示名字放En `label` dentro.  */
export const sliceKey = (index: number) => `s${index}`;

export function sliceConfig(names: string[]): ChartConfig {
  return Object.fromEntries(names.map((label, index) => [
    sliceKey(index), { label, colors: tone(CHART_COLORS[index % CHART_COLORS.length]!) },
  ]));
}
