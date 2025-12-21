import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ui'
import { AuthWrapper } from './components/auth/AuthWrapper'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <AuthWrapper>
          <App />
        </AuthWrapper>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>,
)
