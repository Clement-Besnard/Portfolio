import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        <span className="navbar-logo-mark" aria-hidden="true" />
        Hub
      </Link>

      <nav className="navbar-actions">
        {user ? (
            <div className="navbar-user">
              {user.picture && (
                <img
                  src={user.picture}
                  alt=""
                  className="navbar-avatar"
                  width={28}
                  height={28}
                />
              )}
              <span className="navbar-email">{user.email}</span>
              <button type="button" onClick={logout} className="navbar-logout">
                Déconnexion
              </button>
            </div>
          ) : (
            <Link to="/login" className="navbar-login">
              Connexion
            </Link>
          )}
      </nav>
    </header>
  )
}
