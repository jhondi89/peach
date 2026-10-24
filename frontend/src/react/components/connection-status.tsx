import { StatusDot } from '@/components/base/badges/status-dot';
import { cx } from '@/utils/cx';
import './connection-status.css';

/** ConectarEstado使用圆点; TareaResultado y ConfiguraciónEstado使用 Chip.  */
export function ConnectionStatus({ online }: { online: boolean | undefined }) {
  return <span data-mount={online === true ? 'online' : online === false ? 'offline' : 'unknown'}
    className={cx('inline-flex items-center gap-1.5 whitespace-nowrap text-body-2-medium',
      online === true ? 'text-notification-success-foreground' : online === false ? 'text-text-error-primary' : 'text-text-secondary')}>
    <StatusDot color={online === undefined ? 'indigo' : 'green'} />
    {online === true ? 'En línea' : online === false ? 'Sin conexión' : 'No检测'}
  </span>;
}
