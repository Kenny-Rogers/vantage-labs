import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './styles.css';
import App from './App';

const rootElement = document.getElementById('root');

const tree = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

// Hydrate when the build was prerendered (puppeteer dropped HTML into
// the root div); otherwise mount fresh as a regular CSR app.
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, tree);
} else {
  createRoot(rootElement).render(tree);
}
