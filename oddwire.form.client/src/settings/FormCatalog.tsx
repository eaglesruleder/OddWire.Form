import { useContext, useReducer } from 'react';
import Button from 'react-bootstrap/Button';

import type { FormDefinition } from '../_context';
import { FormContext } from '../_context';

// Intent: the install catalogue is every JSON in data/forms — dropping a file in makes it installable, no manual list
const bundledForms = Object.values(import.meta.glob('../_context/data/forms/*.json', { eager: true }))
    .map(module => (module as { default: FormDefinition }).default)
    .sort((a, b) => (a.label ?? a.formId).localeCompare(b.label ?? b.formId));

export function FormCatalog()
{
    const { list, saveForm } = useContext(FormContext);
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    const installed = new Set(list().map(entry => entry.formId));

    const install = async (form: FormDefinition) =>
    {
        await saveForm(form);
        bumpRender();
    };

    return (
        <div className="flex column gap">
            {bundledForms.map(form =>
                <div key={form.formId} className="flex items-center gap">
                    <span className="fill">
                        {form.label ?? form.formId}
                        {form.version ? <span className="text-muted"> v{form.version}</span> : null}
                    </span>
                    <Button
                        size="sm"
                        variant={installed.has(form.formId) ? 'outline-secondary' : 'outline-primary'}
                        onClick={() => install(form)}
                    >
                        {installed.has(form.formId) ? 'Reinstall' : 'Install'}
                    </Button>
                </div>
                )}
        </div>
        );
}
