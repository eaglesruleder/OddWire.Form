import type { CapturedImage, ControlDef } from '../_components/controllist';
import { captureImage } from '../_components/controllist/controls/captureImage';
import type { BundledFormPackage } from '../settings/FormManager/formPackages';
import type { FormImageContextValue } from './FormImageContext';
import { FORM_DEFAULT_INSTANCE } from './FormImageContext';
import type { FormDefinition, FormInstance } from './types';

type FormPackageInstaller = {
    saveForm: (form: FormDefinition) => Promise<string>;
    saveInstance: (instance: FormInstance) => Promise<string>;
    saveTemplate: (formId: string, fileName: string, type: string, blob: Blob) => Promise<void>;
    images: Pick<FormImageContextValue, 'imagesFor' | 'deleteImage' | 'saveImage'>;
    };

export async function installFormPackage(pkg: BundledFormPackage, installer: FormPackageInstaller): Promise<string>
{
    const form = pkg.images.length > 0 ? await installImageDefaults(pkg, installer.images) : pkg.form;
    const formId = await installer.saveForm(form);

    if (pkg.template)
        await installer.saveTemplate(formId, pkg.template.fileName, pkg.template.type, pkg.template.blob);

    await Promise.all(pkg.instances.map(instance => installer.saveInstance({ ...instance, formId })));

    return formId;
}

// Intent: store each bundled image blob as a form-default (shared, FORM_DEFAULT_INSTANCE-scoped) and return the form with
// those { id, thumbnail } values baked onto the matching image controls. Sweeps this form's prior defaults first so a
// reinstall/update replaces rather than orphans them.
async function installImageDefaults(pkg: BundledFormPackage, images: FormPackageInstaller['images']): Promise<FormDefinition>
{
    const prior = await images.imagesFor({ formId: pkg.form.formId, instanceId: FORM_DEFAULT_INSTANCE });
    await Promise.all(prior.map(record => images.deleteImage(record.id)));

    const defaults: Record<string, CapturedImage> = {};

    for (const image of pkg.images)
    {
        const data = await captureImage(image.blob, image.mime);
        const id = crypto.randomUUID();

        await images.saveImage(
            {id
            ,formId: pkg.form.formId
            ,instanceId: FORM_DEFAULT_INSTANCE
            ,param: image.param
            ,mime: data.mime
            ,w: data.w
            ,h: data.h
            ,blob: data.blob
            });

        defaults[image.param] = { id, thumbnail: data.thumbnail };
    }

    const form = structuredClone(pkg.form);
    applyImageDefaults(form.controls, defaults);
    return form;
}

// Intent: param is flat across the form, so set the default on any image control that matches, at any nesting depth.
// Recurse only into layout controls' child lists (a radio/dropdown's `controls` is an option list, not ControlDefs).
const LAYOUT_TYPES = new Set(['collapsible', 'tab', 'popup', 'looper']);

function applyImageDefaults(controls: ControlDef[], defaults: Record<string, CapturedImage>): void
{
    for (const control of controls)
    {
        if (control.type === 'image' && defaults[control.param])
            (control as { value: CapturedImage }).value = defaults[control.param];

        if (LAYOUT_TYPES.has(control.type) && Array.isArray((control as { controls?: ControlDef[] }).controls))
            applyImageDefaults((control as { controls: ControlDef[] }).controls, defaults);
    }
}
