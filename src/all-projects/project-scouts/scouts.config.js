// Chaque scout est une instance Flask (scouts.py) qui surveille un site.
// Pour en ajouter un : lancer une instance sur un autre port / une autre URL
// et ajouter une entrée ici — le front s'adapte tout seul.
export const SCOUTS = [
  {
    id: 'studea-chevilly',
    name: 'Studea Chevilly-Larue',
    target: 'Nexity Studea — résidence Chevilly-Larue / Rungis',
    targetUrl:
      'https://www.nexity-studea.com/locations-etudiantes/chevilly-larue/studea-chevilly-larue-rungis-po0000333',
    apiBaseUrl: import.meta.env.VITE_SCOUTS_API_URL ?? 'http://localhost:5171',
  },
]

// Statuts renvoyés par l'API (methods.py) → libellé + ton visuel.
export const STATUS_META = {
  available: { label: 'Disponible', tone: 'ok' },
  last_chance: { label: 'Dernières dispos', tone: 'warn' },
  full: { label: 'Complète', tone: 'off' },
  unknown: { label: 'Inconnu', tone: 'neutral' },
  error: { label: 'Erreur', tone: 'bad' },
  idle: { label: 'En attente', tone: 'neutral' },
}
