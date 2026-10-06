import { render, screen } from '@testing-library/react';
import { ContextsProvider, FormSurface } from 'oddwire.form.client';

import 'oddwire.form.client/styles.css';

const MONSTER_CARD_FORM_ID = '44444444-4444-4444-8444-444444444444';

it('initialises and renders the bundled Monster Reference Card from the packed runtime', async () =>
{
    render(
        <ContextsProvider>
            <FormSurface formId={MONSTER_CARD_FORM_ID} />
        </ContextsProvider>
        );

    expect(await screen.findByRole('heading', { name: 'Monster Reference Card' })).toBeInTheDocument();
});
