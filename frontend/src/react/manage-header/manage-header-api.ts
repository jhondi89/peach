/* Gestionar区página头(常驻组件 `manage-header`, `manage-header-island.tsx`)对壳契约. 
 *
 * 它画esGestionar区正文arriba面eseuno: Gestionar(uno排abajo划线página签), DatosGestionar子página面包屑, página面Título, 以及
 * 回收站Descripción行(读数y"清空回收站"). 当anteriorEn哪Gestionar区, 菜单列哪几项, 回收站读数由壳推进来
 * (`ManageHeaderProps`, 定义y判据En `src/manage-header.ts`, 壳启动骨架也用它). 
 *
 * 换página, Confirmar弹层y写Interfaz仍归壳: 点abajo去回到 `openManage`, `openDataCleanup` y清空回收站ese流程. 
 * página面Título逐行揭示也由壳En每次Push之posterior做(换página才放uno遍), 骨架阶段y路由树continuar手之posteriores同uno处.  */
import type { ManageHeaderProps } from '../../manage-header';

export type { ManageEntry, ManageHeaderProps, TrashCount } from '../../manage-header';

export interface ManageHeaderHost {
  /** 岛画进去eseuno层(`[data-manage-header]`, 本身 `display: contents`).  */
  root: HTMLElement;
  /** Gestionaren launo项.  */
  openManage(section: string): void;
  /** 面包屑Anterior级. 带修饰Clave或en procesoClave点击No经aquí, 照链continuar自己 href 走(NuevoEtiquetapágina, derechaClave菜单).  */
  openDataCleanup(): void;
  /** 回收站Descripción行derecha端eseClave: Confirmar弹层, 写Interfazy回执都En壳dentro, Confirmar之posteriorCompletopágina读数pesado取.  */
  emptyTrash(): void;
}

export interface ManageHeaderApi {
  render(props: ManageHeaderProps): void;
}
