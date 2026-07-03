import { FormProvider, InstanceProvider } from './_context';
import { FormPage } from './form/FormPage';

function App() {
    return (
        <FormProvider>
            <InstanceProvider>
                <FormPage />
            </InstanceProvider>
        </FormProvider>
    );
}

export default App;
