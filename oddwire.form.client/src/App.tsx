import { FormContext, formContextValue } from './_context';
import { FormPage } from './form/FormPage';

function App() {
  return (
    <FormContext.Provider value={formContextValue}>
      <FormPage />
    </FormContext.Provider>
  );
}

export default App;
