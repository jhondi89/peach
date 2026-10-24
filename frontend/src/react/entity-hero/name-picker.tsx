/* 名字derecha边eseabajo拉: Eneste实体yaCon写法dentro挑uno当统称, 或者添unoNuevo. 
 *
 * 统称由用户自己定. 同uno人EnBibliotecadentro常Conen proceso文, 日文, 罗马字几写法, 哪uno该顶EnTítuloarribaes他
 * 偏bien, DatosBibliotecadentroSin能推出答案字段. 菜单Solo列este实体名abajoyaCon写法: 换统称es换显示eseuno, 
 * Noes改名. esteabajo拉恒En, SoloConuno名字时也En—"她还叫过别"要Con入口, 而恰恰esSolo剩uno
 * 名字人最需要补. 添别名es另uno件事, 隔uno线摆Enúltimo尾. 
 *
 * 换统称写es `entity.canonical_name` este真相字段: Confirmar, 写回, 回执ypesado进esteunopágina都En壳dentro
 * (`actions.chooseName`), 勾SoloEn服务端换完, página面pesado画之posterior才挪. 
 *
 * 面板从按钮izquierda缘往derecha开: 往izquierda开话 260px 菜单越过名字压EnAvatararriba(用户报过). 面板ese身
 * 盒子取 BoardUI 菜单面(`MENU_POPOVER_SURFACE`, 同antiguo锚定菜单 `.popmenu`  16px 圆角, 
 * 10px Rellenoy投影), 菜单项几何写En `./entity-hero.css`.  */
import { useEffect, useRef, useState } from 'react';
import { Button, Menu, MenuItem, MenuSection, MenuTrigger, Popover, Separator } from 'react-aria-components';

import { MENU_POPOVER_SURFACE } from '@/components/base/dropdown/menu-styles';

import { Glyph } from './glyph';

export function NamePicker({ current, choices, onChoose, onAddAlias }: {
  current: string;
  choices: string[];
  onChoose(name: string): void;
  onAddAlias(): void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  /* title 给壳Sugerencia用(board-controls Solo认 [title]),  y antiguo资料卡eseuno样Pasar el ratón就出字. 
     react-aria  Button No收 title, 挂载posterior直continuar写到节点arriba; Sugerencia收起时会它放回来.  */
  useEffect(() => { toggle.current?.setAttribute('title', 'Nombre y alias') }, []);
  return (
    <MenuTrigger isOpen={open} onOpenChange={setOpen}>
      <Button ref={toggle} data-namepick-toggle="" aria-label="Nombre y alias">
        <Glyph name="chevron-down" />
      </Button>
      {/* 离按钮 8px: antiguo锚定菜单 wireAnchoredMenu 就es anchor.bottom + 8, 另两弹层也es 8.  */}
      <Popover placement="bottom start" offset={8} containerPadding={8} className={MENU_POPOVER_SURFACE}
        data-namepick-menu="">
        <Menu aria-label="Nombre y alias" data-namepick-list="">
          <MenuSection selectionMode="single" disallowEmptySelection selectedKeys={[current]}
            onSelectionChange={(keys) => {
              const chosen = [...(keys as Set<string>)][0];
              if (chosen && chosen !== current) onChoose(chosen);
            }}>
            {choices.map((option) => (
              <MenuItem key={option} id={option} textValue={option} data-namepick-name={option}>
                <Glyph name="check" /><span>{option}</span>
              </MenuItem>
            ))}
          </MenuSection>
          <Separator data-namepick-rule="" />
          <MenuSection>
            <MenuItem id="alias" textValue="AñadirAlias" data-namepick-alias="" onAction={onAddAlias}>
              <Glyph name="plus" /><span>Añadir alias...</span>
            </MenuItem>
          </MenuSection>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
