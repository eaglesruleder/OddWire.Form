import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import type { FormContextValue, InstanceContextValue, FormImageContextValue } from '../_context';
import type { FormIndexEntry, InstanceIndexEntry } from '../_context';
import { FormContext, InstanceContext, FormImageContext } from '../_context';

import { LandingPage } from './LandingPage';

describe('LandingPage read-only forms', () =>
{
    it('hides the New action for read-only forms', () =>
    {
        renderLanding({
            forms: [{ formId: 'guide', label: 'Guide', readonly: true }],
            instances: { guide: [] },
        });

        expect(screen.queryByRole('link', { name: 'New' })).not.toBeInTheDocument();
    });

    it('opens a read-only form directly when it has one instance', () =>
    {
        renderLanding({
            forms: [{ formId: 'guide', label: 'Guide', readonly: true }],
            instances: { guide: [instance('inst-1')] },
        });

        fireEvent.click(screen.getByRole('button', { name: /Guide/ }));

        expect(screen.getByTestId('location')).toHaveTextContent('/form/guide/inst-1');
    });

    it('lists instances for a read-only form when it has multiple instances', () =>
    {
        renderLanding({
            forms: [
                { formId: 'guide', label: 'Guide', readonly: true },
                { formId: 'other', label: 'Other' },
            ],
            instances: { guide: [instance('inst-1', 'One'), instance('inst-2', 'Two')], other: [] },
        });

        fireEvent.click(screen.getByRole('button', { name: /Guide/ }));

        expect(screen.getByText('One')).toBeInTheDocument();
        expect(screen.getByText('Two')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: '+ New instance' })).not.toBeInTheDocument();
    });

    it('auto-opens a requested read-only form with one instance', async () =>
    {
        renderLanding({
            initialEntries: ['/?FormID=guide'],
            forms: [{ formId: 'guide', label: 'Guide', readonly: true }],
            instances: { guide: [instance('inst-1')] },
        });

        await waitFor(() =>
            expect(screen.getByTestId('location')).toHaveTextContent('/form/guide/inst-1'));
    });
});

function renderLanding({ forms, instances, initialEntries = ['/'] }: {
    forms: FormIndexEntry[];
    instances: Record<string, InstanceIndexEntry[]>;
    initialEntries?: string[];
})
{
    const formContext: FormContextValue = {
        getForm: vi.fn(),
        list: () => forms,
        saveForm: vi.fn(),
        deleteForm: vi.fn(),
    };

    const instanceContext: InstanceContextValue = {
        getInstance: vi.fn(),
        list: formId => instances[formId] ?? [],
        save: vi.fn(),
        deleteInstance: vi.fn(),
        deleteFormInstances: vi.fn(),
    };

    const imageContext: FormImageContextValue = {
        saveImage: vi.fn(),
        getImage: vi.fn(),
        deleteImage: vi.fn(),
        imagesFor: vi.fn(async () => []),
        getObjectUrl: vi.fn(),
        revoke: vi.fn(),
    };

    render(
        <MemoryRouter initialEntries={initialEntries}>
            <FormContext.Provider value={formContext}>
                <InstanceContext.Provider value={instanceContext}>
                    <FormImageContext.Provider value={imageContext}>
                        <LandingPage />
                        <LocationProbe />
                    </FormImageContext.Provider>
                </InstanceContext.Provider>
            </FormContext.Provider>
        </MemoryRouter>
    );
}

function LocationProbe()
{
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
}

function instance(instanceId: string, title = 'Title'): InstanceIndexEntry
{
    return {
        instanceId,
        formId: 'guide',
        display: { title },
    };
}
