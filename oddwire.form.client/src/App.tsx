import { FormProvider } from './context/FormContext';
import { FormPage } from './form/FormPage';

function App() {
  return (
    <FormProvider>
      <FormPage />
    </FormProvider>
  );
}

export default App;
