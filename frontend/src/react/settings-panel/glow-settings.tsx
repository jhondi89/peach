/* 侧栏光晕详细Configuración, 照 feralui.dev/gradients 工作面板来: Parámetro行es"84px Etiqueta + 自绘拉 +
 * derecha侧etc.ancho读数", Color行点开En自己abajo方弹uno色板. 
 * 取证见 docs/reference-snapshots/feralui-studio-boardui-accent-measured.md. 
 *
 * 预设色Enesteuno屏 y 侧栏底部ese配色卡arribaes同uno组色, 同uno写入(`GlowPresetGrid`), 两处读都es
 * 壳eseuno store, 点哪uno边另uno边当场对齐. 当anterior档名, 预设色 y cincoParámetro同属"配色"esteuno组. 
 *
 * "玻璃Original色"eseuno档Sintres光晕: eseuno层Completo算作 0, 面arriba漂es每玻璃自带两团反光. 强度, 
 * 粒, 柔化, Tamaño y tresColor于esTodo都管No着任何东西, esteuno档它们收起来, 换uno句DescripciónColor由明暗
 * Tema给. 漂移Velocidad度No收—自带ese两团也En漂. "RestaurarPredeterminado"同样No收, 任何uno档abajo都要能uno步回到出厂eseuno套.  */
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

import { closeAnchoredMenu, wireAnchoredMenu } from '@peach/legacy/ui';
import {
  GLOW_SPOT_LABELS, GLOW_SWATCH_FAMILIES, GLOW_SWATCHES, HOME_GLOW_SPOTS, glowColor, glowPresetName, isNativeGlass,
  normalizeHomeGlow, type HomeGlow,
} from '@peach/appearance';

import { GlowPresetGrid } from '../components/glow-preset-grid';
import type { SettingsPanelHost } from './settings-panel-api';
import { Icon } from './icon';
import { DialRow } from './legacy-controls';

type Field = 'strength' | 'noise' | 'speed' | 'soften' | 'size';
type Spot = 'spot1' | 'spot2' | 'spot3';

const FIELDS: readonly [Field, string, number][] = [
  ['strength', 'Intensidad', 100], ['noise', 'Grano', 60], ['speed', '漂移Velocidad', 300], ['soften', 'Suavizar', 100], ['size', 'Tamaño', 100],
];


function StopRow({ host, spot, index, glow }: { host: SettingsPanelHost; spot: Spot; index: number; glow: HomeGlow }) {
  const label = GLOW_SPOT_LABELS[index];
  const row = useRef<HTMLDivElement | null>(null);
  const toggle = useRef<HTMLButtonElement | null>(null);
  const pop = useRef<HTMLDivElement | null>(null);
  const [family, setFamily] = useState('all');
  /* 弹层izquierdaderecha贴齐esteuno行: ancho度No跟着行走话, uno比行estrecho色板verNo出es从哪uno行开出来. 
     este要排En wireAnchoredMenu 之anterior, 它按当anteriorancho度算izquierda缘.  */
  useLayoutEffect(() => {
    const [mount, button, menu] = [row.current, toggle.current, pop.current];
    if (!mount || !button || !menu) return;
    button.addEventListener('click', () => { menu.style.width = `${mount.getBoundingClientRect().width}px` });
    wireAnchoredMenu(mount, button, menu);
  }, []);
  const color = glow[spot].color;
  const pick = (hex: string) => {
    const current = host.store.value.homeGlow;
    current[spot].color = glowColor(hex, current[spot].color);
    current.preset = 'custom';
    host.store.save();
    host.changed('glow');
    closeAnchoredMenu();
    toggle.current?.focus();
  };
  return (
    <div data-glow-stop={spot} ref={row}>
      <button type="button" data-glow-stop-toggle="" aria-haspopup="dialog" aria-expanded="false" ref={toggle}>
        <span aria-hidden="true" data-glow-stop-dot="" style={{ '--glow-swatch': color } as CSSProperties} />
        <span data-glow-stop-text=""><b>{label}</b><small className="mono" data-glow-stop-hex="">{color}</small></span>
        <Icon name="chevron-down" />
      </button>
      <div className="popmenu" data-glow-stop-pop="" popover="manual" hidden ref={pop}>
        <div data-glow-pills="" role="group" aria-label="Paleta de colores">
          {GLOW_SWATCH_FAMILIES.map(([key, name]) => (
            <button type="button" key={key} data-glow-pill={key} aria-pressed={key === family}
              onClick={() => setFamily(key)}>{name}</button>
          ))}
        </div>
        <div data-glow-palette="" role="radiogroup" aria-label={`${label}Color`}>
          {GLOW_SWATCHES.map(([swatchFamily, name, hex]) => (
            <button type="button" key={hex} role="radio" aria-checked={hex === color} data-glow-swatch={hex}
              data-glow-family={swatchFamily} style={{ '--glow-swatch': hex } as CSSProperties}
              title={name} aria-label={name} hidden={family !== 'all' && swatchFamily !== family}
              onClick={() => pick(hex)} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function GlowSettings({ host }: { host: SettingsPanelHost }) {
  const glow = host.store.value.homeGlow;
  const native = isNativeGlass(glow.preset);
  return (
    <section data-glow-setting="" id="homeGlowControls" aria-label="Parámetros de resplandor de barra lateral" hidden={!glow.on}>
      <section data-glow-group=""><h4>Esquema de color</h4>
        <p data-glow-current="">ActualEsquema de color<b data-glow-preset-name="">{glowPresetName(glow.preset)}</b></p>
        <GlowPresetGrid store={host.store} label="Colores de resplandor" />
        <p data-glow-native-note="" hidden={!native}>esteuno档用每玻璃自带反光, Color跟着明暗Tema走. </p>
        <div data-glow-fields="">
          {/* 拖动en procesoSolo改Parámetro, Solo排uno帧pesado画; 落盘Deja给松手eseunoabajo. 其余玻璃面跟着走SoloConVelocidad度, 
              而它ese两变量Solo能写En根arriba, 所以拖动期间SoloCon侧栏eseuno层En变, 松手才铺到Completopágina.  */}
          {FIELDS.map(([field, label, max]) => (
            <DialRow key={field} field={field} label={label} max={max} value={glow[field]} hidden={native && field !== 'speed'}
              onStep={(value) => { host.store.value.homeGlow[field] = value; host.changed('glowFrame') }}
              onSettle={() => { host.store.save(); if (field === 'speed') host.changed('glow') }} />
          ))}
        </div>
      </section>
      <section data-glow-group="" data-glow-colours="" hidden={native}><h4>Color</h4>
        <div data-glow-stops="">
          {HOME_GLOW_SPOTS.map((spot, index) => <StopRow key={spot} host={host} spot={spot as Spot} index={index} glow={glow} />)}
        </div>
      </section>
      <div data-glow-actions="">
        <button type="button" className="geist-button" data-glow-reset=""
          onClick={() => { host.store.value.homeGlow = normalizeHomeGlow(null); host.store.save(); host.changed('glow') }}>Restaurar predeterminado</button>
      </div>
    </section>
  );
}
