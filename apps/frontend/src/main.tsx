import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import { setDocumentDirection } from './i18n';
import { useThemeStore } from './store/theme.store';
import App from './App.tsx';

setDocumentDirection('ar');
useThemeStore.getState().init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
