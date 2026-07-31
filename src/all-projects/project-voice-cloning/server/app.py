from flask import Flask, request, send_file, jsonify
from faster_whisper import WhisperModel
from flask_cors import CORS
from omnivoice import OmniVoice
import soundfile as sf
import torch
import tempfile
import os

app = Flask(__name__)

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

CORS(
    app,
    resources={r"/api/*": {"origins": [FRONTEND_ORIGIN]}}
)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Périphérique utilisé : {DEVICE}")

print("Chargement du modèle OmniVoice...")
omnivoice_model = OmniVoice.from_pretrained(
    "k2-fsa/OmniVoice",
    device_map=DEVICE,
    dtype=torch.float16 if DEVICE == "cuda" else torch.float32
)
print("Modèle prêt.")

print("Chargement du modèle Faster Whisper...")
whisper_model = WhisperModel(
    "small",
    device=DEVICE,
    compute_type="float16" if DEVICE == "cuda" else "int8"
)
print("Modèle prêt.")


@app.route("/api/stt", methods=["POST"])
def stt():
    if "audio" not in request.files:
        return jsonify({"message": "Champ 'audio' manquant."}), 400

    audio_file = request.files["audio"]

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_in:
        audio_file.save(tmp_in.name)
        audio_path = tmp_in.name

    try:
        # language=None => détection automatique de la langue
        segments, info = whisper_model.transcribe(audio_path)
        transcript = " ".join(segment.text.strip() for segment in segments).strip()

        return jsonify({
            "transcript": transcript,
            "language": info.language,
        })

    except Exception as e:
        return jsonify({"message": str(e)}), 500

    finally:
        if os.path.exists(audio_path):
            os.unlink(audio_path)


@app.route("/api/clone", methods=["POST"])
def clone():
    if "audio" not in request.files:
        return jsonify({"message": "Champ 'audio' manquant."}), 400

    audio_file = request.files["audio"]
    ref_text = request.form.get("transcript", "").strip()
    target_text = request.form.get("text", "").strip()

    if not ref_text:
        return jsonify({"message": "Champ 'transcript' manquant ou vide."}), 400
    if not target_text:
        return jsonify({"message": "Champ 'text' manquant ou vide."}), 400
    if not audio_file.filename.lower().endswith(".wav"):
        return jsonify({"message": "Seuls les fichiers .wav sont acceptés."}), 400

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_in:
        audio_file.save(tmp_in.name)
        ref_audio_path = tmp_in.name

    out_path = tempfile.mktemp(suffix=".wav")

    try:
        audio = omnivoice_model.generate(
            ref_audio=ref_audio_path,
            text=target_text,
            ref_text=ref_text,
        )
        sf.write(out_path, audio[0], 24000)

        return send_file(
            out_path,
            mimetype="audio/wav",
            as_attachment=True,
            download_name="voice-clone-output.wav"
        )

    except Exception as e:
        return jsonify({"message": str(e)}), 500

    finally:
        if os.path.exists(ref_audio_path):
            os.unlink(ref_audio_path)

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
