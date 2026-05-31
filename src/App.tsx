import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from './app/providers'
import { AppGate } from './app/AppGate'

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppGate />
      </BrowserRouter>
    </AppProviders>
  )
}
