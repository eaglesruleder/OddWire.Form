import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';

import { StripLayout } from '../../_components/layout';

export type Collision = { key: string; label: string };

// Intent: resolve key collisions (from import or add-new) — dups ticked by default = import & overwrite; untick = leave as-is.
// Header: ← cancel (left) / ✓ accept (right). onAccept hands back the set of keys to overwrite.
type DupResolvePopupProps = {
    collisions: Collision[];
    onAccept: (overwriteKeys: Set<string>) => void;
    onCancel: () => void;
    };

export function DupResolvePopup({ collisions, onAccept, onCancel }: DupResolvePopupProps)
{
    const [ticked, setTicked] = useState<Set<string>>(() => new Set(collisions.map(collision => collision.key)));

    const toggle = (key: string) =>
        setTicked(prev =>
        {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });

    const cancel = <button type="button" className="strip-btn" onClick={onCancel} title="Cancel">←</button>;
    const accept = <button type="button" className="strip-btn" onClick={() => onAccept(ticked)} title="Overwrite ticked">✓</button>;

    return (
        <Modal show onHide={onCancel} centered dialogClassName="popup-dialog" contentClassName="popup-content">
            <StripLayout title="Duplicate keys" left={cancel} right={accept}>
                <p className="text-muted mb-3">Ticked rows are overwritten; unticked are left as-is.</p>
                <div className="flex column gap">
                    {collisions.map(collision =>
                    <label key={collision.key} className="flex items-center gap">
                        <input type="checkbox" checked={ticked.has(collision.key)} onChange={() => toggle(collision.key)} />
                        <span className="fill">{collision.label}</span>
                    </label>
                    )}
                </div>
            </StripLayout>
        </Modal>
        );
}
