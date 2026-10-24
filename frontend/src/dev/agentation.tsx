/* 界面标注工具 Agentation 挂载入口, Solo由 `vite.agentation.config.ts` 构建. 
 *
 * 产物落En `build/agentation/`, No进 Git 也No进Independiente包; Application En本机开关Abrir时才
 * `import('/dev/agentation.js')`. 它自带uno React, 挂En `<body>` último尾自己根arriba, 
 *  y página面en la React 子树互No相干. 用法见 docs/FRONTEND.md"界面标注".  */
import { Agentation } from 'agentation';
import { createRoot } from 'react-dom/client';

import { identifyAgentationFields } from './agentation-fields';

/** 本机 `agentation-mcp`  HTTP Puerto. 服务没起时标注照样存EnExplorar dispositivodentro, 起来posterior自动补传.  */
const ENDPOINT = 'http://localhost:4747';

const host = document.createElement('div');
host.dataset.agentation = '';
identifyAgentationFields(host);
document.body.append(host);
// Peach 自己占着Todo局rápido捷Clave(Esc 收起面板, 方向Clave翻Imagen), 标注工具Solo走工具栏按钮. 
createRoot(host).render(
  <Agentation appName="Peach" endpoint={ENDPOINT} portalContainer={host} enableKeyboardShortcuts={false} />,
);
