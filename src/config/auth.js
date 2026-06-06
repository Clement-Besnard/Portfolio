export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

export const ALLOWED_EMAILS = (import.meta.env.VITE_ALLOWED_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export function isEmailAllowed(email) {
  if (!email) return false
  if (ALLOWED_EMAILS.length === 0) return false
  return ALLOWED_EMAILS.includes(email.toLowerCase())
}

export function decodeJwt(token) {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(''),
  )
  return JSON.parse(jsonPayload)
}
