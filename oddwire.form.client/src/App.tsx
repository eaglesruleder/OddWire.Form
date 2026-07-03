import { FormPage } from './form/FormPage';

// Stage 1: no navigation yet — App is just the strip shell + a single hard-coded FormPage.
// Nav (LandingPage / Screen union) arrives in Stage 4.
function App() {
  return (
    <>
      <header className="app-header">
        <h1>OddWire Forms</h1>
      </header>
      <main className="app-main">
        <FormPage />
      </main>
    </>
  );
}

export default App;
