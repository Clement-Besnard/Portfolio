import { useEffect, useRef } from 'react'
import { GOOGLE_CLIENT_ID } from '../../config/auth'
import { useAuth } from './useAuth'
import './GoogleLoginButton.css'

export default function GoogleLoginButton({ size = 'large', text = 'continue_with' }) {
  const buttonRef = useRef(null)
  const { loginWithGoogle } = useAuth()

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return

    const init = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => loginWithGoogle(response.credential),
        auto_select: false,
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_black',
        size,
        text,
        locale: 'fr',
        shape: 'rectangular',
      })
    }

    if (window.google?.accounts?.id) {
      init()
      return
    }

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval)
        init()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [loginWithGoogle, size, text])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="google-login-missing">
        Configurez <code>VITE_GOOGLE_CLIENT_ID</code> dans votre fichier <code>.env</code>.
      </p>
    )
  }

  return <div ref={buttonRef} className="google-login-button" />
}
