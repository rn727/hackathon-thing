import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Home'
import KidDashboard from './kid/KidDashboard'
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
