import type { ReactNode } from 'react';

type StripLayoutProps = {
  title: string;
  children: ReactNode;
};

export function StripLayout({ title, children }: StripLayoutProps) {
  return (
    <>
      <header className="strip-header">
        <h1>{title}</h1>
      </header>
      <main className="strip-main">{children}</main>
    </>
  );
}
