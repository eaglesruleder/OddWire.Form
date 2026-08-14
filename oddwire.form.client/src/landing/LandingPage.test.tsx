import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import type { FormContextValue, InstanceContextValue, FormImageContextValue, PdfTemplateContextValue } from '../_context';
import type { FormIndexEntry, InstanceIndexEntry } from '../_context';
import { FormContext, InstanceContext, FormImageContext, PdfTemplateContext } from '../_context';

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
        expect(screen.getByRole('button', { name: 'Open readonly form Guide' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete Guide' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Open Guide' })).not.toHaveTextContent('0');
    });

    it('opens a read-only form directly when it has one instance', () =>
    {
        renderLanding({
            forms: [{ formId: 'guide', label: 'Guide', readonly: true }],
            instances: { guide: [instance('inst-1')] },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Open Guide' }));

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

        fireEvent.click(screen.getByRole('button', { name: 'Open Guide' }));

        expect(screen.getByText('One')).toBeInTheDocument();
        expect(screen.getByText('Two')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: '+ New instance' })).not.toBeInTheDocument();
    });

    it('expands a requested read-only form with one instance without redirecting', () =>
    {
        renderLanding({
            initialEntries: ['/?FormID=guide'],
            forms: [{ formId: 'guide', label: 'Guide', readonly: true }],
            instances: { guide: [instance('inst-1')] },
        });

        expect(screen.getByTestId('location')).toHaveTextContent('/');
        expect(screen.getByText('Title')).toBeInTheDocument();
    });
});

describe('LandingPage deletes', () =>
{
    it('lets selected instances be checked and deleted from an expanded form', async () =>
    {
        const { instanceContext } = renderLanding({
            forms: [{ formId: 'guide', label: 'Guide' }],
            instances: { guide: [instance('inst-1', 'One'), instance('inst-2', 'Two')] },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Delete Guide' }));
        fireEvent.click(screen.getByRole('button', { name: 'Delete instances' }));

        fireEvent.click(screen.getByRole('checkbox', { name: 'Select One' }));

        fireEvent.click(screen.getByRole('button', { name: 'Delete selected instances' }));

        await waitFor(() =>
            expect(instanceContext.deleteInstance).toHaveBeenCalledWith('inst-1'));
        expect(instanceContext.deleteInstance).not.toHaveBeenCalledWith('inst-2');
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

    const pdfTemplateContext: PdfTemplateContextValue = {
        getTemplate: vi.fn(),
        saveTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
    };

    render(
        <MemoryRouter initialEntries={initialEntries}>
            <FormContext.Provider value={formContext}>
                <InstanceContext.Provider value={instanceContext}>
                    <PdfTemplateContext.Provider value={pdfTemplateContext}>
                        <FormImageContext.Provider value={imageContext}>
                            <LandingPage />
                            <LocationProbe />
                        </FormImageContext.Provider>
                    </PdfTemplateContext.Provider>
                </InstanceContext.Provider>
            </FormContext.Provider>
        </MemoryRouter>
    );

    return { formContext, instanceContext, imageContext, pdfTemplateContext };
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
