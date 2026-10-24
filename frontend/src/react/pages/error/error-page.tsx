/* ErrorPágina: Explorar dispositivo直continuarAbrir地址撞arriba HTTP Error时给人vereseunopágina. 
 *
 * 服务端Solo给Estado码(`data-status`)yya换成en proceso文Descripción(`data-detail`); Título按Estado码取, 404 No显示
 * Descripción, 按钮回primeropágina. EtiquetapáginaTítulo跟着Título走.  */
import { useEffect } from 'react';

import { ButtonLink } from '@/components/base/buttons/button';

import { AuthCard } from '../auth-card';
import type { PageData } from '../page-data';

const TITLES: Readonly<Record<string, string>> = {
  403: 'No se puede abrir aquí',
  404: '404',
  409: 'No se puede hacer esto ahora',
};

export function errorTitle(status: string | undefined): string {
  return TITLES[status ?? ''] ?? 'Algo salió mal';
}

export function ErrorPage({ data }: { data: PageData }) {
  const title = errorTitle(data.status);
  useEffect(() => {
    document.title = `Peach · ${title}`;
  }, [title]);
  return (
    <AuthCard title={title} lede={data.status === '404' ? undefined : data.detail}>
      <ButtonLink href="/" className="self-start">VolverInicio</ButtonLink>
    </AuthCard>
  );
}
