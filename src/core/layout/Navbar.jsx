import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">Portfolio</Link>
      <nav className="navbar-links">
        <Link to="/">Accueil</Link>
      </nav>
    </header>
  )
}