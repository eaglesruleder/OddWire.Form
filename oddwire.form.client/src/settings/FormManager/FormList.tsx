import { useContext, useEffect, useReducer, useState } from 'react';
import Button from 'react-bootstrap/Button';
import type { ButtonProps } from 'react-bootstrap/Button';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

import type { FormDefinition } from '../../_context';
import { FormContext, PdfTemplateContext } from '../../_context';

import { loadFormPackage } from './formPackages';
import type { BundledFormPackage } from './formPackages';

// Intent: the install catalogue is every loose JSON form plus every zip package in data/forms — no manual list
const bundledForms = Object.values(import.meta.glob('../../_context/data/forms/*.json', { eager: true }))
    .map(module => ({ form: (module as { default: FormDefinition }).default }));

const bundledPackageUrls = Object.values(import.meta.glob('../../_context/data/forms/*.zip', { eager: true, query: '?url', import: 'default' }))
    .map(url => String(url));

type FormAction = { label: string; variant: ButtonProps['variant'] };

export function FormList()
{
    const { list, saveForm } = useContext(FormContext);
    const { saveTemplate } = useContext(PdfTemplateContext);
    const [packages, setPackages] = useState<BundledFormPackage[]>(bundledForms);
    const [toastMessage, setToastMessage] = useState<string>();
    const [, bumpRender] = useReducer(tick => tick + 1, 0);

    // Intent: a bad zip must not blank the catalogue — settle each package, keep the good ones, toast the failures
    useEffect(() =>
    {
        let active = true;

        (async () =>
        {
            const results = await Promise.allSettled(bundledPackageUrls.map(loadFormPackage));

            if (!active)
                return;

            const loaded = results
                .filter((result): result is PromiseFulfilledResult<BundledFormPackage> => result.status === 'fulfilled')
                .map(result => result.value);

            if (loaded.length < bundledPackageUrls.length)
                setToastMessage('Failed to load form: incorrect package format');

            setPackages(mergePackages([...bundledForms, ...loaded]));
        })();

        return () => { active = false; };
    }, []);

    const installed = new Map(list().map(entry => [entry.formId, entry.version]));

    const install = async (pkg: BundledFormPackage) =>
    {
        try
        {
            const formId = await saveForm(pkg.form);

            if (pkg.template)
                await saveTemplate(formId, pkg.template.fileName, pkg.template.type, pkg.template.blob);

            bumpRender();
        }
        catch (error)
        {
            setToastMessage(error instanceof Error ? `Install failed: ${error.message}` : 'Install failed');
        }
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
            {packages.map(pkg =>
            {
                const form = pkg.form;
                const action = actionFor(form);

                return (
                    <div key={form.formId} className="flex items-center gap">
                        <span className="fill">
                            {form.label ?? form.formId}
                            {form.version ? <span className="text-muted"> v{form.version}</span> : null}
                        </span>
                        <Button size="sm" variant={action.variant} onClick={() => install(pkg)}>{action.label}</Button>
                    </div>
                    );
            })}
            <ToastContainer position="bottom-center" className="p-3">
                <Toast show={!!toastMessage} onClose={() => setToastMessage(undefined)} delay={2400} autohide>
                    <Toast.Body>{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
        );
}

function mergePackages(packages: BundledFormPackage[]): BundledFormPackage[]
{
    const byFormId = new Map<string, BundledFormPackage>();

    for (const pkg of packages)
        byFormId.set(pkg.form.formId, pkg);

    return [...byFormId.values()]
        .sort((a, b) => (a.form.label ?? a.form.formId).localeCompare(b.form.label ?? b.form.formId));
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
