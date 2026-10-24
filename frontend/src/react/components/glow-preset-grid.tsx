/* 光晕预设eseuno格: Configuración面板"配色"eseuno组 y 侧栏底部配色卡arribamedioes同uno组色, 同uno写入. 两处都读
 * 同uno store(`@peach/appearance`  `appSettingsStore`), 点哪uno边, 另uno边经 store 通知当场对齐. 
 *
 * 选en procesouno档写什么(光晕, 玻璃面色相, 强调色uno起换)En `appearance/glow.ts`  `chooseGlowPreset`; 
 * aquíSolo画球. "自定义"eseuno格会出现或消失, 按档名做 key, 正落着焦点eseunoes同uno节点, 
 * Clave盘选完uno档焦点No会掉回página面开头. 
 *
 * 样En `./glow-preset-grid.css`.  */
import type { CSSProperties } from 'react';

import { chooseGlowPreset, glowChips, type GlowSettings } from '@peach/appearance';

import type { SettingsStore } from '../../settings-store';
import './glow-preset-grid.css';

export function GlowPresetGrid({ store, label, hidden }: {
  store: SettingsStore<GlowSettings>; label: string; hidden?: boolean;
}) {
  const glow = store.value.homeGlow;
  return (
    <div data-glow-grid="" role="group" aria-label={label} hidden={hidden}>
      {glowChips(glow).map((chip) => (
        <button type="button" key={chip.key} data-glow-chip="" data-glow-preset={chip.key}
          aria-pressed={chip.key === glow.preset} title={chip.label} aria-label={chip.label}
          onClick={() => chooseGlowPreset(chip.key, store)}>
          <span data-glow-ball="" aria-hidden="true" data-glow-native={chip.native ? '' : undefined}
            style={chip.native ? undefined : { '--glow-chip': chip.fill } as CSSProperties} />
        </button>
      ))}
    </div>
  );
}
