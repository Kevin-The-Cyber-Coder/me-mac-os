import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { initPwa } from './lib/pwa'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root was not found')

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
)

initPwa()
