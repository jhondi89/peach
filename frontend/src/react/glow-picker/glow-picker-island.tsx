/* 侧栏配色卡: 侧栏底部ese配色钮点开ese卡, 照 boardui.com derechaabajo角ese"Accent color". 
 *
 * 头部uno行Título加"Restablecer"文字Clave, 主体es两组 6 列圆球—arriba面uno组光晕(yConfiguración面板"配色"同uno组, 
 * `GlowPresetGrid`), abajo面uno组强调色(BoardUI 自己ese radial-gradient 球), 底部unoTodoancho主按钮
 * 通到详细Configuración. 实测见 docs/reference-snapshots/feralui-studio-boardui-accent-measured.md. 
 *
 * 常驻组件 `glow-picker`(`router/managed-routes.tsx` 常驻表): 路由树contenido直continuar画成壳常驻En body último尾
 * `#boardGlowMenu` 子节点, 宿主就es卡本身, 壳启动时Abrir. 卡Sin命令句柄, 读写es壳eseuno界面偏bien
 * store. 锚定, 开合, 玻璃材质y y 媒体Biblioteca菜单互斥都En壳 `wireAnchoredMenu` dentro, 卡No换成 BoardUI
 * Popover: eseuno套动效y材质要En Popover exterior面再复刻uno遍才对得arriba像素, 复刻出来就esNo.dos. 
 *
 * 光晕关掉之posterior卡arribaSolo剩强调色puede挑: arriba面eseuno组球 y 它"Restablecer"换esuno层现EnNo画东西, 点abajo去
 * 屏幕arribaSin任何反应, Completo组收起来, 卡就Solo说当anterior还管用eseuno件事.  */
import { useSyncExternalStore } from 'react';

import { ACCENT_CHOICES, chooseAccent, resetGlowColors } from '@peach/appearance';

import { GlowPresetGrid } from '../components/glow-preset-grid';
import type { GlowPickerHost } from './glow-picker-api';
import './glow-picker.css';

let host: GlowPickerHost | null = null;

/** continuararriba壳给宿主. Solo调uno次; 壳 `loadGlowPicker` continuar着En路由树dentroAbriresteuno面.  */
export function configureGlowPicker(next: GlowPickerHost): void {
  host = next;
}

/** 常驻表en laeseuno面: 宿主还没continuararriba时No画.  */
export function GlowPickerSurface() {
  return host ? <GlowPicker host={host} /> : null;
}

function GlowPicker({ host: at }: { host: GlowPickerHost }) {
  const { store } = at;
  useSyncExternalStore(store.subscribe, store.version);
  const { homeGlow: glow, accent } = store.value;
  return (
    <>
      <header data-glow-head="" data-glow-presets="" hidden={!glow.on}>
        <span>Resplandor</span>
        {/* aquíRestableceres配色, NoesCompleto光晕: 强度 y 粒uno起清掉会让人以Como按错Clave. CompletoRestaurarPredeterminadoEn详细Configuracióneseuno屏.  */}
        <button type="button" data-glow-preset-reset="" onClick={() => resetGlowColors(store)}>Restablecer</button>
      </header>
      <GlowPresetGrid store={store} label="Resplandor" hidden={!glow.on} />
      <p data-glow-head="" data-glow-sub=""><span>Color de énfasis</span></p>
      <div data-accent-grid="" role="group" aria-label="Color de énfasis">
        {/* 强调色eseuno排同样No带Color: 球拿就esesteuno档真会写arriba去 400 y 600 两级.  */}
        {ACCENT_CHOICES.map(([key, label]) => (
          <button type="button" key={key} data-glow-chip="" data-accent={key} aria-pressed={key === accent}
            title={label} aria-label={label} onClick={() => chooseAccent(key, store)}>
            <span data-glow-ball="" aria-hidden="true" data-accent-ball={key} />
          </button>
        ))}
      </div>
      <footer><button type="button" className="geist-button primary" data-glow-detail="" onClick={() => at.openDetails()}>DetalladoConfiguración</button></footer>
    </>
  );
}
