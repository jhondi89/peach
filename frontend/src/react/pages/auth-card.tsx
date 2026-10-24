/* Independientepágina面exterior框: página面底色arriba居en procesouno描边卡, 卡头es站标, Título y puede选uno句引言. 
 *
 * Registrarse表dentroSin Auth Card, 用 BoardUI token 组合, 分层同ConfiguraciónpáginaConfiguración区: Completopágina `background-full`
 * (由 `pages.css` 落En body arriba), 卡面 `background-secondary-default` 加uno `separator-border`, 
 * 卡en laIntroducir框y分段es tertiary, Archivocarpeta行y次级按钮es primary, profundosuperficial两色abajo都比卡面亮uno档. 
 * 24px 圆角, estrecho屏收Relleno. 
 * `busy` 时卡arriba写 `aria-busy`, 题目还没取回来.  */
import type { ReactNode } from 'react';

export function AuthCard({ title, lede, busy = false, children }: {
  title: string;
  lede?: string;
  busy?: boolean;
  children?: ReactNode;
}) {
  return (
    <main className="flex justify-center px-6 py-12 max-sm:px-4 max-sm:py-6">
      <section aria-labelledby="auth-card-title" aria-busy={busy || undefined}
        className="flex w-full max-w-140 flex-col gap-6 rounded-3xl border border-separator-border bg-background-secondary-default p-8 max-sm:p-5">
        <header className="flex flex-col gap-1">
          <img src="/peach-logo.png" alt="" width={40} height={40} className="mb-4 size-10" />
          <h1 id="auth-card-title" className="text-title-2-medium text-text-primary">{title}</h1>
          {lede ? <p className="whitespace-pre-line text-body-2-regular text-text-secondary wrap-anywhere">{lede}</p> : null}
        </header>
        {children}
      </section>
    </main>
  );
}

/** 卡en launo组: arriba面uno分隔线, 24px Deja白. No.uno组紧跟卡头, No画线.  */
export function CardGroup({ first = false, labelledBy, children }: {
  first?: boolean;
  labelledBy?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={labelledBy}
      className={first ? 'flex flex-col gap-4' : 'flex flex-col gap-4 border-t border-separator-border pt-6'}>
      {children}
    </section>
  );
}

/** uno级AgruparTítulo.  */
export function GroupTitle({ id, children }: { id?: string; children: ReactNode }) {
  return <h2 id={id} className="text-body-semibold text-text-primary">{children}</h2>;
}
