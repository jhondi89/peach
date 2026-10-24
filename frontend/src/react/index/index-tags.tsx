/* Etiquetapáginatres: Filtrar浮层, 正文(字母表或Etiqueta云), 所选Etiqueta操作. 
 *
 * 两套词表共用estetres, 区别EnColor y 去处: 本地es ledger en laen proceso文Etiqueta, 按 ledger nueve类着色, 
 * 点开回Directorio按它Filtrar, SeleccionarModoabajo拼成másEtiquetaFiltrar; En线es关注来源en la booru Etiqueta, 按arriba游
 * tag_type 着色, 点开去"关注 · esteEtiqueta", y且No进más选—más选拼esDirectorioFiltrar, 拿En线Etiqueta
 * 去筛Directorio必然unoNoen proceso.  */
import { Radio, RadioGroup } from 'react-aria-components';

import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';

import { TabCount } from '../components/board-tabs';
import { cardClass } from '../components/card';
import { FilterGlassRows, FilterPill } from '../components/filter-glass';
import { SEGMENTED_GLASS_TRACK, SEGMENT_GLASS } from '../components/segmented';
import { SelectionDock } from '../components/selection-dock';
import { spriteGlyph } from '../components/sprite-glyph';
import { useHorizontalScroller } from '../components/use-horizontal-scroller';
import { FavoriteButton } from '../library-shortcuts/shortcut-controls';
import { tagColorKey, type IndexTag, type TagView } from './index-data';

export interface TagEntry extends IndexTag {
  label: string;
}

/** unoEtiqueta交互: SeleccionarModoabajoCambiar选en proceso, 否则直continuarAbrir.  */
export interface TagActions {
  online: boolean;
  picked: ReadonlySet<string>;
  press(tag: string): void;
}

const Dot = () => <span aria-hidden data-tag-dot="" className="size-1.75 flex-none rounded-full" />;

/* uno行unoEtiqueta: 36px alto, 8px 圆角, 取es Board 排名行eseuno档身量. nowrap es省略号anterior提, 
   menos它largoEtiqueta改成折行, 同uno行en la其它Etiqueta跟着被拉alto, 几列各行alto度也对No齐.  */
function AlphaTag({ tag, actions }: { tag: TagEntry; actions: TagActions }) {
  const pressed = actions.picked.has(tag.k);
  return (
    <div className="flex min-w-0 items-center gap-1">
    <button type="button" data-alpha-tag="" data-k={tag.k} data-tag-cat={tagColorKey(actions.online, tag.cat)}
      aria-pressed={pressed} title={tag.label} onClick={() => actions.press(tag.k)}
      className="flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-2.25 rounded-lg px-2.5 text-left text-body-regular text-text-secondary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring">
      <Dot />
      <span className="min-w-0 flex-1 truncate">{tag.label}</span>
      <span className="flex-none text-caption-1-regular text-text-secondary">{tag.n.toLocaleString()}</span>
    </button>
    {!actions.online ? <FavoriteButton item={{ kind: 'tag', name: tag.k, entity_id: tag.entity_id, favorite: tag.favorite }} /> : null}
    </div>
  );
}

/** 字母表: 每primero字uno卡, 字头es卡Título, derecha边挂esteuno组Con几. `data-alpha-group` es浮层
 *  abajo排ese排Saltar aClave落点, 卡顶给吸顶浮层让出Ubicación.  */
export function TagAlphabet({ groups, actions }: { groups: [string, TagEntry[]][]; actions: TagActions }) {
  return (
    <div data-alphabet="" className="flex flex-col gap-4">
      {groups.map(([letter, tags], at) => (
        <section key={letter} data-alpha-group={at}
          className={cardClass({ radius: 'plain', padding: 'none', className: 'px-5 pt-4 pb-3' })}>
          <h3 className="mb-2 flex items-center text-title-2-medium text-text-primary">
            {letter}<TabCount value={tags.length} />
          </h3>
          <div className="index-tag-list gap-x-4 gap-y-0.5">
            {tags.map((tag) => <AlphaTag key={tag.k} tag={tag} actions={actions} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

const NBSP = String.fromCharCode(0xa0);

/** Etiqueta云: esteunopágina它们es主体, Noes附注, 所以比卡片en laEtiquetagrandeuno档. 名字y计数之间隔uno
 *  No断行空格, ancho度es名字eseuno档Tamaño de fuenteabajouno空格(13px 时约 3.7px); flex 会吞掉普通空格, 
 *  所以用No断行eseuno.  */
export function TagCloud({ tags, actions }: { tags: TagEntry[]; actions: TagActions }) {
  return (
    <div data-tag-cloud="" className="flex flex-wrap gap-1.75">
      {tags.map((tag) => (
        <span key={tag.k} className="inline-flex min-w-0 items-center gap-1">
        <button type="button" data-tag-chip="" data-k={tag.k}
          data-tag-cat={tagColorKey(actions.online, tag.cat)} aria-pressed={actions.picked.has(tag.k)}
          onClick={() => actions.press(tag.k)}
          className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.25 text-body-2-regular text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring">
          {tag.label + NBSP}
          <span data-tag-n="" className="text-caption-1-regular opacity-60">{tag.n.toLocaleString()}</span>
        </button>
        {!actions.online ? <FavoriteButton item={{ kind: 'tag', name: tag.k, entity_id: tag.entity_id, favorite: tag.favorite }} /> : null}
        </span>
      ))}
    </div>
  );
}

const VIEWS: readonly (readonly [TagView, string, string])[] = [
  ['cloud', 'Nube de etiquetas', 'tags'], ['alphabet', 'Alfabeto', 'text-aa'],
];

/** Filtrar浮层: arriba排Tipo药丸, abajo排读数, 按primero字Saltar ay视ImagenCambiar. Solo摆数得到ese几类.  */
export function TagFilters(
  { categories, category, online, readout, letters, view, onCategory, onJump, onView }: {
    categories: readonly (readonly [string, string])[];
    category: string;
    online: boolean;
    readout: string;
    letters: string[];
    view: TagView;
    onCategory(key: string): void;
    onJump(at: number): void;
    onView(view: TagView): void;
  },
) {
  const alphaScroll = useHorizontalScroller<HTMLElement>();
  return (
    <FilterGlassRows label="EtiquetaFiltrar" topLabel="Tipo de etiqueta"
      top={categories.map(([key, label]) => (
        <FilterPill key={key} data-tag-pill="" data-tag-cat={key === 'all' ? 'all' : tagColorKey(online, key)}
          pressed={category === key} onPress={() => onCategory(key)}>
          <Dot />{label}
        </FilterPill>
      ))}
      bottom={<>
        <span data-index-readout="" className="flex-none text-caption-1-regular leading-5 whitespace-nowrap text-text-secondary tabular-nums">
          {readout}
        </span>
        {letters.length > 1 ? (
          <nav ref={alphaScroll} aria-label="Saltar por inicial" data-alpha-jump=""
            className="flex min-w-0 gap-0.5 overflow-x-auto overscroll-x-contain">
            {letters.map((letter, at) => (
              <button key={letter} type="button" onClick={() => onJump(at)}
                className="h-7.5 min-w-7.5 flex-none cursor-pointer rounded-glass-key px-1.5 text-caption-1-regular leading-5 text-(--glass-text)/60 outline-none hover:text-(--glass-text) focus-visible:ring-2 focus-visible:ring-border-focus-ring">
                {letter}
              </button>
            ))}
          </nav>
        ) : null}
        <RadioGroup aria-label="Vista de etiquetas" orientation="horizontal" value={view}
          onChange={(next) => onView(next as TagView)} className={`ml-auto ${SEGMENTED_GLASS_TRACK}`}>
          {VIEWS.map(([value, label, symbol]) => {
            const Glyph = spriteGlyph(symbol);
            return (
              <Radio key={value} value={value} aria-label={label} data-glass-segment="" className={SEGMENT_GLASS}>
                <span title={label} className="contents"><Glyph className="size-4" /></span>
              </Radio>
            );
          })}
        </RadioGroup>
      </>}
    />
  );
}

/** 所选Etiqueta操作. tresClave都Solo动esteuno屏: "广泛匹配"切es回Directorio时按任uno还esTodo匹配, 
 *  "清空"Solo清本地所选, "显示Resultado"回Directorio按所选EtiquetaFiltrar—Sinuno写DatosBiblioteca.  */
export function TagDock(
  { count, match, onMatch, onClear, onApply }:
  { count: number; match: 'any' | 'all'; onMatch(match: 'any' | 'all'): void; onClear(): void; onApply(): void },
) {
  return (
    <SelectionDock visible={count > 0} label="所选EtiquetaAcción" count={`Ya选 ${count.toLocaleString()} Etiqueta`}>
      <Checkbox isSelected={match === 'any'} onChange={(on) => onMatch(on ? 'any' : 'all')}>
        <span className="flex flex-col">
          <span className="text-body-medium">Coincidencia amplia</span>
          <span className="text-caption-1-regular text-text-secondary">Activarposterior匹配任uno所选Etiqueta; Desactivarposterior必须同时ContieneTodoEtiqueta. </span>
        </span>
      </Checkbox>
      <Button variant="secondary" size="small" onClick={onClear}>Limpiar</Button>
      <Button variant="primary" size="small" disabled={!count} onClick={onApply}>MostrarResultado</Button>
    </SelectionDock>
  );
}
