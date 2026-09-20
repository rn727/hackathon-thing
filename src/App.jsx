import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import Home from './pages/Home'
import KidDashboard from './pages/KidDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/kid"
          element={<KidDashboard />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App
