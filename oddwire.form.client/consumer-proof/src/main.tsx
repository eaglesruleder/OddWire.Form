import { createRoot } from 'react-dom/client';
import { ContextsProvider, FormSurface } from 'oddwire.form.client';
import 'oddwire.form.client/styles.css';

createRoot(document.getElementById('root')!).render(
    <ContextsProvider>
        <FormSurface formId="monster-card" onNavigate={() => undefined} />
    </ContextsProvider>
    );
