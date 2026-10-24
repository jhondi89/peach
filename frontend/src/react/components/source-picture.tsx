import { useQuery } from '@tanstack/react-query';
import { coverUrl } from '@peach/card-art';
import { apiGet } from '../../api';
import { Button } from '@/components/base/buttons/button';
import { Note } from './note';
import { busyProps } from '../settings/use-action';
import type { JavDetail } from '../jav-detail/jav-detail';

/** 来源图片复用查询及持久图片缓存。 */
export function SourcePicture({ item, image, thumbnail = false }: {
  item: Pick<JavDetail, 'code' | 'has_cover' | 'source_image' | 'cover_url' | 'cover_version'>;
  image: string; thumbnail?: boolean;
}) {
  const local = image === 'cover' && item.has_cover;
  const remote = !local && (image !== 'cover' || item.source_image);
  const result = useQuery({ queryKey: ['jav-image', item.code, image], enabled: remote, staleTime: Infinity,
    queryFn: ({ signal }) => apiGet<{ ok: boolean; image: string; message?: string }>(
      `/api/jav/image?code=${encodeURIComponent(item.code)}&image=${image}`, signal) });
  const src = local ? coverUrl(item, true) : result.data?.image || (image === 'cover' && !item.source_image ? item.cover_url : '');
  if (src) return <img data-jav-picture={thumbnail ? undefined : ''} src={src} alt={thumbnail ? '' : image === 'cover' ? `Portada de ${item.code}` : `Vista previa ${Number(image) + 1} de ${item.code}`} referrerPolicy="no-referrer" />;
  if (thumbnail) return remote && result.isPending ? <span className="relative block h-full w-full skeleton-sheen" aria-label="Cargando vista previa" /> : <span>No se obtuvo la vista previa</span>;
  if (remote && result.isPending) return <div data-jav-picture-wait="" data-skeleton="image" role="status" aria-label="Cargando imagen"><span className="relative skeleton-sheen" /></div>;
  return <div data-jav-picture-wait=""><Note tone="neutral" action={remote ? <Button variant="secondary" {...busyProps(result.isFetching)} onClick={() => { void result.refetch() }}>Reintentar</Button> : undefined}>{result.data?.message || (result.error ? 'No se obtuvo la imagen' : 'No se obtuvo la portada')}</Note></div>;
}
