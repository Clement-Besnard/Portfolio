import './style.css'

export default function ProjectTemplate() {
  return (
    <main className="project-page">
      <header className="project-header">
        <h1>Nom du Projet</h1>
        <p className="project-desc">Description du projet, ce qu'il fait, les technos utilisées.</p>
        <div className="project-links">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn">GitHub</a>
          <a href="https://demo.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline">Demo</a>
        </div>
      </header>

      <section className="project-content">
        <p>Contenu du projet à personnaliser...</p>
      </section>
    </main>
  )
}