import { createRoot } from 'react-dom/client';
import { ContextsProvider, HostedFormSurface, type FormInstance } from 'oddwire.form.client';
import 'oddwire.form.client/styles.css';

const instance: FormInstance = {
    formId: '44444444-4444-4444-8444-444444444444',
    instanceId: 'consumer-proof:hosted-monster',
    controls: [{ param: 'name', value: 'Villager' }]
    };

createRoot(document.getElementById('root')!).render(
    <ContextsProvider>
        <HostedFormSurface formId={instance.formId!} instance={instance} />
    </ContextsProvider>
    );
