import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ConfirmationProvider } from './contexts/ConfirmationContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfirmationProvider>
      <App />
    </ConfirmationProvider>
  </StrictMode>,
);
