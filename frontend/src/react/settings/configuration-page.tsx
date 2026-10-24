/* Configuraciónpágina(`/settings/library`): este运行 Peach 电脑arribaese些要"GuardarConfiguración"más字段表单. 
 * 每分区各占uno格página签, uno次Solo摆uno组; 本机ConfiguraciónPermisosyDatosBiblioteca写入Permisos由服务端分别判定. 
 * Configuración弹层en la"Peach Configuración"入口指到aquí. 
 *
 * `.ui-configpage` No.uno层: 最anterior面espágina签(`.ui-board-local-nav`), posterior面每组uno `h2.ui-configgroup` pequeñoTítulo
 * 紧跟esteuno组根节点, 根节点就eseseuno格página签面板. pequeñoTítuloEn样dentroNo显示, 它字ya经写Enpágina签arriba; 
 * Sincontenido组连Títuloypágina签uno起省略. página签No.uno帧就En,  y Completopágina同uno次提交画出来.  */
import { useQuery } from '@tanstack/react-query';
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { peachHistory, shellNavigate, settingsPath } from '@peach/history';

import { errorMessage } from '../../api';
import type { ConfigurationData, ConfigurationPanel, ConfigurationProps } from '../bundle';
import { Note } from '../components/note';
import { CONFIGURATION_KEY, fetchConfiguration } from './configuration';
import { DownloadGroup } from './download-settings';
import { GeneralSettings } from './general-settings';
import { MaintenanceSettings } from './maintenance-settings';
import { MediaSettings } from './media-settings';
import { MediaProcessingSettings } from './media-processing-settings';
import { NetworkSettings } from './network-settings';
import { SourceSettings } from './source-settings';
import { groupRoot } from './configuration-panel';

export function ConfigurationPage({ receipt, reopenTutorial, section = '', diagnostics }: ConfigurationProps & { diagnostics?: ReactElement }) {
  const config = useQuery({
    queryKey: CONFIGURATION_KEY, queryFn: ({ signal }) => fetchConfiguration(signal),
  });
  const data = config.data;
  if (!data) {
    return (
      <div className="ui-configpage">
        <Note tone="error" title="Configuración读取Fallido">
          {config.error ? errorMessage(config.error) : 'No disponibleConfiguración, Por favorActualizarpágina面Reintentar. '}
        </Note>
      </div>
    );
  }
  return <ConfigurationGroups data={data} receipt={receipt} reopenTutorial={reopenTutorial} section={section} diagnostics={diagnostics} />;
}

interface Group { title: string; body(panel: ConfigurationPanel): ReactElement }

/* página签y面板 id anterior缀按página签计数: 每画出unoNuevopágina签领uno号.  */
let tabSequence = 0;

/* página签esuno tablist, 方向ClaveEnCompleto排dentro走, primero尾相continuar, Home/End 到两头, 挪到哪uno格就选en proceso哪uno格, 焦点跟过去. 
   分区地址y选en proceso项Sincronizar, 表单保持挂载.  */
function ConfigurationGroups(
  { data, receipt, reopenTutorial, section, diagnostics }: Required<ConfigurationProps> & { data: ConfigurationData; diagnostics?: ReactElement },
) {
  const [prefix] = useState(() => `board-tabs-${++tabSequence}`);
  const [chosen, setChosen] = useState(section);
  const workspace = useRef<HTMLDivElement>(null);
  const previous = useRef(chosen);
  useEffect(() => { setChosen(section) }, [section]);
  useLayoutEffect(() => {
    if (previous.current === chosen) return;
    previous.current = chosen;
    const nav = workspace.current?.querySelector<HTMLElement>('[role="tablist"]');
    const panel = workspace.current?.querySelector<HTMLElement>('.ui-board-group-active');
    if (!nav || !panel) return;
    const boundary = parseFloat(getComputedStyle(nav).top);
    if (!Number.isFinite(boundary) || nav.getBoundingClientRect().top > boundary + 1) return;
    const top = matchMedia('(max-width:900px)').matches ? nav.getBoundingClientRect().bottom + 8 : boundary;
    window.scrollTo(0, Math.max(0, window.scrollY + panel.getBoundingClientRect().top - top));
  }, [chosen]);
  const choose = (title: string) => {
    setChosen(title);
    shellNavigate(settingsPath(title), { replace: true, state: peachHistory.navigation.location.state });
  };
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width:900px)').matches);
  useEffect(() => {
    const media = matchMedia('(max-width:900px)');
    const changed = () => setNarrow(media.matches);
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const group = { data, receipt };
  const network = Boolean(data.peach_proxy || data.access || data.tunnel || (data.editable && data.port_editable !== false));
  const downloads = data.downloads;
  const groups: Group[] = [
    { title: 'Biblioteca y catalogación', body: (panel) => <div {...groupRoot(panel)}>
      <MediaSettings {...group} /><MediaProcessingSettings receipt={receipt} />
    </div> },
    { title: 'Fuentes y suscripciones', body: (panel) => <SourceSettings {...group} panel={panel} /> },
    ...(downloads ? [{
      title: 'Canal de descarga',
      body: (panel: ConfigurationPanel) => <DownloadGroup initial={downloads} receipt={receipt} panel={panel} />,
    }] : []),
    ...(network ? [{ title: 'Red y acceso', body: (panel: ConfigurationPanel) => <NetworkSettings {...group} panel={panel} /> }] : []),
    {
      title: 'App y mantenimiento',
      body: (panel) => <div {...groupRoot(panel)}>
        <GeneralSettings {...group} />
        <MaintenanceSettings {...group} reopenTutorial={reopenTutorial} />
      </div>,
    },
    { title: 'Diagnóstico del sistema', body: panel => <div {...groupRoot(panel)}>{panel.active ? diagnostics : null}</div> },
  ];
  const at = Math.max(0, groups.findIndex((item) => item.title === chosen));
  const move = (event: KeyboardEvent<HTMLButtonElement>, from: number) => {
    const last = groups.length - 1;
    let next: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = from === last ? 0 : from + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = from === 0 ? last : from - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    choose(groups[next].title);
    buttons.current[next]?.focus();
  };
  return (
    <div ref={workspace} className="ui-configpage">
      <div className="ui-board-local-nav" role="tablist" aria-label="Partición de configuración" data-section-nav="" data-section-items=""
        aria-orientation={narrow ? 'horizontal' : 'vertical'}>
        {groups.map(({ title }, i) => (
          <button key={title} ref={(node) => { buttons.current[i] = node }} type="button" role="tab"
            id={`${prefix}-tab-${i}`} aria-controls={`${prefix}-panel-${i}-0`} aria-selected={i === at}
            tabIndex={i === at ? 0 : -1} onClick={() => choose(title)} onKeyDown={(event) => move(event, i)}>
            {title}
          </button>
        ))}
      </div>
      {groups.map(({ title, body }, i) => (
        <Fragment key={title}>
          <h2 className="ui-configgroup">{title}</h2>
          {body({ index: i, id: `${prefix}-panel-${i}-0`, labelledBy: `${prefix}-tab-${i}`, active: i === at })}
        </Fragment>
      ))}
    </div>
  );
}
