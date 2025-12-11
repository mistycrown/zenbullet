
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ZenProvider } from './contexts/ZenContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ZenProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ZenProvider>
  </React.StrictMode>
);
