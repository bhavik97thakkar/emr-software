
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { seedDemoData, DEMO_CREDENTIALS } from './services/demoSeed';

// Expose demo utilities only in development builds.
if (import.meta.env.DEV) {
  (window as any).medcore = {
    seedDemoData: () => {
      seedDemoData();
      console.log('✅ Demo data has been seeded. Refresh the page to see the changes.');
    },
    DEMO_CREDENTIALS,
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </HashRouter>
  </React.StrictMode>
);
