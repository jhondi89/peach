import { Dialog, type DialogProps } from 'react-aria-components';
import { useMovingSurface } from './use-moving-surface';

/** corto菜单Pasar el ratón面; 空隙y禁用项No映射到其他动作.  */
export function MenuDialog(props: DialogProps) {
  const ref = useMovingSurface('hover');
  return <Dialog {...props} ref={ref} />;
}
