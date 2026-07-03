import { FormContext, formContextValue, InstanceContext, instanceContextValue } from './_context';
import { FormPage } from './form/FormPage';

function App() {
  return (
    <FormContext.Provider value={formContextValue}>
      <InstanceContext.Provider value={instanceContextValue}>
        <FormPage />
      </InstanceContext.Provider>
    </FormContext.Provider>
  );
}

export default App;
