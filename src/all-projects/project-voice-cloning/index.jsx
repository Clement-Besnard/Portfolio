import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './style.css'

const API_BASE_URL = 'http://localhost:5000'

export default function VoiceCloningProject() {
  const [audioFile, setAudioFile] = useState(null)
  const [audioURL, setAudioURL] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [targetText, setTargetText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [outputAudio, setOutputAudio] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    return () => {
      if (audioURL) URL.revokeObjectURL(audioURL)
      if (outputAudio) URL.revokeObjectURL(outputAudio)
    }
  }, [audioURL, outputAudio])

  const resetOutput = () => {
    if (outputAudio) URL.revokeObjectURL(outputAudio)
    setOutputAudio(null)
  }

  const handleFile = (file) => {
    if (!file) return

    const isWav =
      file.type === 'audio/wav' ||
      file.type === 'audio/x-wav' ||
      file.name.toLowerCase().endsWith('.wav')

    if (!isWav) {
      setError('Seuls les fichiers .wav sont acceptés.')
      return
    }

    setError(null)
    resetOutput()

    if (audioURL) URL.revokeObjectURL(audioURL)

    setAudioFile(file)
    setAudioURL(URL.createObjectURL(file))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleRemoveFile = (e) => {
    e.stopPropagation()
    if (audioURL) URL.revokeObjectURL(audioURL)
    setAudioFile(null)
    setAudioURL(null)
    resetOutput()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!audioFile || !transcript.trim() || !targetText.trim()) {
      setError('Ajoute un fichier WAV, un transcript et une phrase à synthétiser.')
      return
    }

    setIsLoading(true)
    setError(null)
    resetOutput()

    try {
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('transcript', transcript.trim())
      formData.append('text', targetText.trim())

      const res = await fetch(`${API_BASE_URL}/api/clone`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || ''

        if (contentType.includes('application/json')) {
          const json = await res.json()
          throw new Error(json.message || `Erreur ${res.status}`)
        }

        const text = await res.text()
        throw new Error(text || `Erreur ${res.status}`)
      }

      const blob = await res.blob()
      const audioBlob = new Blob([blob], { type: 'audio/wav' })
      setOutputAudio(URL.createObjectURL(audioBlob))
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  const canSubmit =
    !!audioFile &&
    !!transcript.trim() &&
    !!targetText.trim() &&
    !isLoading

  return (
    <main className="project-page">
      <Link to="/" className="project-back">← Retour au hub</Link>

      <header className="project-header">
        <h1>Voice Cloning</h1>
        <p className="project-desc">
          Envoie un fichier WAV de référence, écris son transcript, puis la phrase
          à générer avec la voix clonée.
        </p>
      </header>

      <form className="vc-form" onSubmit={handleSubmit}>
        <div className="vc-step">
          <div className="vc-step-label">
            <span className="vc-step-num">1</span>
            <span>Fichier WAV de référence</span>
          </div>

          <div
            className={`vc-dropzone${dragOver ? ' vc-dropzone--active' : ''}${audioFile ? ' vc-dropzone--filled' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            aria-label="Zone de dépôt pour fichier WAV"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,audio/wav,audio/x-wav"
              className="vc-file-input"
              onChange={(e) => handleFile(e.target.files[0])}
              aria-hidden="true"
              tabIndex={-1}
            />

            {audioFile ? (
              <div className="vc-file-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>

                <span className="vc-filename">{audioFile.name}</span>
                <span className="vc-filesize">{(audioFile.size / 1024).toFixed(0)} KB</span>

                <button
                  type="button"
                  className="vc-remove"
                  onClick={handleRemoveFile}
                  aria-label="Supprimer le fichier"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="vc-dropzone-hint">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p>Glisser-déposer un <strong>.wav</strong> ou cliquer pour parcourir</p>
              </div>
            )}
          </div>

          {audioURL && (
            <div className="vc-audio-preview">
              <audio controls src={audioURL} aria-label="Aperçu du fichier audio" />
            </div>
          )}
        </div>

        <div className="vc-step">
          <div className="vc-step-label">
            <span className="vc-step-num">2</span>
            <span>Transcript du fichier audio</span>
          </div>

          <textarea
            className="vc-textarea"
            placeholder="Ce que dit la voix dans le fichier WAV…"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
            aria-label="Transcript de l'audio de référence"
          />

          <p className="vc-hint">
            Pour l’instant, ce champ est manuel et correspond à <code>ref_text</code> côté backend.
          </p>
        </div>

        <div className="vc-step">
          <div className="vc-step-label">
            <span className="vc-step-num">3</span>
            <span>Phrase à synthétiser</span>
          </div>

          <textarea
            className="vc-textarea"
            placeholder="La phrase que tu veux que la voix clonée prononce…"
            value={targetText}
            onChange={(e) => setTargetText(e.target.value)}
            rows={4}
            aria-label="Phrase cible à synthétiser"
          />
        </div>

        {error && (
          <div className="vc-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <button type="submit" className="vc-submit" disabled={!canSubmit}>
          {isLoading ? (
            <>
              <span className="vc-spinner" aria-hidden="true" />
              Génération en cours…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Cloner la voix
            </>
          )}
        </button>
      </form>

      {outputAudio && (
        <section className="vc-output" aria-live="polite">
          <div className="vc-output-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Voix synthétisée
          </div>

          <audio
            controls
            src={outputAudio}
            className="vc-output-audio"
            aria-label="Audio synthétisé"
          />

          <a
            href={outputAudio}
            download="voice-clone-output.wav"
            className="vc-download"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Télécharger
          </a>
        </section>
      )}
    </main>
  )
}