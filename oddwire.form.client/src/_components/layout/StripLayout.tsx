import type { ReactNode } from 'react';

// Simple portrait strip with a headered masthead. The strip width/borders live on #root (layout.css);
// this just supplies the header band + padded body a page drops its content into.
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
