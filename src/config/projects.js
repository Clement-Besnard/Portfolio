// Interrupteurs on/off définis dans le .env (voir .env.example).
// Les clés sont écrites en toutes lettres : Vite remplace `import.meta.env.VITE_*`
// statiquement au build, un accès dynamique ne fonctionnerait pas.
const ENABLED_FLAGS = {
  'project-template': import.meta.env.VITE_PROJECT_TEMPLATE_ENABLED,
  'project-voice-cloning': import.meta.env.VITE_PROJECT_VOICE_CLONING_ENABLED,
  'project-scouts': import.meta.env.VITE_PROJECT_SCOUTS_ENABLED,
}

// Un projet est actif par défaut : seule une valeur explicitement négative le coupe.
const OFF_VALUES = ['false', '0', 'off', 'no']

function isEnabled(slug) {
  const value = ENABLED_FLAGS[slug]
  if (value === undefined) return true
  return !OFF_VALUES.includes(String(value).trim().toLowerCase())
}

export const PROJECTS = [
  {
    slug: 'project-template',
    title: 'Project Template',
    description: 'Modèle de base pour ajouter un nouveau projet au hub.',
    tags: ['React', 'Vite'],
    private: true,
    enabled: isEnabled('project-template'),
  },
  {
    slug: 'project-voice-cloning',
    title: 'Voice Cloning Project',
    description: 'Projet visant à implémenter du Voice Cloning.',
    tags: ['Omnivoice', 'STT-Whisper', 'Python Flask'],
    private: true,
    enabled: isEnabled('project-voice-cloning'),
  },
  {
    slug: 'project-scouts',
    title: 'Scouts Project',
    description: 'Instances parallèles scrutant divers sites web.',
    tags: ['Python Flask', 'Web Scraping'],
    private: true,
    enabled: isEnabled('project-scouts'),
  }
]
