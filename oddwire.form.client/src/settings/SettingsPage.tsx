import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

import { StripLayout } from '../_components/layout';

export function SettingsPage()
{
    const navigate = useNavigate();

    return (
        <StripLayout title="Settings">
            <p className="text-muted">Settings and the DB Manager are not part of the MVP yet.</p>
            <Button variant="link" onClick={() => navigate('/')}>← Back to forms</Button>
        </StripLayout>
        );
}
