import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type StripLayoutProps = {
    title: string;
    left?: ReactNode;
    leftLink?: string;
    leftAction?: () => void;
    right?: ReactNode;
    rightLink?: string;
    children: ReactNode;
    };

export function StripLayout({ title, left, leftLink, leftAction, right, rightLink, children }: StripLayoutProps)
{
    return (
        <>
            <header className="strip-header">
                <div className="strip-side">{slot(left, leftLink, leftAction)}</div>
                <h1 className="strip-title">{title}</h1>
                <div className="strip-side end">{slot(right, rightLink)}</div>
            </header>
            <main className="strip-main">{children}</main>
        </>
        );
}

function slot(icon: ReactNode, link?: string, action?: () => void): ReactNode
{
    if (!icon)
        return null;

    if (action)
        return <button type="button" className="strip-btn" onClick={action}>{icon}</button>;

    return link
    ?   <Link to={link}>{icon}</Link>
    :   icon;
}
