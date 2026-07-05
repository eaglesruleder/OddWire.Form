import { StripLayout } from '../_components/layout';

export function SettingsPage()
{
    return (
        <StripLayout left="←" leftLink="/" title="Settings">
            <p className="text-muted">Settings and the DB Manager are not part of the MVP yet.</p>
        </StripLayout>
        );
}
