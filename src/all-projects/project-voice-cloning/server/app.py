from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from omnivoice import OmniVoice
import soundfile as sf
import torch
import tempfile
import os

app = Flask(__name__)

CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:5173"]}}
)

print("Chargement du modèle OmniVoice...")
model = OmniVoice.from_pretrained(
    "k2-fsa/OmniVoice",
    device_map="cuda:0",
    dtype=torch.float32
)
print("Modèle prêt.")

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
        audio = model.generate(
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
    app.run(host="0.0.0.0", port=5000, debug=False)