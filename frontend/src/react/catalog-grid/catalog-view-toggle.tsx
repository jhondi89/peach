import { Radio, RadioGroup } from 'react-aria-components';
import { RiLayoutGridLine, RiListUnordered } from '@remixicon/react';
import { SEGMENTED_GLASS_TRACK, SEGMENT_GLASS } from '../components/segmented';
import { setCatalogView, useCatalogView } from './catalog-view';

export function CatalogViewToggle() {
  const view = useCatalogView();
  return <RadioGroup aria-label="Forma de mostrar la colección" orientation="horizontal" value={view} onChange={setCatalogView}
    data-entity-layout="" className={SEGMENTED_GLASS_TRACK}>
    <Radio value="cards" aria-label="Tarjetas" className={SEGMENT_GLASS} data-glass-segment="">
      <span title="Tarjetas" className="pointer-events-none contents"><RiLayoutGridLine aria-hidden="true" className="size-4" /></span>
    </Radio>
    <Radio value="list" aria-label="Lista" className={SEGMENT_GLASS} data-glass-segment="">
      <span title="Lista" className="pointer-events-none contents"><RiListUnordered aria-hidden="true" className="size-4" /></span>
    </Radio>
  </RadioGroup>;
}
