import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ConfigProvider } from './context/ConfigContext.jsx';
import './styles/global.css';
import './styles/layout.css';
import './styles/pages.css';
import './styles/store.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ConfigProvider>
        <CartProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </CartProvider>
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>,
);
