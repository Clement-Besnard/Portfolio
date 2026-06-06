import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main style={{ textAlign: 'center', padding: '4rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        Cette page n'existe pas.
      </p>
      <Link to="/" style={{ color: 'var(--color-primary)' }}>← Retour à l'accueil</Link>
    </main>
  )
}