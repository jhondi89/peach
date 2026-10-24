/* Todo站唯uno TanStack Query Cliente(ADR-0031). 
 * @peach/query 直continuar解析到共享源码, Application  fetchQuery, página面 prefetch y Providers 使用同uno实例. 
 * primero屏预取y组件读取同uno缓存, 避免挂载posteriorRepetirPor favor求或写入SoloActualizar部分读者.  */
import { QueryClient } from '@tanstack/query-core';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /* Por favor求都打本机 `/api/...`. Explorar dispositivo online Etiqueta说esexterior网, 断exterior网它就翻 false, 
         Query Predeterminado会本机Por favor求也挂起成 paused—página面于es停EnantiguoDatosarriba, 什么都No说.  */
      networkMode: 'always',
      /* NoReintentar. FalloOriginal因es服务没起, DatosBibliotecaSolo读或者迁移还没跑, 同uno秒dentro再问tres遍得到es
         同uno句话, Solo它推迟几秒显示; 真正Reintentarespágina面自己轮询, Siguiente轮就到.  */
      retry: 0,
      /* 焦点回来No自动pesado取: 需要NuevoDatospágina面自己按contenido定轮询节律(活动páginaes 2 秒/10 秒), 
         再加uno焦点触发就es同unoDatos两节律. 对exterior来源Recolectary追更uno律显触发, 
         更No能因Como切回Etiquetapágina就发出去. 要即时Actualizarpágina面自己En `useQuery` dentroAbrir.  */
      refetchOnWindowFocus: false,
      /* 挂载Nopesado取, 错也NoReintentar: 每次进página面都es路由元素先 `prefetch` 再挂载(`history/managed.ts` página面Abrir契约), 组件挂arriba去时缓存dentroeseuno就es刚取回来. Predeterminado值会En同uno次进入dentro
         紧continuar着再发uno遍同样Por favor求; Falloese次还会再Fallouno遍, Error反而晚uno来回才显示.  */
      refetchOnMount: false,
      retryOnMount: false,
    },
  },
});
