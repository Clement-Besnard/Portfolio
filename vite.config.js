import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' => charge toutes les variables du .env, y compris non préfixées par VITE_
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: Number(env.FRONTEND_PORT) || 5173,
    },
  }
})
