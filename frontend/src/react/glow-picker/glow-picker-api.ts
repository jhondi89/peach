/* 侧栏配色卡(常驻组件 `glow-picker`, `glow-picker-island.tsx`)y壳之间continuar缝. 
 *
 * 卡exterior壳(`#boardGlowMenu`: popover, 玻璃材质, 锚定y开合)由壳建, 由壳 `wireAnchoredMenu` 管; 
 * 路由树Solo往dentro画contenido. 读写es壳eseuno界面偏bien store, 钮arribaese两pequeño圆yConfiguración面板都订阅同uno.  */
import type { GlowSettings } from '@peach/appearance';

import type { SettingsStore } from '../../settings-store';

export interface GlowPickerHost {
  /** 卡本身, 也就es常驻组件宿主: 路由树contenido直continuar画成它子节点.  */
  root: HTMLElement;
  store: SettingsStore<GlowSettings>;
  /** "详细Configuración": 收起este卡, 开Configuración面板"界面"eseunopáginay滚到光晕Parámetro.  */
  openDetails(): void;
}
