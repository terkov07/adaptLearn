import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Onboarding from './pages/Onboarding'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App