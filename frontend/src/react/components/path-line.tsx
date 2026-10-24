/* página面arriba印着TodoRutaeseuno行: Ruta本身, 加uno它En资源GestionarDispositivodentroAbrirClave. 
 *
 * CredencialesArchivo, 问题Registro, Desinstalar会删DatosDirectorio都印TodoRuta, 读到它Siguiente步就es去ese儿veruno眼; 
 * 照着抄uno遍再粘回资源GestionarDispositivoes白抄. 递给服务端Soloesesteuno串, 能No能开由它拿自己
 * Peach DatosDirectoriopesado判(`/api/reveal`  `path` 分支). 
 *
 * 窗口弹En**服务端ese机Dispositivo**arriba: 本机Explorar时它自己就es回执, 从别设备Explorar时este边屏幕
 * 什么都No会发生, 所以Éxito仍要报uno句. FalloDejaEnRuta旁边, etc.人Reintentar.  */
import { useEffect, useRef, useState } from 'react';

import { IconButton } from '@/components/base/buttons/icon-button';
import { cx } from '@/utils/cx';

import { ApiError, apiSend } from '../../api';
import { busyProps } from '../settings/use-action';

/** Todo站"AbrirUbicación"eseuno. 雪碧Imagenen la `folder-open`, Remix Icon Sin对应uno.  */
function FolderOpenIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <use href="#i-folder-open" />
    </svg>
  );
}

/** Por favor求没发出去(断网, página面换口令)时说法. 服务端答得arriba来Original因由它自己写成en proceso文.  */
const UNREACHED = 'Error al abrir el explorador, por favor inténtalo de nuevo';

export function PathLine(
  { path, prefix, className, onRevealed }:
  {
    path: string;
    /** Rutaanterior面ese几字("完CompletoRegistro: "). 跟Ruta同uno行, 换行时No y Ruta拆开.  */
    prefix?: string;
    /** esteuno行文字Tamaño de fuenteyColor由使用处定: Rutaes次要Información, 各处次要色Noes同uno.  */
    className?: string;
    /** 定Éxitoposterior回执. 窗口NoEneste机Dispositivoarriba时, este句话es唯uno动静.  */
    onRevealed?(message: string): void;
  },
) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  /* 弹窗esteunoabajo由服务端去做, 回程puede能落Enpágina面ya经换掉之posterior; ese时esteuno行早就NoEn.  */
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false }, []);
  const reveal = async () => {
    if (busy) return;
    setBusy(true);
    setProblem('');
    try {
      await apiSend('/api/reveal', { path });
      onRevealed?.('Mostrado en el explorador');
    } catch (error) {
      if (alive.current) setProblem(error instanceof ApiError ? error.message : UNREACHED);
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-1">
      {/* Ruta y eseClave排En同unoen proceso线arriba: Clave比este行pequeño字altouno截, 顶对齐时它自己ver着往arriba飘.  */}
      <div className="flex items-center justify-between gap-2">
        <p className={cx('min-w-0 break-all', className)}>
          {prefix}{path}
        </p>
        <IconButton icon={FolderOpenIcon} size="small" className="shrink-0" aria-label="Mostrar en explorador"
          onClick={() => void reveal()} {...busyProps(busy)} />
      </div>
      {problem ? <p className="text-caption-1-regular text-text-error-primary">{problem}</p> : null}
    </div>
  );
}
