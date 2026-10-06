import { render, screen } from '@testing-library/react';

import type { FormContextValue, FormImageContextValue, InstanceContextValue, LookupContextValue, PdfTemplateContextValue } from '../_context';
import { FormContext, FormImageContext, InstanceContext, LookupContext, PdfTemplateContext } from '../_context';
import { FormSurface } from './FormPage';

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
