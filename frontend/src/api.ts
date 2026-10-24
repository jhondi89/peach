/* island 层唯uno取数入口. 
 *
 *  y 遗Deja层用 `api()`(`src/core/index.ts`)保持同uno套Fallo语义(先读 JSON, 再按
 * `message`/`detail`/`error` 取人能verOriginal因), peromás两件事: 返回Tipo由调用方声明, 
 * Por favor求带 `AbortSignal`. No.dos件es island 必需—página面En取数途en proceso被换掉时, 
 * 迟到RespuestaNo能再往Nuevopágina面arriba写东西.  */

/** 服务端明确回非 2xx. `status` Deja给调用方区分 401/409/404 este类需要No同处置情况.  */
import { requestErrorMessage } from './core/request-error';
import { registerResponseEntities } from './core/entity-links';

export class ApiError extends Error {
  readonly status: number;
  /** Respuesta体Original样. 表单校验ese 400 会En `errors` dentro按字段给Original因, página面要它们写回Original.  */
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown = null) {
    super(requestErrorMessage(message,status));
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const reasonOf = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') return '';
  const body = payload as Record<string, unknown>;
  for (const key of ['message', 'detail', 'error']) {
    const value = body[key];
    if (typeof value === 'string' && value) return value;
  }
  return '';
};

/** 抛出来东西收敛成uno句能显示给人verOriginal因. 
 *
 * uno次取数Fallo会同时落到两处—路由树Abrir时primero屏Estado y 共享 store Error态—
 * 两边显示必须es同uno句话, 否则同unoFallo会因Como落En哪儿而说法No同.  */
export const errorMessage = (cause: unknown): string => requestErrorMessage(cause);

/** GET uno `/api/...` 契约端点. `signal` en proceso止时抛出 `AbortError`, 调用方据此放弃写 DOM.  */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    headers: { Accept: 'application/json' },
    // página面口令es httponly cookie, 取数必须带arriba; 跨源Por favor求NoEn此列. 
    credentials: 'same-origin',
    ...(signal ? { signal } : {}),
  });
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // FalloRespuestaNouno定es JSON(例如 401 Iniciar sesiónpágina), abajo面用Estado码兜底. 
  }
  if (!response.ok) {
    throw new ApiError(reasonOf(payload) || `Por favor求Fallido(${response.status})`, response.status);
  }
  registerResponseEntities(path, payload);
  return payload as T;
}

/** 带 JSON Por favor求体写操作. Fallo时OriginalRespuesta体挂En `ApiError.body` arriba, 字段级Original因由调用方取.  */
export async function apiSend<T>(path: string, body: unknown, method = 'POST', signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method, ...(signal ? { signal } : {}),
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // 同arriba: FalloRespuestaNouno定es JSON. 
  }
  if (!response.ok) {
    throw new ApiError(reasonOf(payload) || `Por favor求Fallido(${response.status})`, response.status, payload);
  }
  return payload as T;
}
