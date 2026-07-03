import type { FormDefinition, FormInstance } from './types';
import { FormActiveInstance } from './InstanceContext';
import testForm from './data/forms/testform.json';
import testInstance from './data/instances/testinstance.json';

// The bundled JSON the initialiser loads into memory. Extend these arrays as forms/instances are
// added; the JSON boundary cast lives here, once, rather than scattered through the store.
const formJson =
    [testForm
    ] as unknown as FormDefinition[];

const instanceJson =
    [testInstance
    ] as unknown as FormInstance[];

// In-memory context store: initialised once from the bundled JSON, then survives re-render and
// navigation for the session. getForm / getInstance resolve by id out of the loaded arrays.
class PersistentStore
{
    initialised = false;
    forms: FormDefinition[] = [];
    instances: FormInstance[] = [];

    initialise()
    {
        if (this.initialised)
            return;

        for (const form of formJson)
            this.forms.push(form);

        for (const instance of instanceJson)
            this.instances.push(instance);

        this.initialised = true;
    }

    getForm = async (formId: string): Promise<FormDefinition> =>
        this.forms.find(form => form.formId === formId) as FormDefinition;

    getInstance = async (instanceId: string): Promise<FormActiveInstance> =>
        new FormActiveInstance(this.instances.find(instance => instance.instanceId === instanceId) ?? { controls: [] });
}

export const persistent = new PersistentStore();
