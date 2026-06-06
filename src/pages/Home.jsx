import { Link } from 'react-router-dom'
import { PROJECTS } from '../config/projects'
import { useAuth } from '../core/auth/useAuth'
import './Home.css'

export default function Home() {
  const { user } = useAuth()

  return (
    <main className="home">
      <section className="home-hero">
        <p className="home-label">Hub de projets</p>
        <h1>
          Tous vos projets,<br />
          <span className="accent">au même endroit.</span>
        </h1>
        <p className="home-subtitle">
          Un espace centralisé pour accéder à vos applications et outils personnels.
          {!user && ' Connectez-vous pour accéder aux projets privés.'}
        </p>
      </section>

      <section className="projects-section">
        <div className="projects-header">
          <h2>Projets</h2>
          <span className="projects-count">{PROJECTS.length}</span>
        </div>

        <div className="projects-grid">
          {PROJECTS.map((project) => {
            const isLocked = project.private && !user
            const CardWrapper = isLocked ? 'div' : Link
            const cardProps = isLocked
              ? { className: 'project-card project-card--locked' }
              : { to: `/projects/${project.slug}`, className: 'project-card' }

            return (
              <CardWrapper key={project.slug} {...cardProps}>
                <div className="project-card-top">
                  <h3>{project.title}</h3>
                  {project.private && (
                    <span className="project-badge" title="Projet privé">
                      {isLocked ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>
                <p>{project.description}</p>
                <div className="tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                {isLocked && (
                  <Link to="/login" className="project-login-link">
                    Se connecter pour accéder →
                  </Link>
                )}
              </CardWrapper>
            )
          })}
        </div>
      </section>
    </main>
  )
}
