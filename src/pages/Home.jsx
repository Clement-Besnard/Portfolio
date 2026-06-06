import { Link } from 'react-router-dom'
import './Home.css'

const PROJECTS = [
  {
    slug: 'project-template',
    title: 'Project Template',
    description: 'Description courte du projet.',
    tags: ['React', 'Vite'],
  },
  // Ajoute tes projets ici
]

export default function Home() {
  return (
    <main className="home">
      <section className="home-hero">
        <h1>Bonjour, je suis <span className="accent">Ton Nom</span></h1>
        <p>Développeur web — voici mes projets.</p>
      </section>

      <section className="projects-grid">
        {PROJECTS.map((project) => (
          <Link to={`/projects/${project.slug}`} key={project.slug} className="project-card">
            <h2>{project.title}</h2>
            <p>{project.description}</p>
            <div className="tags">
              {project.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}