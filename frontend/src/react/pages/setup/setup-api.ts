/* primero启páginatresPor favor求: 取题目, 提交, 让este电脑弹Archivocarpeta对话框. 
 *
 * página面包No带主界面Por favor求封装y Query 缓存, aquí直continuar用 `fetch`. 形态见 `docs/OPERATIONS.md`
 * "primero次Configuracióninterior部流程": Error正文es `{error, errors?}`, `errors` 按题目 key 给, 媒体Directorioeseuno项es
 * y行对应Lista, Completo表No成立时esSoloConuno句话Lista.  */
import { PICK_FOLDER_URL } from '../../../configuration-endpoints';

export const SETUP_QUESTIONS_URL = '/api/setup/questions';
export const SETUP_URL = '/api/setup';

export interface SetupOption { value: string; label: string }

export interface SetupQuestion {
  key: string;
  label: string;
  help: string[];
  default: string;
  required: boolean;
  advanced: boolean;
  input: 'folders' | 'choice' | 'text' | 'number';
  prefix: string;
  suffix: string;
  options?: SetupOption[];
  visible_when?: Record<string, string>;
}

export interface MountDependency { name: string; message: string; download_url: string; download_label: string }

export interface SetupQuestions {
  remote_reporting?: import('../../settings/remote-reporting-settings').RemoteReportingState;
  windows: boolean;
  standalone: boolean;
  questions: SetupQuestion[];
  media_sources: SetupOption[];
  media_source_default: string;
  media_root: { label: string; placeholder: string } | null;
  cloud: { help: string; link: { url: string; label: string }; dependencies: MountDependency[] };
  access_enabled: boolean;
  scan_now: boolean;
  history_guide: boolean;
}

export interface SetupFact { term: string; value: string; download_url?: string; download_label?: string }

export interface SetupDone {
  restored?: boolean;
  url: string;
  scan_requested: boolean;
  history_guide: boolean;
  standalone: boolean;
  redirect: string | null;
  facts: SetupFact[];
}

export type SetupErrors = Partial<Record<string, string | string[]>>;

export interface SetupFolder { path: string; location: string; root: string; cost?: 'free' | 'metered' | '' }

export interface SetupSubmission {
  media_dir: SetupFolder[];
  access_enabled: boolean;
  access_password?: string;
  access_confirm?: string;
  scan_now: boolean;
  history_guide: boolean;
  [key: string]: unknown;
}

export class SetupRequestError extends Error {
  constructor(readonly status: number, message: string, readonly errors?: SetupErrors) {
    super(message);
  }
}

async function request<T>(url: string, init: RequestInit, fallback: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      credentials: 'same-origin', ...init,
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    });
  } catch (cause) {
    if (init.signal?.aborted) throw cause;
    throw new SetupRequestError(0, 'ConectarNo到 Peach, Por favorConfirmar它仍En运行posteriorReintentar');
  }
  const body = await response.json().catch(() => null) as { error?: string; errors?: SetupErrors } | null;
  if (!response.ok) throw new SetupRequestError(response.status, body?.error || fallback, body?.errors);
  return body as T;
}

export const fetchQuestions = (signal?: AbortSignal) =>
  request<SetupQuestions>(SETUP_QUESTIONS_URL, { signal }, '没能读取Configuración题目');

export const submitSetup = (submission: SetupSubmission) =>
  request<SetupDone>(SETUP_URL, { method: 'POST', body: JSON.stringify(submission) }, '没能FinalizarConfiguración');

export const restoreSetup = (dataRoot: string) =>
  request<SetupDone>(`${SETUP_URL}/restore`, { method: 'POST', body: JSON.stringify({ data_root: dataRoot }) }, '没能使用此DatosDirectorio');

export const pickFolder = async (initial: string) =>
  (await request<{ path: string | null }>(PICK_FOLDER_URL,
    { method: 'POST', body: JSON.stringify({ initial }) }, '没能AbrirCarpeta对话框')).path;

export const describeFailure = (cause: unknown) => (cause instanceof Error && cause.message) || 'Por favor求Fallido, Por favorReintentar';
