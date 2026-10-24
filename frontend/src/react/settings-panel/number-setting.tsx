/* 带单, puede选开关y字段ErrorComentarios数值Configuración. 
 *
 * puede选ese几项(Pasar el ratón放grande, 相关Recomendado, BuscarRegistro, 关注自动Actualizar)anterior面Conuno开关: 关掉就es 0, 
 * 数字框收起来; 再Abrir时Introduce回关掉anteriorese数. ese数记En `peach.number.<id>`, 跟着esteExplorar dispositivo走. 
 * 提交时机跟Original生数字框 `change` uno致: 失焦或回车, 打字途en procesoNo提交.  */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { boundedPreference } from '../../number-setting';

export interface NumberSpec { min: number; max: number; unit: string; optional?: boolean; fallback: number }

export const NUMBER_SPECS = {
  batchSizeSetting: { min: 1, max: 200, unit: '', fallback: 60 },
  hoverDelaySetting: { min: 1, max: 60, unit: 'segundo(s)', optional: true, fallback: 5 },
  seekSecondsSetting: { min: 1, max: 300, unit: 'segundo(s)', fallback: 10 },
  relatedLimitSetting: { min: 1, max: 60, unit: '', optional: true, fallback: 20 },
  searchHistoryLimitSetting: { min: 1, max: 50, unit: 'Resultado', optional: true, fallback: 10 },
  followScheduleSetting: { min: 15, max: 10080, unit: 'minuto(s)', optional: true, fallback: 60 },
} as const satisfies Record<string, NumberSpec>;

export type NumberSettingId = keyof typeof NUMBER_SPECS;

const storageKey = (id: string) => `peach.number.${id}`;

/** 以分钟计间隔满uno天时, 单旁边再说uno遍es几天: "10080 分钟"读No出esuno周. 
 *  No满uno天, NoesCompleto数或Noes分钟读数返回空串.  */
export function dayReading(value: number, unit: string): string {
  if (unit !== 'minuto(s)' || !Number.isInteger(value) || value < 1440) return '';
  const days = value / 1440;
  return Number.isInteger(days) ? `${days.toLocaleString()} día(s)` : `Aprox. ${days.toFixed(1)} día(s)`;
}

export function NumberSetting({ id, label, value, disabled = false, onApply }: {
  id: NumberSettingId; label: string;
  /** 当anterior值; null 表示还没取到(关注自动Actualizareseuno项), 此时Completo禁用, No改显示.  */
  value: number | null;
  disabled?: boolean;
  onApply(value: number): void;
}) {
  const spec: NumberSpec = NUMBER_SPECS[id];
  const { min, max, unit, fallback } = spec;
  const optional = spec.optional === true;
  const remembered = useRef(0);
  if (!remembered.current) {
    remembered.current = boundedPreference(Number(localStorage.getItem(storageKey(id))), min, max,
      value && value > 0 ? value : fallback);
  }
  const [shown, setShown] = useState(value ?? 0);
  const [draft, setDraft] = useState(String(value && value > 0 ? value : remembered.current));
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement | null>(null);
  const apply = useRef(onApply);
  apply.current = onApply;

  /* exterior面换值(DatosBiblioteca对账, 另uno设备改过, Por favor求回来)就跟arriba; null Solo禁用, No动显示.  */
  useLayoutEffect(() => {
    if (value === null) return;
    setShown(value);
    if (value > 0) setDraft(String(value));
  }, [value]);

  const commit = () => {
    const node = input.current;
    if (!node) return;
    if (!node.value || !node.checkValidity()) {
      node.setAttribute('aria-invalid', 'true');
      setError(`Por favorIntroducir ${min}–${max} Completo数(${unit})`);
      return;
    }
    node.removeAttribute('aria-invalid');
    setError('');
    remembered.current = Number(node.value);
    localStorage.setItem(storageKey(id), String(remembered.current));
    apply.current(remembered.current);
  };
  const commitRef = useRef(commit);
  commitRef.current = commit;
  /* Original生 `change`: React  onChange es每uno次按Clave `input`.  */
  useEffect(() => {
    const node = input.current;
    if (!node) return undefined;
    const listener = () => commitRef.current();
    node.addEventListener('change', listener);
    return () => node.removeEventListener('change', listener);
  }, []);

  const on = shown > 0;
  const toggle = () => {
    const node = input.current;
    node?.removeAttribute('aria-invalid');
    setError('');
    if (!on) {
      setShown(remembered.current);
      setDraft(String(remembered.current));
      apply.current(remembered.current);
      return;
    }
    if (node && node.value && node.checkValidity()) remembered.current = Number(node.value);
    localStorage.setItem(storageKey(id), String(remembered.current));
    setShown(0);
    apply.current(0);
  };

  const blocked = disabled || value === null;
  return (
    <div data-number-setting="">
      {optional
        ? <input type="checkbox" data-toggle="" role="switch" aria-label={`Activar${label}`}
            checked={on} disabled={blocked} onChange={toggle} />
        : null}
      <div data-number-fields="" hidden={optional && !on}>
        <div data-number-control="">
          <input ref={input} type="number" inputMode="numeric" className="geist-input" min={min} max={max} step={1}
            value={draft} disabled={blocked} aria-label={label} aria-describedby={`${id}-error`}
            onChange={(event) => {
              setDraft(event.target.value);
              if (event.target.value && event.target.checkValidity()) {
                event.target.removeAttribute('aria-invalid');
                setError('');
              }
            }}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commit() } }} />
          <span aria-hidden="true">{unit}{dayReading(Number(draft), unit) ? ` · ${dayReading(Number(draft), unit)}` : ''}</span>
        </div>
        <small id={`${id}-error`} data-number-error="" role="status" hidden={!error}>{error}</small>
      </div>
    </div>
  );
}
