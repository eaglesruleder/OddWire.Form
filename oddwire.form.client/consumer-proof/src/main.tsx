import { createRoot } from 'react-dom/client';
import { ContextsProvider, FormSurface } from 'oddwire.form.client';
import 'oddwire.form.client/styles.css';

createRoot(document.getElementById('root')!).render(
    <ContextsProvider>
        <FormSurface formId="44444444-4444-4444-8444-444444444444" onNavigate={() => undefined} />
    </ContextsProvider>
    );
