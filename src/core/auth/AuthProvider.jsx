import { useState, useCallback } from 'react'
import { AuthContext } from './AuthContext'
import { isEmailAllowed, decodeJwt } from '../../config/auth'

const STORAGE_KEY = 'hub_user'

function getInitialUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const stored = JSON.parse(raw)
    if (stored && isEmailAllowed(stored.email)) return stored

    localStorage.removeItem(STORAGE_KEY)
    return null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser)
  const [authError, setAuthError] = useState(null)

  const loginWithGoogle = useCallback((credential) => {
    setAuthError(null)
    try {
      const payload = decodeJwt(credential)
      const userData = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      }

      if (!isEmailAllowed(userData.email)) {
        setAuthError('Cette adresse e-mail n\'est pas autorisée à accéder au hub.')
        return false
      }

      setUser(userData)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      return true
    } catch {
      setAuthError('Erreur lors de la connexion. Veuillez réessayer.')
      return false
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setAuthError(null)
    localStorage.removeItem(STORAGE_KEY)
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect()
    }
  }, [])

  const clearError = useCallback(() => setAuthError(null), [])

  return (
    <AuthContext.Provider value={{ user, authError, loginWithGoogle, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}
