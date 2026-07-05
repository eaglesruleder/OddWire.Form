import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ContextsProvider } from './_context';
import { FormPage } from './form';
import { LandingPage } from './landing';
import { SettingsPage } from './settings';

function App() {
    return (
        <ContextsProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/form/:formId/:instanceId?" element={<FormPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </ContextsProvider>
    );
}

export default App;
