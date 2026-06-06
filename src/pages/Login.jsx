import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import GoogleLoginButton from '../core/auth/GoogleLoginButton'
import { useAuth } from '../core/auth/useAuth'
import './Login.css'

export default function Login() {
  const { user, authError, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? '/'

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, navigate, from])

  useEffect(() => {
    return () => clearError()
  }, [clearError])

  return (
    <main className="login-page">
      <div className="login-card">
        <Link to="/" className="login-back">← Retour au hub</Link>
        <div className="login-header">
          <h1>Connexion</h1>
          <p>Connectez-vous avec Google pour accéder aux projets du hub.</p>
        </div>

        {authError && (
          <div className="login-error" role="alert">
            {authError}
          </div>
        )}

        <GoogleLoginButton />

        <p className="login-note">
          Seules les adresses e-mail autorisées peuvent se connecter.
        </p>
      </div>
    </main>
  )
}
