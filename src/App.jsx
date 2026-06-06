import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Navbar from './core/layout/Navbar'
import Footer from './core/layout/Footer'
import PrivateRoute from './core/auth/PrivateRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

const ProjectTemplate = lazy(() => import('./all-projects/project-template'))

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Suspense fallback={<div className="loading">Chargement...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route path="/projects/project-template" element={<ProjectTemplate />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
    </BrowserRouter>
  )
}
