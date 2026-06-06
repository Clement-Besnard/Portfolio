import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="not-found-code">404</p>
      <h1>Page introuvable</h1>
      <p className="not-found-desc">Cette page n'existe pas ou a été déplacée.</p>
      <Link to="/" className="not-found-link">← Retour au hub</Link>
    </main>
  )
}
