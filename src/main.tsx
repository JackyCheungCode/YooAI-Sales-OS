import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalTheme } from '@carbon/react';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { AuthProvider } from './app/AuthContext';
import './components/carbon/register';
import './styles/carbon.scss';
import './styles/carbon-tokens.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalTheme theme="g10">
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GlobalTheme>
  </StrictMode>,
);
