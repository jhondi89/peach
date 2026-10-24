/* 媒体BibliotecaImagen标: 触发Clave显示当anterior字形, 点开esunosiete列Cuadrícula单选面板, 按"应用"才提交. 
 *
 * Registrarse表dentroSinCuadrícula单选弹出面板, 用 React Aria  `Popover`, `Dialog`, `RadioGroup` 组合, 
 * 面板exterior观取 BoardUI `menu-styles.ts`. 取值es雪碧Imagenen la字形名, 服务端按
 * `peach.media_libraries.LIBRARY_ICONS` 校验.  */
import { useRef, useState } from 'react';
import { Dialog, Heading, Popover, Radio, RadioGroup } from 'react-aria-components';
import { MEDIA_SOURCE_ICONS } from '@peach/legacy/ui';

import { Button } from '@/components/base/buttons/button';
import { MENU_POPOVER_SURFACE } from '@/components/base/dropdown/menu-styles';

import { SourceMark } from './section';

/* uno行siete, seis行排完. No.unoes"No另选": 网盘Biblioteca自动用网盘标识, 本地RutaSinpuedeReconocer
   来源, 就esPredeterminadoese磁盘. 其余按题材成组: 身体y情欲, 身y装扮, 场景y情境, 媒介y归档.  */
export const LIBRARY_ICON_CHOICES = [
  ['', 'Reconocimiento automático'], ['hard-drive', 'Disco'], ['database', 'DetallesBiblioteca'], ['heart', 'Enamorado'], ['heart-hand', 'Íntimo'], ['flame', 'Apasionado'], ['cherry', 'Rojo cereza'],
  ['lollipop', 'Cariño'], ['candy', 'Caramelo'], ['banana', 'Plátano'], ['droplets', 'Húmedo'], ['venus', 'Femenino'], ['mars', 'Masculino'], ['venus-and-mars', 'Pareja'],
  ['gem', 'Selección especial'], ['crown', 'Dominatrix'], ['ribbon', 'Cinta'], ['shirt', 'Uniforme'], ['graduation-cap', 'Estudiante'], ['stethoscope', 'Enfermera'], ['glasses', 'Gafas'],
  ['footprints', 'Historial de visitas'], ['hand', 'Manos'], ['flower', 'Flor'], ['venetian-mask', 'Rol扮演'], ['rabbit', 'Conejita'], ['paw-print', 'Orejas de animal'], ['dumbbell', 'Fitness'],
  ['bed-double', 'Dormitorio'], ['bath', 'Baño'], ['key-round', 'Privado'], ['wine', 'Levemente ebrio'], ['cigarette', 'Gris humo'], ['moon', 'Noche'], ['sparkles', 'Fantasía'],
  ['camera', 'Fotobook'], ['video', 'Película'], ['film', 'Cine'], ['image', 'Álbum de imágenes'], ['gamepad-2', 'Juego'], ['star', 'Añadir a favoritos'], ['tags', 'Tema'],
] as const;

/** No另选时字形y说法: 网盘Biblioteca跟着来源走(115, PikPak 站标), 本地RutaSin什么puedeReconocer, 就esPredeterminado磁盘.  */
export function libraryAutoChoice(kind: string): [string, string] {
  const mark = kind !== 'local' ? MEDIA_SOURCE_ICONS[kind] : '';
  return mark ? [mark, 'Reconocimiento automático'] : ['hard-drive', 'Predeterminado'];
}

/** "No另选"En单选组en la取值. 存abajo来es空串, 而空串做单选值时 React Aria 当作Sin选en proceso.  */
const AUTO = 'auto';

export function LibraryIconPicker({ value, label, kind = 'local', onChange }: {
  value: string; label: string; kind?: string; onChange(value: string): void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [autoMark, autoLabel] = libraryAutoChoice(kind);
  const nameOf = (key: string) => (key && LIBRARY_ICON_CHOICES.find(([choice]) => choice === key)?.[1]) || autoLabel;

  return (
    <>
      <Button ref={trigger} variant="secondary" className="self-start" aria-label={label} aria-haspopup="dialog"
        aria-expanded={open} onClick={() => { setDraft(value); setOpen(true); }}>
        <span data-icon-choice className="flex items-center gap-2"><SourceMark mark={value || autoMark} />{nameOf(value)}</span>
      </Button>
      <Popover triggerRef={trigger} isOpen={open} onOpenChange={setOpen} placement="bottom start" offset={4}
        className={MENU_POPOVER_SURFACE}>
        <Dialog aria-label={`${label}OpcionalImagen标`} className="flex w-72 flex-col gap-3 outline-none">
          <Heading slot="title" className="px-1 text-body-medium text-text-primary">SeleccionarBiblioteca de mediosImagen标</Heading>
          {/* 格子dentroSolo放Imagen标, 名字走 aria-label: 带着字话 42 候选要排diez几行.  */}
          <RadioGroup aria-label="OpcionalImagen标" value={draft || AUTO} onChange={(next) => setDraft(next === AUTO ? '' : next)}
            className="inline-grid grid-cols-7 gap-1">
            {LIBRARY_ICON_CHOICES.map(([key, name]) => (
              <Radio key={key || AUTO} value={key || AUTO} aria-label={key ? name : autoLabel}
                className="flex h-10 cursor-pointer items-center justify-center rounded-lg text-foreground-icon-secondary outline-none hover:bg-dropdown-item-hover-background focus-visible:ring-2 focus-visible:ring-border-focus-ring data-selected:bg-dropdown-item-hover-background data-selected:text-text-primary">
                <SourceMark mark={key || autoMark} />
              </Radio>
            ))}
          </RadioGroup>
          <div className="flex justify-end gap-2 border-t border-separator-border pt-2.5">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button disabled={draft === value} onClick={() => { onChange(draft); setOpen(false); }}>Aplicar</Button>
          </div>
        </Dialog>
      </Popover>
    </>
  );
}
