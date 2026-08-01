import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Navbar from './core/layout/Navbar'
import Footer from './core/layout/Footer'
import PrivateRoute from './core/auth/PrivateRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import { PROJECTS } from './config/projects'

const PROJECT_PAGES = {
  'project-template': lazy(() => import('./all-projects/project-template')),
  'project-voice-cloning': lazy(() => import('./all-projects/project-voice-cloning')),
  'project-scouts': lazy(() => import('./all-projects/project-scouts')),
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Suspense fallback={<div className="loading">Chargement...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            {/* Les projets désactivés dans le .env n'ont pas de route :
                leur URL retombe sur la page 404. */}
            {PROJECTS.filter((project) => project.enabled).map((project) => {
              const ProjectPage = PROJECT_PAGES[project.slug]
              if (!ProjectPage) return null

              return (
                <Route
                  key={project.slug}
                  path={`/projects/${project.slug}`}
                  element={<ProjectPage />}
                />
              )
            })}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
    </BrowserRouter>
  )
}
