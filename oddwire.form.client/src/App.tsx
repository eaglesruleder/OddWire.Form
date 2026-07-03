import { ContextsProvider } from './_context';
import { FormPage } from './form/FormPage';

function App() {
    return (
        <ContextsProvider>
            <FormPage />
        </ContextsProvider>
    );
}

export default App;
