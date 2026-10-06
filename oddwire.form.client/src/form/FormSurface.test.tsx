import { render, screen } from '@testing-library/react';

import type { FormContextValue, FormImageContextValue, InstanceContextValue, LookupContextValue, PdfTemplateContextValue } from '../_context';
import { FormContext, FormImageContext, InstanceContext, LookupContext, PdfTemplateContext } from '../_context';
import { FormSurface, HostedFormSurface } from './FormPage';

const formContext: FormContextValue = {
    getForm: async formId => ({ formId, label: 'Embedded Form', controls: [] }),
    list: () => [],
    saveForm: async () => 'form',
    deleteForm: async () => undefined
    };

const instanceContext: InstanceContextValue = {
    getInstance: async () => undefined,
    list: () => [],
    save: async () => 'instance',
    deleteInstance: async () => undefined,
    deleteFormInstances: async () => undefined
    };

const lookupContext: LookupContextValue = {
    get: () => ({}),
    listTables: () => [],
    getTable: () => undefined,
    saveTable: async () => undefined,
    deleteTable: async () => undefined,
    importRows: async () => undefined
    };

const imageContext: FormImageContextValue = {
    saveImage: async () => undefined,
    getImage: async () => undefined,
    deleteImage: async () => undefined,
    imagesFor: async () => [],
    getObjectUrl: async () => undefined,
    revoke: () => undefined
    };

const templateContext: PdfTemplateContextValue = {
    getTemplate: async () => undefined,
    saveTemplate: async () => undefined,
    deleteTemplate: async () => undefined
    };

const hostedFormContext: FormContextValue = {
    ...formContext,
    getForm: async formId =>
        formId === 'hosted-form'
        ?   { formId, label: 'Hosted Form', controls: [{ type: 'text', param: 'name', label: 'Name' }] }
        :   undefined
    };

const hostedInstanceContext: InstanceContextValue = {
    ...instanceContext,
    // Hosted mode must never ask the browser-owned store for its host snapshot.
    getInstance: async () => { throw new Error('Hosted rendering must not read InstanceContext'); },
    save: async () => { throw new Error('Hosted rendering must not save InstanceContext'); }
    };

function hostedSurface(instance: { formId?: string; instanceId?: string; controls: { param: string; value: string }[] })
{
    return (
        <FormContext.Provider value={hostedFormContext}>
            <InstanceContext.Provider value={hostedInstanceContext}>
                <LookupContext.Provider value={lookupContext}>
                    <PdfTemplateContext.Provider value={templateContext}>
                        <FormImageContext.Provider value={imageContext}>
                            <HostedFormSurface formId="hosted-form" instance={instance} />
                        </FormImageContext.Provider>
                    </PdfTemplateContext.Provider>
                </LookupContext.Provider>
            </InstanceContext.Provider>
        </FormContext.Provider>
        );
}

it('renders from host-supplied identity without a Router', async () =>
{
    render(
        <FormContext.Provider value={formContext}>
            <InstanceContext.Provider value={instanceContext}>
                <LookupContext.Provider value={lookupContext}>
                    <PdfTemplateContext.Provider value={templateContext}>
                        <FormImageContext.Provider value={imageContext}>
                            <FormSurface formId="embedded-form" />
                        </FormImageContext.Provider>
                    </PdfTemplateContext.Provider>
                </LookupContext.Provider>
            </InstanceContext.Provider>
        </FormContext.Provider>
        );

    expect(await screen.findByRole('heading', { name: 'Embedded Form' })).toBeInTheDocument();
});

it('renders a replacement hosted snapshot without store ownership or editable controls', async () =>
{
    const first = { formId: 'hosted-form', instanceId: 'host:a', controls: [{ param: 'name', value: 'First Villager' }] };
    const second = { formId: 'hosted-form', instanceId: 'host:b', controls: [{ param: 'name', value: 'Second Villager' }] };
    const view = render(hostedSurface(first));

    expect(await screen.findByText('First Villager')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    view.rerender(hostedSurface(second));

    expect(await screen.findByText('Second Villager')).toBeInTheDocument();
    expect(screen.queryByText('First Villager')).not.toBeInTheDocument();
    expect(first.controls[0].value).toBe('First Villager');
});
