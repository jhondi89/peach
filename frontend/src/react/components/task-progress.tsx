import { cardClass } from './card';
import { LoadingDots } from './loading-dots';
import { Progress } from './progress';

/** IndependienteTarea带框; 卡片或Resultado分区interiorTarea复用所En容Dispositivo.  */
export function TaskProgress({ label, value = 0, total, embedded = false }: {
  label: string; value?: number; total?: number | null; embedded?: boolean;
}) {
  return (
    <div data-task-progress className={embedded ? 'flex flex-col gap-1.5' : cardClass({
      variant: 'outlined', padding: 'none', className: 'flex flex-col gap-1.5 px-4 py-3.5',
    })}>
      {total && total > 0 ? <>
        <Progress label={label} value={value} max={total} />
        <p className="text-caption-1-regular text-text-secondary wrap-anywhere">{label}</p>
      </> : <LoadingDots label={label} />}
    </div>
  );
}
