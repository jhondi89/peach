/* 媒体Directorio行: Configuraciónpágina"este电脑"yprimero启página共用. 
 *
 * uno行esuno描边卡: Ruta框, "SeleccionarArchivocarpeta", más行时QuitarClave, abajo面uno排放esteuno行其余字段
 * (媒体来源y读取策略, Configuraciónpágina另Con媒体Biblioteca名称yImagen标), ancho度够时y成uno行. 行增删, 
 * 按行Error, Nuevo行continuar焦点ySeleccionarArchivocarpeta忙态归 `useFolderRows`; 弹系统对话框eseunoPor favor求由调用方注入, aquíNo认识任何端点, primero启páginaIndependiente
 * página面包因此No必带arriba主界面Por favor求封装.  */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { RiDeleteBinLine } from '@remixicon/react';
import { MEDIA_SOURCE_ICONS } from '@peach/legacy/ui';

import { IconButton } from '@/components/base/buttons/icon-button';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { Select, SelectItem } from '@/components/base/select/select';

import { ErrorText, Help, SourceMark } from './section';
import { busyProps } from './busy-props';
import { CLOUD_LOCATIONS, MEDIA_SOURCE_OPTIONS, type SourceCost } from '../../core/media-sources';

/** "SeleccionarArchivocarpeta"弹系统对话框去挑, Todo站用雪碧Imagen `folder-search`; `folder-open` 归"AbrirUbicación", 
 * Remix Icon dentroSinesteuno.  */
export function FolderSearchIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <use href="#i-folder-search" />
    </svg>
  );
}

export type SourceOption = readonly [kind: string, name: string];

export const MEDIA_SOURCES: readonly SourceOption[] = MEDIA_SOURCE_OPTIONS;

export const sourceMark = (location: string) => MEDIA_SOURCE_ICONS[location] || 'database';
export const isCloudSource = (location: string) => CLOUD_LOCATIONS.includes(location);

export function MediaReadPolicy({ index, cost, error, onChange }: {
  index: number; cost: SourceCost | ''; error?: string; onChange(cost: SourceCost): void;
}) {
  return <div data-media-read-policy={index} className="flex w-full flex-col gap-1.5 @lg:w-48">
    <Select aria-label={`Medios读取Política ${index + 1}`} placeholder="Seleccionar读取Política" isRequired
      validationBehavior="aria" isInvalid={Boolean(error)} selectedKey={cost || null}
      onSelectionChange={(key) => { if (key === 'free' || key === 'metered') onChange(key); }}>
      <SelectItem id="free">Normal读取</SelectItem>
      <SelectItem id="metered">ProxyTráfico保护</SelectItem>
    </Select>
    {error ? <ErrorText>{error}</ErrorText> : null}
  </div>;
}

export function MediaReadPolicyHelp() {
  return <Help>按MontarHerramientas实际ConfiguraciónSeleccionar; ProxyTráfico保护会限制AutomáticoMedios读取. </Help>;
}

export interface FolderRowValue { path: string; location: string }

/** 行Estado. `pickFolder` 拿当anteriorRuta作对话框起点, 返回选en procesoRuta, Cancelar返回 null; 
 * Fallo抛出Original因经 `describe` 变成写Enesteuno行abajo面ese句话.  */
export function useFolderRows<T extends FolderRowValue>({ initial, blank, pickFolder, describe, focusAfterPick = false }: {
  initial: () => T[];
  blank: () => T;
  pickFolder: (initial: string) => Promise<string | null>;
  describe: (cause: unknown) => string;
  /** 选完焦点交回esteuno行Ruta框(primero启página); ConfiguraciónpáginaDejaEnSeleccionarClavearriba.  */
  focusAfterPick?: boolean;
}) {
  const [rows, setRows] = useState(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [focusRow, setFocusRow] = useState<number | null>(null);
  const [picking, setPicking] = useState<number | null>(null);
  const pickingNow = useRef(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Nuevo加uno行直continuarcontinuar过焦点: 添加之posteriorSiguiente步uno定es往dentro打Ruta. 
  useLayoutEffect(() => {
    if (focusRow === null) return;
    inputs.current[focusRow]?.focus();
    setFocusRow(null);
  }, [focusRow]);

  const edit = (index: number, patch: Partial<T>) =>
    setRows((list) => list.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const setRowError = (index: number, message: string) => setErrors((list) => {
    const next = [...list];
    while (next.length <= index) next.push('');
    next[index] = message;
    return next;
  });
  const add = () => {
    setFocusRow(rows.length);
    setRows((list) => [...list, blank()]);
  };
  const remove = (index: number) => {
    setRows((list) => list.filter((_, i) => i !== index));
    setErrors((list) => list.filter((_, i) => i !== index));
  };

  // 对话框开着时候esteuno行SeleccionarClave置忙; Cancelar什么也No改, 打No开时Original因写Enesteuno行abajo面. 
  const pick = async (index: number) => {
    if (pickingNow.current) return;
    pickingNow.current = true;
    setPicking(index);
    try {
      const path = await pickFolder(rows[index]?.path ?? '');
      if (path) {
        edit(index, { path } as Partial<T>);
        setRowError(index, '');
      }
      if (focusAfterPick) setFocusRow(index);
    } catch (cause) {
      setRowError(index, describe(cause));
    } finally {
      pickingNow.current = false;
      setPicking(null);
    }
  };

  const inputRef = (index: number) => (element: HTMLInputElement | null) => { inputs.current[index] = element; };
  return { rows, edit, add, remove, errors, setErrors, picking, pick, inputRef };
}

/** uno行描边卡. `label` esRuta框Sin障碍名, `children` 排进Rutaabajo面eseuno格. `error` Original样放进Ruta框
 * abajoSugerencia, 调用方puede以传uno段带 `role="alert"` 节点让读屏播报. `status` 排EnRuta框derecha侧, 
 * Configuraciónpágina用它标esteArchivocarpeta此刻EnNoEn线.  */
export function FolderRow({ label, path, onPath, error, inputRef, picking, onPick, onRemove, status, children }: {
  label: string;
  path: string;
  onPath: (path: string) => void;
  error?: ReactNode;
  inputRef: (element: HTMLInputElement | null) => void;
  picking: boolean;
  onPick: () => void;
  onRemove?: () => void;
  status?: ReactNode;
  children: ReactNode;
}) {
  /* uno组Archivocarpeta常共用很largoanterior缀, estrecho框dentro露开头话每行都es同uno段; NoEnEditar时露último段, 
     分得出es哪unoArchivocarpeta. Todo文En title dentro.  */
  const box = useRef<HTMLInputElement | null>(null);
  const showTail = () => {
    const input = box.current;
    if (input && input.ownerDocument.activeElement !== input) input.scrollLeft = input.scrollWidth;
  };
  useLayoutEffect(() => {
    if (box.current) box.current.title = path;
    showTail();
  }, [path]);
  const attach = (element: HTMLInputElement | null) => {
    box.current = element;
    inputRef(element);
  };
  return (
    <div data-folder-row className="@container flex flex-col gap-2 rounded-2lg border border-separator-border bg-background-primary-default p-3">
      <div className="flex items-start gap-2">
        <Input className="min-w-0 flex-1" aria-label={label} placeholder="Directorio de mediosRuta"
          value={path} onChange={onPath} ref={attach}
          onBlur={() => requestAnimationFrame(showTail)}
          validationBehavior="aria" isInvalid={Boolean(error)} hint={error || undefined} />
        {status ? <div className="flex h-9 shrink-0 items-center">{status}</div> : null}
        <IconButton icon={FolderSearchIcon} aria-label="SeleccionarCarpeta" onClick={onPick} {...busyProps(picking)} />
        {onRemove ? <Button variant="danger" iconOnly leadingIcon={RiDeleteBinLine} aria-label="QuitaresteCarpeta" onClick={onRemove} /> : null}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {children}
      </div>
    </div>
  );
}

/** 媒体来源abajo拉, 每项带站标; 本地磁盘es雪碧Imagen `hard-drive`. 选en proceso项站标就es它Etiqueta, 
 * 框arribaNo再挂文字名, Sin障碍名称由 `aria-label` 给.  */
export function SourceSelect({ index, value, onChange, options = MEDIA_SOURCES }: {
  index: number;
  value: string;
  onChange: (location: string) => void;
  options?: readonly SourceOption[];
}) {
  return (
    <Select className="w-full @lg:w-60" aria-label={`Fuente de medios ${index + 1}`} selectedKey={value}
      onSelectionChange={(key) => { if (key !== null) onChange(String(key)); }}>
      {options.map(([kind, name]) => (
        <SelectItem key={kind} id={kind} textValue={name}><SourceMark mark={sourceMark(kind)} />{name}</SelectItem>
      ))}
    </Select>
  );
}
