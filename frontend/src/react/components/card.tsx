/* Board 卡面. SoloConesteuno出处. 
 *
 * antiguo样表en la卡分两族, 按página各Con各基线, No能uno律画成同uno: 
 *
 * - **Introduce充**: `background:var(--ground);border:0`, 圆角 16px(Imagen表卡 20px), 底abajo压uno层
 *   1px continuar触阴影. 读数卡 `.metricstrip>button`, 口味读数 `.tastesummary`, 面板
 *   `.insightpanel`, 分区 `.followmanage .fmain>.fsec`, Imagen表卡 `.board-radial-card` 都esesteuno族. 
 *   `--ground` continuar就es `--color-background-secondary-default`(`web/board.css`  `:root`
 *   映射), 阴影取arriba游同uno用途 `--shadow-card`("1px contact shadow used on white cards
 *   sitting on the secondary background"). 
 * - **描边**: `border:1px solid var(--line-soft);background:var(--color-background-primary-default)`, 
 *   复核página `body[data-surface="/review"] .reviewitem` esesteuno族—卡浮Enpágina面底arriba, 靠uno
 *   发丝线收边, No靠换底色. 
 *
 * 另Conuno批es"Introduce充再加uno描边": 活动página `.cleanupfieldset` es `--ground` 底加 `--line`, 
 * alto清版 `.qualityitem` es `--ground` 底加更淡 `--line-soft`. 所以描边esIntroduce充之en launo档
 * puedeOpciones(`bordered`), NoesIntroduce充对立面. 
 *
 * 迁移时Por página各拼uno串 `rounded-2xl border border-separator-border`, 同uno卡片EndiezArchivodentro
 * largo出dosdiez描边空心壳, página面Completo体掉uno层底色—卡面收Enaquí就esComoNo再发生este件事.  */

/** 圆角: 读数卡, 面板, 分区都es 16px; Imagen表卡grandeuno档 20px,  y antiguo `.board-radial-card` uno致; 
 *  描边卡es Board ese档No浮起表面 `--surface-radius`(14px), `outlined` Predeterminado取它.  */
export type CardRadius = 'default' | 'chart' | 'surface' | 'plain';

/** Relleno: `none` 交给卡interior自己头, 体, 脚各自排; `default` esantiguoImagen表卡y面板体 20px.  */
export type CardPadding = 'none' | 'default';

/** 卡面本身. 哪uno档由eseunopágina基线 CSS 说算, No由"ver起来更bien"说算. 
 *
 *  - `filled`: `--ground` Introduce充, Sin描边. Board Gestionar区主力卡. 
 *  - `outlined`: `--color-background-primary-default` 底加uno `--line-soft`. 复核páginaEntrada卡. 
 *  - `raised`: primary 底, Sin描边. 卡arriba再浮uno层(关注Gestionardentro按作者Agruparese卡).  */
export type CardVariant = 'filled' | 'outlined' | 'raised';

export type CardOptions = {
  variant?: CardVariant;
  radius?: CardRadius;
  padding?: CardPadding;
  /** 卡片本身puede点(读数卡兼página签, 来源卡): 补Pasar el ratónIntroduce充, 焦点环y光标.  */
  interactive?: boolean;
  /** 卡片带互斥选en proceso态: 选en proceso时换成浮层eseuno档面, 收掉continuar触阴影, 最arriba层压uno圈 2px 焦点环色描边.  */
  selectable?: boolean;
  /** Introduce充之arriba另加ese描边: 活动página Fieldset 用 `--line`, alto清版Entrada用 `--line-soft`. 
   *  `outlined` 自带描边, No必再给.  */
  bordered?: 'line' | 'soft';
  className?: string;
};

const FACE = 'min-w-0';

const VARIANT: Record<CardVariant, string> = {
  filled: 'bg-background-secondary-default',
  outlined: 'border border-separator-border bg-background-primary-default',
  raised: 'bg-background-primary-default',
};

/* 圆角y阴影esuno件事: antiguo样表dentroCon阴影SoloCon读数卡eseuno档(`0 1px 2px #00000008`), 
 * Imagen表卡 `.board-radial-card` / `.board-heat-card` / `.board-sankey-card` 都es净面.  */
const RADIUS: Record<CardRadius, string> = {
  default: 'rounded-2xl shadow-card',
  chart: 'rounded-2-5xl',
  surface: 'rounded-surface',
  /* DatosGestionareseuno排净面读数卡(antiguo `.board-plain-stat`): 同样 16px, peroNo压continuar触阴影.  */
  plain: 'rounded-2xl',
};

const BORDER = {
  line: 'border border-border-button-default',
  soft: 'border border-separator-border',
};

const PADDING: Record<CardPadding, string> = {
  none: '',
  default: 'p-5',
};

/* Pasar el ratónSolo抬Introduce充, 选en proceso时No抬: antiguoRegladentro选en proceso态ese排EnPasar el ratónposterior面, 压着它. 工具类先posterior由
 * Tailwind 自己排, Noes写顺序, 所以"没选en proceso"写进变体dentro, No指望顺序.  */
const INTERACTIVE = 'cursor-pointer outline-none not-data-selected:hover:bg-card-hover'
  + ' focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-3';

/* 选en procesoeseuno圈画En `::after` arriba, 压En最arriba层, No用 inset  box-shadow: interior阴影画En子元素底abajo, 
 * 读数卡脚注带uno铺底色, 环abajomedio截就被盖掉, Solo剩arriba面tres边. antiguo
 * `.metricstrip>button[aria-selected=true]::after` 就esuno层 2px 描边覆盖层, 圆角跟卡走.  */
const SELECTABLE = 'relative data-selected:bg-background-primary-default data-selected:shadow-none'
  + ' data-selected:after:pointer-events-none data-selected:after:absolute data-selected:after:inset-0'
  + ' data-selected:after:z-1 data-selected:after:rounded-[inherit]'
  + ' data-selected:after:border-2 data-selected:after:border-border-focus-ring';

/** 卡面类名. 宿主puede能es `section`, `li`, React Aria  `Tab` 或 `Modal`, 所以Solo给类名.  */
export function cardClass(options: CardOptions = {}) {
  const {
    variant = 'filled', padding = 'default', interactive, selectable, bordered, className,
  } = options;
  /* 圆角跟着变体走: Introduce充eseuno族es 16px 加uno层continuar触阴影, 描边eseuno族es 14px 净面. 
     antiguo样表dentroeste两件事本来就绑Enuno起, 拆开写Solo会让调用方每次都要记住配哪uno.  */
  const radius = options.radius ?? (variant === 'outlined' ? 'surface' : 'default');
  return [
    FACE,
    VARIANT[variant],
    RADIUS[radius],
    PADDING[padding],
    bordered ? BORDER[bordered] : '',
    interactive ? INTERACTIVE : '',
    selectable ? SELECTABLE : '',
    className ?? '',
  ].filter(Boolean).join(' ');
}
