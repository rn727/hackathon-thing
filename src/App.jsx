import { BrowserRouter, Routes, Route } from 'react-router-dom'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import Home from './Home'
import KidDashboard from './pages/KidDashboard'
import ParentDashboard from './parent/ParentDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Home />}
        />
        <Route path="/parent" element={<ParentDashboard />} />
        <Route
          path="/kid"
          element={<KidDashboard />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App
