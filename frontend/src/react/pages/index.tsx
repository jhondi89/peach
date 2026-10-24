/* Independientepágina面包构建入口(`web/dist/peach-pages.js`). 
 *
 * primero启, Iniciar sesiónyErrortrespágina共用服务端给同unoHTML 模板, 壳dentroSoloConuno挂载点 `#peach-page`: `data-page` 说es
 * 哪unopágina, 其余 `data-*` es服务端才知道变量, Original样交给eseunopágina. este产物No依赖主界面任何模: 
 * NoCargar主包, No带 Query 缓存, 共用Controles(折叠, 来源站标)由 `vite.pages.config.ts`
 * 直continuar打进来. trespágina都用Explorar dispositivoOriginal生滚动. 弹出层落En body arriba, body 本身就es `.peach-react` 容Dispositivo. 
 *
 * este包No要会话就能取(ADR-0094): No得 import 别产物, No得interior嵌DatosBiblioteca, Configuración或Credenciales派生Datos.  */
import './pages.css';
import { installErrorReporting } from '../../error-reporting';

import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

import { ErrorPage } from './error/error-page';
import { LoginPage } from './login/login-page';
import type { PageData } from './page-data';
import { SetupPage } from './setup/setup-page';

const PAGES: Readonly<Record<string, ComponentType<{ data: PageData }>>> = {
  setup: SetupPage,
  login: LoginPage,
  error: ErrorPage,
};

installErrorReporting();
const mount = document.getElementById('peach-page');
const Page = mount ? PAGES[mount.dataset.page ?? ''] : undefined;
if (mount && Page) createRoot(mount).render(<Page data={{ ...mount.dataset }} />);
