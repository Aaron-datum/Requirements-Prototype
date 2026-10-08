import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/app.css'
import { StoreProvider } from './store'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StoreProvider>
    <App />
  </StoreProvider>,
)
