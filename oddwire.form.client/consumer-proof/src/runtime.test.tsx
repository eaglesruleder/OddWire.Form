import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

const { ContextsProvider, HostedFormSurface } = await import('oddwire.form.client');

import 'oddwire.form.client/styles.css';

const MONSTER_CARD_FORM_ID = '44444444-4444-4444-8444-444444444444';

it('initialises and renders a hosted bundled Monster Reference Card from the packed runtime', async () =>
{
    render(
        <ContextsProvider>
            <HostedFormSurface
                formId={MONSTER_CARD_FORM_ID}
                instance={{
                    formId: MONSTER_CARD_FORM_ID,
                    instanceId: 'consumer-proof:hosted-monster',
                    controls: [{ param: 'name', value: 'Villager' }]
                    }}
            />
        </ContextsProvider>
        );

    expect(await screen.findByRole('heading', { name: 'Monster Reference Card' })).toBeInTheDocument();
    expect(await screen.findByText('Villager')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});
