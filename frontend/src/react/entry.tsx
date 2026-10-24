/* 主界面interior部常驻组件ConfiguraciónInterfaz, Tipo契约见 `bundle.d.ts`. 
 * página面y常驻组件由 Application 同uno棵路由树画; Toaster Independiente根由应用生命周期Limpiar. 
 * 共享缓存, 减弱动效y弹出层容Dispositivo见 `providers.tsx`.  */
import './styles.css';

export { configureBatchDock } from './batch-dock/batch-dock-island';
export { configureGlowPicker } from './glow-picker/glow-picker-island';
export { configureImmerse } from './immerse/immerse-island';
export { configureManageHeader } from './manage-header/manage-header-island';
export { prefetchManagedRoute } from './router/managed-routes';
export { configureSettingsPanel } from './settings-panel/settings-panel';
export { configureSidebar } from './sidebar/sidebar-island';
export { configureStage } from './stage/stage';
export { mountToaster, showToast } from './toaster';
