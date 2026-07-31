import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SCOUTS, STATUS_META } from './scouts.config'
import './style.css'

// Intervalle de rafraîchissement du front. Le scraping, lui, tourne côté serveur
// (POLL_INTERVAL de scouts.py) : on ne fait ici que relire le dernier statut connu.
const REFRESH_MS = 15000

const INITIAL_STATE = {
  status: 'idle',
  message: 'En attente du premier relevé…',
  checkedAt: null,
  history: [],
  reachable: true,
  isChecking: false,
}

function formatAgo(iso) {
  if (!iso) return '—'

  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `il y a ${seconds}s`
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)} h`
  return new Date(iso).toLocaleDateString('fr-FR')
}

export default function ScoutsProject() {
  const [states, setStates] = useState(() =>
    Object.fromEntries(SCOUTS.map((scout) => [scout.id, INITIAL_STATE]))
  )
  const [autoRefresh, setAutoRefresh] = useState(true)
  // Force un re-render périodique pour que les « il y a X » restent justes
  const [, setTick] = useState(0)
  const mountedRef = useRef(true)

  const patch = useCallback((id, values) => {
    if (!mountedRef.current) return
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...values } }))
  }, [])

  // Lit le dernier statut connu du serveur, sans déclencher de scraping.
  const readStatus = useCallback(
    async (scout) => {
      try {
        const res = await fetch(`${scout.apiBaseUrl}/api/scouts/status`)
        const json = await res.json().catch(() => ({}))

        if (res.status === 503) {
          patch(scout.id, { ...INITIAL_STATE, reachable: true })
          return
        }
        if (!res.ok) throw new Error(json.message || `Erreur ${res.status}`)

        patch(scout.id, {
          status: json.status,
          message: json.message,
          checkedAt: json.checkedAt,
          history: json.history ?? [],
          reachable: true,
        })
      } catch (err) {
        patch(scout.id, {
          status: 'error',
          message: `Scout injoignable (${err.message})`,
          reachable: false,
        })
      }
    },
    [patch]
  )

  // Force une vérification immédiate côté serveur.
  const runCheck = useCallback(
    async (scout) => {
      patch(scout.id, { isChecking: true })

      try {
        const res = await fetch(`${scout.apiBaseUrl}/api/scouts/check`, { method: 'POST' })
        const json = await res.json().catch(() => ({}))

        patch(scout.id, {
          status: json.status ?? 'error',
          message: json.message ?? `Erreur ${res.status}`,
          checkedAt: json.checkedAt ?? new Date().toISOString(),
          reachable: true,
        })
      } catch (err) {
        patch(scout.id, {
          status: 'error',
          message: `Scout injoignable (${err.message})`,
          reachable: false,
        })
      } finally {
        patch(scout.id, { isChecking: false })
        readStatus(scout)
      }
    },
    [patch, readStatus]
  )

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    SCOUTS.forEach(readStatus)
    if (!autoRefresh) return

    const id = setInterval(() => SCOUTS.forEach(readStatus), REFRESH_MS)
    return () => clearInterval(id)
  }, [autoRefresh, readStatus])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10000)
    return () => clearInterval(id)
  }, [])

  const online = SCOUTS.filter((scout) => states[scout.id].reachable).length
  const alerts = SCOUTS.filter((scout) =>
    ['available', 'last_chance'].includes(states[scout.id].status)
  ).length

  return (
    <main className="project-page">
      <Link to="/" className="project-back">← Retour au hub</Link>

      <header className="project-header">
        <h1>Scouts</h1>
        <p className="project-desc">
          Des instances Flask indépendantes scrutent chacune un site web et exposent
          leur dernier relevé. Ce tableau de bord les interroge et permet de forcer
          une vérification à la volée.
        </p>
      </header>

      <section className="sc-toolbar">
        <div className="sc-counters">
          <span className="sc-counter">
            <strong>{SCOUTS.length}</strong> scout{SCOUTS.length > 1 ? 's' : ''}
          </span>
          <span className="sc-counter">
            <strong>{online}</strong> en ligne
          </span>
          <span className={`sc-counter${alerts ? ' sc-counter--alert' : ''}`}>
            <strong>{alerts}</strong> alerte{alerts > 1 ? 's' : ''}
          </span>
        </div>

        <div className="sc-toolbar-actions">
          <label className="sc-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Rafraîchissement auto ({REFRESH_MS / 1000}s)
          </label>

          <button
            type="button"
            className="sc-btn"
            onClick={() => SCOUTS.forEach(runCheck)}
            disabled={SCOUTS.some((scout) => states[scout.id].isChecking)}
          >
            Tout vérifier
          </button>
        </div>
      </section>

      <section className="sc-grid">
        {SCOUTS.map((scout) => {
          const state = states[scout.id]
          const meta = STATUS_META[state.status] ?? STATUS_META.unknown

          return (
            <article key={scout.id} className={`sc-card sc-card--${meta.tone}`}>
              <header className="sc-card-head">
                <div>
                  <h2 className="sc-card-title">{scout.name}</h2>
                  <p className="sc-card-target">{scout.target}</p>
                </div>
                <span className={`sc-pill sc-pill--${meta.tone}`}>
                  <span className="sc-dot" aria-hidden="true" />
                  {meta.label}
                </span>
              </header>

              <p className="sc-message" aria-live="polite">{state.message}</p>

              {state.history.length > 1 && (
                <div className="sc-history" aria-label="Historique des derniers relevés">
                  {state.history.map((entry, i) => {
                    const tone = (STATUS_META[entry.status] ?? STATUS_META.unknown).tone
                    return (
                      <span
                        key={`${entry.checkedAt}-${i}`}
                        className={`sc-tick sc-tick--${tone}`}
                        title={`${entry.message} · ${formatAgo(entry.checkedAt)}`}
                      />
                    )
                  })}
                </div>
              )}

              <footer className="sc-card-foot">
                <span className="sc-timestamp">Relevé {formatAgo(state.checkedAt)}</span>

                <div className="sc-card-actions">
                  <a
                    href={scout.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sc-link"
                  >
                    Voir le site
                  </a>
                  <button
                    type="button"
                    className="sc-btn sc-btn--sm"
                    onClick={() => runCheck(scout)}
                    disabled={state.isChecking}
                  >
                    {state.isChecking ? (
                      <>
                        <span className="sc-spinner" aria-hidden="true" />
                        Vérification…
                      </>
                    ) : (
                      'Vérifier'
                    )}
                  </button>
                </div>
              </footer>
            </article>
          )
        })}
      </section>
    </main>
  )
}
