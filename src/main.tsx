import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { unregisterServiceWorkers } from '@/lib/unregisterServiceWorkers'
import '@/index.css'

void unregisterServiceWorkers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
