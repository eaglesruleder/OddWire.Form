import { useContext, useReducer } from 'react';
import Button from 'react-bootstrap/Button';
import type { ButtonProps } from 'react-bootstrap/Button';

import type { FormDefinition } from '../../_context';
import { FormContext } from '../../_context';

// Intent: the install catalogue is every JSON in data/forms — dropping a file in makes it installable, no manual list
const bundledForms = Object.values(import.meta.glob('../../_context/data/forms/*.json', { eager: true }))
    .map(module => (module as { default: FormDefinition }).default)
    .sort((a, b) => (a.label ?? a.formId).localeCompare(b.label ?? b.formId));

type FormAction = { label: string; variant: ButtonProps['variant'] };

export function FormList()
{
    const { list, saveForm } = useContext(FormContext);
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    const installed = new Map(list().map(entry => [entry.formId, entry.version]));

    const install = async (form: FormDefinition) =>
    {
        await saveForm(form);
        bumpRender();
    };

    // Intent: not installed → Install; bundled newer → Update (blue); same/older → Refresh (grey reinstall)
    const actionFor = (form: FormDefinition): FormAction =>
    {
        if (!installed.has(form.formId))
            return { label: 'Install', variant: 'outline-primary' };

        return compareVersions(form.version, installed.get(form.formId)) > 0
            ? { label: 'Update', variant: 'outline-primary' }
            : { label: 'Refresh', variant: 'outline-secondary' };
    };

    return (
        <div className="flex column gap">
            {bundledForms.map(form =>
            {
                const action = actionFor(form);

                return (
                    <div key={form.formId} className="flex items-center gap">
                        <span className="fill">
                            {form.label ?? form.formId}
                            {form.version ? <span className="text-muted"> v{form.version}</span> : null}
                        </span>
                        <Button size="sm" variant={action.variant} onClick={() => install(form)}>{action.label}</Button>
                    </div>
                    );
            })}
        </div>
        );
}

// Intent: numeric dotted-segment compare — returns >0 when a is newer than b
function compareVersions(a?: string, b?: string): number
{
    const pa = (a ?? '0').split('.').map(Number);
    const pb = (b ?? '0').split('.').map(Number);

    for (let i = 0; i < Math.max(pa.length, pb.length); i++)
    {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (diff)
            return Math.sign(diff);
    }

    return 0;
}
