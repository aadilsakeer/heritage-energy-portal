import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { registerInstallServiceWorker } from '@/lib/registerInstallServiceWorker'
import '@/index.css'

void registerInstallServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
