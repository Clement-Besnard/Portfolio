from flask import Flask, jsonify
from flask_cors import CORS
from methods import check_availability
from datetime import datetime, timezone
import threading
import time
import os

app = Flask(__name__)

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "60"))  # secondes entre deux scrapings
HISTORY_SIZE = 20

CORS(
    app,
    resources={r"/api/*": {"origins": [FRONTEND_ORIGIN]}}
)

# Dernier résultat + historique, partagés entre le thread de veille et les requêtes
_lock = threading.Lock()
_last_result = None
_history = []


def _record(result):
    global _last_result
    with _lock:
        _last_result = result
        _history.append(result)
        del _history[:-HISTORY_SIZE]
    print(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {result['message']}")


def _watch_loop():
    """Vérifie la disponibilité en continu pour que le front ait toujours un statut frais."""
    while True:
        _record(check_availability())
        time.sleep(POLL_INTERVAL)


@app.route("/api/scouts/status", methods=["GET"])
def status():
    """Dernier statut connu (sans relancer de scraping)."""
    with _lock:
        result = _last_result
        history = list(_history)

    if result is None:
        return jsonify({"message": "Aucune vérification effectuée pour le moment."}), 503

    return jsonify({**result, "pollInterval": POLL_INTERVAL, "history": history})


@app.route("/api/scouts/check", methods=["POST"])
def check():
    """Force une vérification immédiate."""
    result = check_availability()
    _record(result)

    if result["status"] == "error":
        return jsonify(result), 502

    return jsonify(result)


if __name__ == "__main__":
    threading.Thread(target=_watch_loop, daemon=True).start()
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
