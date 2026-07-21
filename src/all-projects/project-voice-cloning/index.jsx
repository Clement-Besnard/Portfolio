import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './style.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5172'

// Encode un AudioBuffer (mono, canal 0) en WAV PCM 16 bits.
// Le navigateur enregistre en webm/opus ; le backend (libsndfile) n'accepte
// que le WAV, d'où la conversion côté client.
function audioBufferToWav(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate
  const samples = audioBuffer.getChannelData(0)
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)          // taille du sous-bloc fmt
  view.setUint16(20, 1, true)           // format PCM
  view.setUint16(22, 1, true)           // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // débit d'octets
  view.setUint16(32, 2, true)           // alignement de bloc
  view.setUint16(34, 16, true)          // bits par échantillon
  writeString(36, 'data')
  view.setUint32(40, samples.length * 2, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }

  return new Blob([view], { type: 'audio/wav' })
}

const MAX_RECORD_SECONDS = 30
const formatTime = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`

export default function VoiceCloningProject() {
  const [audioFile, setAudioFile] = useState(null)
  const [audioURL, setAudioURL] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [targetText, setTargetText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [outputAudio, setOutputAudio] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const recordTimerRef = useRef(null)

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

  const transcribe = async (file) => {
    setIsTranscribing(true)
    setTranscript('')

    try {
      const formData = new FormData()
      formData.append('audio', file)

      const res = await fetch(`${API_BASE_URL}/api/stt`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.message || `Erreur ${res.status}`)
      }

      const json = await res.json()
      setTranscript(json.transcript ?? '')
    } catch (err) {
      setError(
        `Transcription automatique impossible (${err.message}). Tu peux saisir le transcript à la main.`
      )
    } finally {
      setIsTranscribing(false)
    }
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
    transcribe(file)
  }

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const recorder = new MediaRecorder(stream)
      const chunks = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        mediaStreamRef.current = null
        try {
          const arrayBuffer = await new Blob(chunks, { type: recorder.mimeType }).arrayBuffer()
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
          await audioCtx.close()

          const wav = audioBufferToWav(audioBuffer)
          handleFile(new File([wav], `enregistrement-${Date.now()}.wav`, { type: 'audio/wav' }))
        } catch (err) {
          setError(`Conversion de l'enregistrement impossible : ${err.message}`)
        }
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setRecordSeconds(0)
      setIsRecording(true)
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    } catch (err) {
      setError(`Accès au micro refusé ou indisponible (${err.message}).`)
    }
  }

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current)
      recordTimerRef.current = null
    }
    const rec = mediaRecorderRef.current
    if (rec && rec.state !== 'inactive') rec.stop() // -> onstop -> conversion -> handleFile
    setIsRecording(false)
  }

  // Arrêt automatique à MAX_RECORD_SECONDS
  useEffect(() => {
    if (isRecording && recordSeconds >= MAX_RECORD_SECONDS) stopRecording()
  }, [isRecording, recordSeconds])

  // Nettoyage si on quitte la page en plein enregistrement
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current)
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

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
    setTranscript('')
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
    !isLoading &&
    !isTranscribing

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
            <span>Voix de référence</span>
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

          <div className="vc-record-divider"><span>ou</span></div>

          {!isRecording ? (
            <button
              type="button"
              className="vc-record-btn"
              onClick={startRecording}
              disabled={isTranscribing || isLoading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              Enregistrer au micro
            </button>
          ) : (
            <button
              type="button"
              className="vc-record-btn vc-record-btn--recording"
              onClick={stopRecording}
            >
              <span className="vc-record-dot" aria-hidden="true" />
              Arrêter · {formatTime(recordSeconds)} / 0:30
            </button>
          )}

          {audioURL && (
            <div className="vc-audio-preview">
              <audio controls src={audioURL} aria-label="Aperçu du fichier audio" />
            </div>
          )}
        </div>

        <div className="vc-step">
          <div className="vc-step-label">
            <span className="vc-step-num">2</span>
            <span>Transcript de l’audio</span>
            {isTranscribing && (
              <span className="vc-transcribing">
                <span className="vc-spinner" aria-hidden="true" />
                Transcription en cours…
              </span>
            )}
          </div>

          <textarea
            className="vc-textarea"
            placeholder={
              isTranscribing
                ? 'Transcription automatique en cours…'
                : 'Rempli automatiquement après l’ajout du WAV — modifiable si besoin.'
            }
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
            disabled={isTranscribing}
            aria-label="Transcript de l'audio de référence"
          />

          <p className="vc-hint">
            Généré par reconnaissance vocale (Whisper). Corrige-le si la transcription
            comporte des erreurs.
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