import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Navbar from './core/layout/Navbar'
import Footer from './core/layout/Footer'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
// PrivateRoute retiré — on l'ajoutera quand l'auth sera prête

const ProjectTemplate = lazy(() => import('./all-projects/project-template'))

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Suspense fallback={<div className="loading">Chargement...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects/project-template" element={<ProjectTemplate />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
    </BrowserRouter>
  )
}