/* Configuración面板: 顶栏齿轮Abrireseuno屏浮层, izquierda栏分区, derecha边uno组组Configuración行. 
 *
 * 常驻组件 `settings-panel`(`router/managed-routes.tsx` 常驻表): No.uno次Abrir时壳 `loadSettingsPanel` 建uno
 * `[data-settings-host]`, 常驻组件 `place` 它放进 body último尾, 路由树En同unoTareadentro面板画成它子节点. 
 * 之posterior开合Solo换 `hidden`, 分区, 滚动Ubicación之exteriorEstado跨次Abrir保Deja. 壳经 `configureSettingsPanel` 给句柄开合: 
 * 句柄写本模 store 再 `flushSync` 通知, 返回时面板ya经画bien, 锁滚, 取数y焦点紧跟Enposterior面. 界面偏bien读写es
 * 壳递进来eseuno `appSettings`(`host.store`), 改完uno项用 `host.changed(effect)` 告诉壳跟着做什么; 跟DatosBiblioteca走
 * ese几项经 `/api/settings` 写(`settings-data.ts`). 
 *
 * 宿主NoEn `.peach-react` dentro: 行, 开关, abajo拉, 拉y色都esTodo站共用遗DejaControles, exterior观由
 * `settings-panel.css` y遗Deja样表给. 
 *
 * 每次Abrir时共用Controlespesado画, 数值框回到当anterior值, ypesado取共享Configuración. 
 * 焦点先交给Cerrar钮, Tab En面板dentro转圈, 关掉posterior还给Abriranterioreseuno.  */
import {
  useLayoutEffect, useRef, useState, useSyncExternalStore,
  type KeyboardEvent, type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { ButtonLink } from '@/components/base/buttons/button';
import {
  attachOverlayScrollbar, closeAnchoredMenu, iconSwapHtml, moveGlidePane, revealTexts,
  setActionBusy, setIconSwap, wireHorizontalScroller,
} from '@peach/legacy/ui';

import { normalizeJavImage } from '../../jav-artwork';
import { boundedPreference } from '../../number-setting';
import { GlowSettings } from './glow-settings';
import { Icon, RemixIcon } from './icon';
import { IconSwitch, SelectField } from './legacy-controls';
import { NumberSetting } from './number-setting';
import type { Choice, PanelSettings, SettingsPanelApi, SettingsPanelHost } from './settings-panel-api';
import { refreshPanelData, useSaveSettings } from './settings-data';
import { SidebarOrder } from './sidebar-order';
import { SettingsDialogClose } from '../components/settings-dialog-close';

/* izquierda栏分区, 顺序即derecha边各组顺序. 字形按Entrada自己名字取: Completo列取自 Remix, uno家画笔画
   才uno样粗.  */
const SECTIONS = [
  ['Apariencia y navegación', 'ri-palette-line'], ['Explorar y reproducir', 'ri-play-circle-line'],
  ['JAV y nuevos lanzamientos', 'jav'], ['Búsqueda y recomendaciones', 'ri-search-line'], ['Visualización de contenido', 'ri-shield-check-line'],
] as const;

const SORT_OPTIONS: readonly Choice[] = [
  ['seed', 'Aleatorio'], ['rating', 'Puntuación'], ['o', 'Contador de orgasmos'], ['plays', 'Reproducciones'],
  ['dur', 'Duración'], ['size', 'Tamaño'], ['new', 'Fecha de catalogación'], ['played', 'Tiempo de reproducción'],
];
const DIRECTION_OPTIONS: readonly Choice[] = [['desc', 'Descendente'], ['asc', 'Ascendente']];
const JAV_IMAGE_OPTIONS: readonly Choice[] = [['cover', 'OficialPortada', ''], ['thumbnail', 'Vista previaImagen', '']];
/* Nuevas obraseseuno行收No收合集由服务端按DatosBibliotecaen laConfiguración筛, esteen la开关Soloes镜像: 真相En `/api/settings`.  */
const FEED_COMPILATIONS = [
  ['feedHideGroupSetting', 'feedHideGroupCompilations', 'grandeColección', 'OcultargrandeColección'],
  ['feedHideSoloSetting', 'feedHideSoloCompilations', '单人Colección', 'Ocultar单人Colección'],
  ['feedHideExcerptSetting', 'feedHideExcerpts', 'Segmento', 'OcultarSegmento'],
] as const;
type CompilationKey = typeof FEED_COMPILATIONS[number][1];

const FOCUSABLE = 'button:not([disabled]),input:not([disabled]),textarea:not([disabled]),a[href]';

interface View { open: boolean; closing: boolean; epoch: number; tab: number; configurable: boolean | null }

let host: SettingsPanelHost | null = null;
let view: View = { open: false, closing: false, epoch: 0, tab: 0, configurable: null };
let transition = 0;
let returnFocus: Element | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener) };
}

function notify(): void {
  for (const listener of [...listeners]) listener();
}

/* 写进 store 当场画完: 句柄返回时面板ya经esNuevo样子, 紧跟着锁滚, 取数y焦点读都es画bien DOM. 
   esteuno面抛错, 被Error边界卸掉之posterior没人订阅, 写进来Solo进 store, No画, No抛.  */
function update(patch: Partial<View>): void {
  view = { ...view, ...patch };
  flushSync(notify);
}

/* Peach Configuración入口按当anterior设备ConfiguraciónPermisos放行.  */
async function checkMachine(current: SettingsPanelHost): Promise<void> {
  const epoch = view.epoch;
  const configurable = await current.configurable();
  if (!view.open || view.epoch !== epoch) return;
  update({ configurable });
}

function open(section = ''): void {
  const current = host;
  if (!current) return;
  const requested = SECTIONS.findIndex(([title]) => title === section);
  if (view.open && !view.closing) {
    if (requested >= 0 && requested !== view.tab) update({ tab: requested });
    return;
  }
  /* Configuraciónesteuno屏盖住Completopágina, 任何还开着锚定弹层都得先收掉: ConfiguraciónCon侧栏Configuración钮, 配色弹层
     "详细Configuración" y rápido捷Clave几处入口, 收Enaquí就No会漏掉哪uno处.  */
  closeAnchoredMenu();
  transition += 1;
  returnFocus ||= document.activeElement;
  current.sound('whoosh');
  document.documentElement.style.overflow = 'hidden';
  document.body.classList.add('settings-open');
  /* 先发取数再画: No.uno次Abrir时Consulta还No存En, esteuno趟由 `fetchQuery` 建起来, 组件画出来读到
     就esEn途esteuno, No会再发No.dos趟.  */
  const remote = refreshPanelData();
  update({ open: true, closing: false, configurable: null, epoch: view.epoch + 1, tab: requested >= 0 ? requested : view.tab });
  void remote.then((settings) => { if (settings) current.syncRemote(settings) });
  void checkMachine(current);
  queueMicrotask(() => document.getElementById('settingsClose')?.focus());
}

function close(notify = true): void {
  if (!view.open || view.closing) return;
  const ticket = ++transition;
  if (notify) host?.closed?.();
  update({ closing: true });
  const finish = () => {
    if (ticket !== transition || !view.closing) return;
    update({ open: false, closing: false });
    document.documentElement.style.overflow = '';
    document.body.classList.remove('settings-open');
    if (returnFocus instanceof HTMLElement && document.contains(returnFocus)) returnFocus.focus();
    returnFocus = null;
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { queueMicrotask(finish); return }
  document.querySelector('#settingsPanel > [data-settings-card]')?.addEventListener('animationend', finish, { once: true });
  setTimeout(finish, 380);
}

const api: SettingsPanelApi = {
  open,
  close,
  isOpen: () => view.open,
  reveal: (selector) => queueMicrotask(() => document.querySelector(selector)?.scrollIntoView({ block: 'nearest' })),
};

/** continuararriba壳给宿主, 拿回Configuración面板命令入口. Solo调uno次; 壳 `loadSettingsPanel` continuar着En路由树dentroAbriresteuno面, 
 *  画arriba(收着)面板之posterior才交出句柄.  */
export function configureSettingsPanel(next: SettingsPanelHost): SettingsPanelApi {
  host = next;
  return api;
}

/** 常驻表en laeseuno面: 读本模 store, 宿主还没continuararriba时No画.  */
export function SettingsPanelSurface() {
  const shown = useSyncExternalStore(subscribe, () => view);
  return host ? <SettingsPanel host={host} view={shown} /> : null;
}

function trapTab(event: KeyboardEvent<HTMLElement>): void {
  if (event.key !== 'Tab') return;
  /* 没选en proceso分区Completo hidden, dentro面Controles拿No到焦点; 圈两头SoloEnver得见Controlesdentro找.  */
  const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)]
    .filter((node) => node.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}

const tabId = (index: number) => `settings-tab-${index}`;
const groupId = (index: number) => `settings-group-${index}`;

/* izquierda栏当anterior项由uno滑过去玻璃标出来,  y izquierda侧抽屉es同uno件事两形态. 坐标取 `offsetTop`
   No取屏幕坐标: 面板开合自带uno段Zoom动画, 量屏幕坐标会En curso走eseunoabajo吃进来. 玻璃跟着指针走, 
   指针离开esteuno列就滑回当anteriorese格; 触点SinPasar el ratón, 碰unoabajo就滑过去etc.于替用户点uno次, 所以挡Enexterior面.  */
function SettingsNav({ tab, epoch, configurable, openConfiguration, onSelect }: {
  tab: number; epoch: number; configurable: boolean | null; openConfiguration(): void; onSelect(index: number): void;
}) {
  const nav = useRef<HTMLDivElement | null>(null);
  const glide = useRef<HTMLSpanElement | null>(null);
  const box = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const shown = useRef(tab);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const place = (active: HTMLElement | null | undefined, animate: boolean) => {
    const pane = glide.current;
    if (!pane) return;
    if (!active || !active.offsetHeight) { pane.hidden = true; return }
    pane.hidden = false;
    const next = { x: active.offsetLeft, y: active.offsetTop, w: active.offsetWidth, h: active.offsetHeight };
    const from = box.current;
    box.current = next;
    moveGlidePane(pane, animate ? from : null, next, 'y');
  };
  const placeRef = useRef(place);
  placeRef.current = place;

  useLayoutEffect(() => {
    const node = nav.current;
    if (!node) return undefined;
    wireHorizontalScroller(node);
    /* 面板收着时esteuno栏escero尺寸, 量No到落点; 露出来eseuno帧, estrecho屏断点换ancho度时都由esteuno对齐.  */
    const observer = new ResizeObserver(() => placeRef.current(buttons.current[shown.current], false));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const moved = shown.current !== tab;
    shown.current = tab;
    placeRef.current(buttons.current[tab], moved);
  }, [tab, epoch]);

  const keys = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = SECTIONS.length;
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % count;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + count - 1) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else return;
    event.preventDefault();
    onSelect(next);
    buttons.current[next]?.focus();
  };

  /* Completoesuno tablist: pequeñoTítulo写成 presentation, No占 tab Ubicación, 方向Clave从头走到尾.  */
  return (
    <div data-settings-nav="" data-glass-pane="" role="tablist" aria-label="Configuración分区" ref={nav}
      onPointerLeave={(event) => { if (event.pointerType !== 'touch') place(buttons.current[shown.current], true) }}>
      <span data-settings-glide="" aria-hidden="true" hidden ref={glide} />
      <p data-settings-nav-caption="" role="presentation">Configuración</p>
      {SECTIONS.map(([title, icon], index) => (
        <button type="button" role="tab" key={title} id={tabId(index)} aria-controls={groupId(index)}
          aria-selected={index === tab} tabIndex={index === tab ? 0 : -1}
          ref={(node) => { buttons.current[index] = node }}
          onClick={() => onSelect(index)} onKeyDown={(event) => keys(event, index)}
          onPointerEnter={(event) => { if (event.pointerType !== 'touch') place(event.currentTarget, true) }}>
          {icon === 'jav' ? <Icon name={icon} /> : <RemixIcon name={icon} />}{title}
        </button>
      ))}
      <div data-settings-service="" role="presentation">
        <button type="button" disabled={configurable !== true} onClick={openConfiguration}
          title={configurable === false ? 'Por favorEn运行 Peach DispositivoarribaAbrir Configuración de Peach' : undefined}>
          <Icon name="folder-cog" />Configuración de Peach<Icon name="chevron-right" />
        </button>
      </div>
    </div>
  );
}

function Group({ index, tab, children }: { index: number; tab: number; children: ReactNode }) {
  return (
    <section data-setting-group="" id={groupId(index)} role="tabpanel" aria-labelledby={tabId(index)} hidden={index !== tab}>
      <h3>{SECTIONS[index][0]}</h3>
      {children}
    </section>
  );
}

/** uno行开关: Completo行es label, 点哪儿都切. Descripcióneseuno句 id Predeterminado取开关 id 去掉 `Setting` 再continuar `Description`.  */
function ToggleRow({ id, title, description, describedBy = `${id.replace(/Setting$/, '')}Description`, checked, onToggle }: {
  id: string; title: string; description?: string; describedBy?: string; checked: boolean; onToggle(on: boolean): void;
}) {
  return (
    <label data-setting-row="">
      <span><b>{title}</b>{description ? <small id={describedBy}>{description}</small> : null}</span>
      <input data-toggle="" type="checkbox" id={id} role="switch" aria-describedby={description ? describedBy : undefined}
        checked={checked} onChange={(event) => onToggle(event.target.checked)} />
    </label>
  );
}

function Row({ title, description, kind, children }: {
  title: string; description?: ReactNode; kind?: 'sort' | 'related'; children: ReactNode;
}) {
  return (
    <div data-setting-row="" data-setting-sort={kind === 'sort' ? '' : undefined}
      data-setting-related={kind === 'related' ? '' : undefined}>
      <span><b>{title}</b>{typeof description === 'string' ? <small>{description}</small> : description}</span>
      {children}
    </div>
  );
}

function SettingsPanel({ host: current, view: shown }: { host: SettingsPanelHost; view: View }) {
  /* 订阅SoloComopesado画: 读es活对象 `store.value`, Versión号本身No用.  */
  useSyncExternalStore(current.store.subscribe, current.store.version);
  const settings = current.store.value;
  const panel = useRef<HTMLElement | null>(null);
  const card = useRef<HTMLDivElement | null>(null);
  const head = useRef<HTMLDivElement | null>(null);
  const scroll = useRef<HTMLDivElement | null>(null);
  const resync = useRef<(() => void) | null>(null);
  const lastTab = useRef(shown.tab);

  /* Títuloabajoese道影子门槛esese段Deja白自己: 它largoEnesteuno栏arribaRellenoarriba, 滚掉它就etc.于两pesado合, 
     差 4px 时点亮. Deja白值Solo写En `--settings-gap` uno处, aquí读它.  */
  const fade = () => {
    const [box, body] = [card.current, scroll.current];
    if (!box || !body) return;
    const gap = parseFloat(getComputedStyle(box).getPropertyValue('--settings-gap')) || 0;
    box.toggleAttribute('data-scrolled', body.scrollTop > Math.max(gap - 4, 0));
  };
  const fadeRef = useRef(fade);
  fadeRef.current = fade;

  useLayoutEffect(() => {
    const body = scroll.current;
    if (!body || !panel.current) return undefined;
    resync.current = attachOverlayScrollbar(body) ?? resync.current;
    current.attached(panel.current);
    const listener = () => fadeRef.current();
    body.addEventListener('scroll', listener, { passive: true });
    return () => body.removeEventListener('scroll', listener);
  }, [current]);
  /* 换分区, 每次Abrir都回到顶arriba; 换分区时Título逐字揭示, Solo开合No放.  */
  useLayoutEffect(() => {
    const moved = lastTab.current !== shown.tab;
    lastTab.current = shown.tab;
    if (scroll.current) scroll.current.scrollTop = 0;
    if (moved && head.current) revealTexts(head.current, 'h2');
    fadeRef.current();
  }, [shown.tab, shown.epoch]);
  /* 换分区, 展开收起uno组都Solo切 `hidden`, 滚动观察DispositivoSolover子树增删, contenidolargocorto变它No知道. 
     每次画完按Nuevocontenidolargo度pesado量uno遍滑 y 两端渐隐.  */
  useLayoutEffect(() => { resync.current?.() });

  const epoch = shown.epoch;
  const select = (index: number) => { if (index !== view.tab) { update({ tab: index }); current.selectSection?.(SECTIONS[index][0]) } };
  const save = () => current.store.save();

  return (
    <section data-settings-panel="" id="settingsPanel" hidden={!shown.open} aria-modal="true" role="dialog"
      aria-labelledby="settingsTitle" data-closing={shown.closing ? '' : undefined} ref={panel} onKeyDown={trapTab}
      onClick={(event) => { if (event.target === event.currentTarget) close() }}>
      <div data-settings-card="" ref={card}>
        <div data-settings-head="" ref={head}>
          <h2 id="settingsTitle">{SECTIONS[shown.tab][0]}</h2>
            <SettingsDialogClose id="settingsClose" label="DesactivarConfiguración" onPress={() => close()} />
        </div>
        <SettingsNav tab={shown.tab} epoch={epoch} configurable={shown.configurable} onSelect={select}
          openConfiguration={() => { close(false); current.openConfiguration() }} />
        <div data-settings-scroll="" ref={scroll}>
          <Group index={0} tab={shown.tab}>
            <Row title="Tema">
              <IconSwitch id="themeSetting" name="theme" legend="Tema" options={current.themeOptions} value={settings.theme}
                attr="data-theme-choice" variant="themeswitch" epoch={epoch}
                onChoose={(choice) => { settings.theme = choice; save(); current.changed('theme') }} />
            </Row>
            <div data-setting-row="">
              <label htmlFor="glassContrastSetting"><b>增加Contraste</b></label>
              <input type="checkbox" id="glassContrastSetting" data-toggle="" role="switch" checked={current.highContrast()}
                onChange={(event) => current.setHighContrast(event.target.checked)} />
            </div>
            <ToggleRow id="uiSoundsSetting" title="Sonidos de interfaz" checked={settings.uiSounds}
              onToggle={(on) => { settings.uiSounds = on; save(); current.changed('uiSounds') }} />
            <ToggleRow id="homeGlowSetting" title="Resplandor de barra lateral" checked={settings.homeGlow.on}
              onToggle={(on) => { settings.homeGlow.on = on; save(); current.changed('glow') }} />
            <GlowSettings host={current} />
            <section data-sidebar-setting="" aria-labelledby="sidebarOrderTitle">
              <span><b id="sidebarOrderTitle">Entradas de navegación y orden</b></span>
              <SidebarOrder host={current} />
            </section>
          </Group>
          <BrowseGroup host={current} tab={shown.tab} epoch={epoch} />
          <JavGroup host={current} tab={shown.tab} epoch={epoch} />
          <Group index={3} tab={shown.tab}>
            <SearchHistoryRow host={current} epoch={epoch} />
            <Row title="Cantidad de recomendaciones relacionadas">
              <div id="relatedLimitSetting">
                <NumberSetting key={epoch} id="relatedLimitSetting" label="Cantidad de recomendaciones relacionadas" value={settings.relatedLimit}
                  onApply={(value) => { settings.relatedLimit = value; save() }} />
              </div>
            </Row>
            <Row title="PreferenciasyRegistro"><div className="peach-react"><ButtonLink variant="secondary" href="/taste" onClick={() => close(false)}>AbrirPreferenciasyRegistro</ButtonLink></div></Row>
          </Group>
          <Group index={4} tab={shown.tab}>
            <ToggleRow id="censorSetting" title="Modo SFW" describedBy="sfwDescription" checked={current.censored()}
              description="Ocultar敏感Imagen, DetenerVista previa al pasar el ratón. "
              onToggle={(on) => current.setCensored(on)} />
          </Group>
        </div>
      </div>
    </section>
  );
}

interface GroupProps { host: SettingsPanelHost; tab: number; epoch: number }

/* Ordenar方向eseuno格叠着两箭头, 换Soloes方向esteuno件事: Completo格pesado写会antiguo字形连同它动画uno起丢掉, 
   读出来esuno次Grave切, 所以SoloEnesteuno格还没建起来时写uno次.  */
function decorateDirection(field: HTMLElement, ascending: boolean): void {
  const mark = field.querySelector('[data-select-label]');
  if (!mark) return;
  if (!mark.querySelector('[data-icon-swap]')) {
    mark.innerHTML = iconSwapHtml('arrow-up', 'arrow-down', 'a', { className: 'gselectmark', iconClass: 'gselectmark' })
      + '<span data-sort-direction-label></span>';
  }
  setIconSwap(mark, ascending ? 'a' : 'b');
  const label = mark.querySelector('[data-sort-direction-label]');
  if (label) label.textContent = ascending ? 'Ascendente' : 'Descendente';
}

function BrowseGroup({ host: current, tab, epoch }: GroupProps) {
  const settings = current.store.value;
  const save = () => current.store.save();
  const random = settings.defaultSort === 'seed';
  const ascending = settings.defaultSortDirection === 'asc';
  return (
    <Group index={1} tab={tab}>
      <Row title="每批CargarObra">
        <div id="batchSizeSetting">
          <NumberSetting key={epoch} id="batchSizeSetting" label="每批Obra" value={settings.batchSize}
            onApply={(value) => { settings.batchSize = value || 60; save(); current.changed('batchSize') }} />
        </div>
      </Row>
      <Row title="PredeterminadoOrdenar" kind="sort">
        <div data-setting-sort-controls="">
          <SelectField id="defaultSortSetting" label="PredeterminadoOrdenar" options={SORT_OPTIONS} value={settings.defaultSort} epoch={epoch}
            onPick={(value) => { settings.defaultSort = value; save(); current.changed('defaultSort') }} />
          <SelectField id="defaultSortDirectionSetting" label="PredeterminadoOrdenar方向" options={DIRECTION_OPTIONS}
            value={ascending ? 'asc' : 'desc'} hidden={random} disabled={random} epoch={epoch}
            onPick={(value) => { settings.defaultSortDirection = value; save(); current.changed('sortDirection') }}
            decorate={(field) => decorateDirection(field, ascending)} />
        </div>
      </Row>
      <Row title="VideosTarjetaTamaño">
        <IconSwitch id="javSizeSetting" name="video-size" legend="VideosTarjetaTamaño" options={current.videoLayouts}
          value={current.videoLayout()} attr="data-video-layout" variant="javimageswitch" text epoch={epoch}
          onChoose={(layout) => current.setVideoLayout(layout)} />
      </Row>
      <PlaybackRows host={current} epoch={epoch} />
    </Group>
  );
}

function JavGroup({ host: current, tab, epoch }: GroupProps) {
  const settings = current.store.value;
  const save = () => current.store.save();
  return (
    <Group index={2} tab={tab}>
      <h4 data-settings-subheading="">ObraMostrar</h4>
      <Row title="PredeterminadoImágenes">
        <IconSwitch id="javImageSetting" name="jav-image" legend="PredeterminadoImágenes" options={JAV_IMAGE_OPTIONS}
          value={settings.javImage} attr="data-jav-image-choice" variant="javimageswitch" text epoch={epoch}
          onChoose={(choice) => { settings.javImage = normalizeJavImage(choice); save(); current.changed('javImage') }} />
      </Row>
      <label data-setting-row=""><span><b>FusionarVolumenyVersión</b></span>
        <input type="checkbox" id="groupCollapseSetting" data-toggle="" role="switch" checked={settings.groupCollapse}
          onChange={(event) => { settings.groupCollapse = event.target.checked; save(); current.changed('groupCollapse') }} />
      </label>
      <h4 data-settings-subheading="">Nuevas obrasMostrar</h4>
      <ToggleRow id="feedAutoScrollSetting" title="Nuevas obrasAutomático滚动" checked={settings.feedAutoScroll}
        onToggle={(on) => { settings.feedAutoScroll = on; save(); current.changed('feedAutoScroll') }} />
      {FEED_COMPILATIONS.map(([id, key, label, title]) => (
        <CompilationToggle key={id} host={current} id={id} settingKey={key} label={label} title={title} />
      ))}
    </Group>
  );
}
/* 合集开关由服务端判, Lista, no读数 y 补Portada排队都跟着它, 所以先存到服务端再pesado画; 往返期间开关
   停EnNuevoUbicación, 挂忙态, Fallo退回Original.  */
function CompilationToggle({ host: current, id, settingKey, label, title }: {
  host: SettingsPanelHost; id: string; settingKey: CompilationKey; label: string; title: string;
}) {
  const save = useSaveSettings();
  const [pending, setPending] = useState<boolean | null>(null);
  const box = useRef<HTMLInputElement | null>(null);
  const settings: PanelSettings = current.store.value;
  const toggle = (on: boolean) => {
    setPending(on);
    setActionBusy(box.current);
    save.mutate({ [settingKey]: on }, {
      onSuccess: (saved) => {
        settings[settingKey] = saved[settingKey] === true;
        current.store.save();
        current.changed('feedCompilations');
        current.receipt(on ? `Nuevas obrasYaColapsar${label}` : `Nuevas obrasYa列出${label}`);
      },
      onError: (error) => current.failure(`Guardar${label}开关`, error),
      onSettled: () => { setPending(null); setActionBusy(box.current, false) },
    });
  };
  return (
    <label data-setting-row="">
      <span><b>{title}</b></span>
      <input data-toggle="" type="checkbox" id={id} role="switch" ref={box}
        checked={pending ?? settings[settingKey]} onChange={(event) => toggle(event.target.checked)} />
    </label>
  );
}

function PlaybackRows({ host: current, epoch }: Omit<GroupProps, 'tab'>) {
  const settings = current.store.value;
  const save = () => current.store.save();
  return (
    <>
      <Row title="Latencia de vista previa al pasar el ratón">
        <div id="hoverDelaySetting">
          <NumberSetting key={epoch} id="hoverDelaySetting" label="Latencia de vista previa al pasar el ratón" value={settings.hoverDelaySeconds}
            onApply={(value) => {
              settings.hoverDelaySeconds = boundedPreference(value, 0, 60, 5); save(); current.changed('hoverDelay');
            }} />
        </div>
      </Row>
      <ToggleRow id="detailAutoplaySetting" title="Abrir detallesReproducción automática" checked={settings.detailAutoplay}
        onToggle={(on) => { settings.detailAutoplay = on; save() }} />
      <ToggleRow id="miniplayerSetting" title="离开Detallesposteriorpequeño窗Reproducir" checked={settings.miniplayer}
        onToggle={(on) => { settings.miniplayer = on; save(); current.changed('miniplayer') }} />
      <Row title="Avance rápido / Retroceso rápido步largo">
        <div id="seekSecondsSetting">
          <NumberSetting key={epoch} id="seekSecondsSetting" label="Avance rápido / Retroceso rápido" value={settings.seekSeconds}
            onApply={(value) => { settings.seekSeconds = value || 10; save(); current.changed('seekSeconds') }} />
        </div>
      </Row>
    </>
  );
}

function SearchHistoryRow({ host: current, epoch }: { host: SettingsPanelHost; epoch: number }) {
  const settings = current.store.value;
  const save = useSaveSettings();
  /* 数跟着DatosBiblioteca走(`/api/settings`), 所ConAcceder端ver到同uno数; 本地eseSoloes镜像.  */
  return (
    <Row title="Historial de búsquedaCantidad">
      <div id="searchHistoryLimitSetting">
        <NumberSetting key={epoch} id="searchHistoryLimitSetting" label="Historial de búsqueda" value={settings.searchHistoryLimit}
          onApply={(value) => {
            settings.searchHistoryLimit = boundedPreference(value, 0, 50, 10);
            current.store.save();
            current.changed('searchHistoryLimit');
            save.mutate({ searchHistoryLimit: settings.searchHistoryLimit }, { onError: () => {} });
          }} />
      </div>
    </Row>
  );
}
