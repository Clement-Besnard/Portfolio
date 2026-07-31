from bs4 import BeautifulSoup
from datetime import datetime, timezone
import requests

FR_URL = "https://www.nexity-studea.com/locations-etudiantes/chevilly-larue/studea-chevilly-larue-rungis-po0000333"
EN_URL = "https://www.nexity-studea.com/en/student-housing/chevilly-larue/studea-chevilly-larue-rungis-po0000333"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8",
}

# status -> message affiché côté front
MESSAGES = {
    "full": "❌ COMPLÈTE — Aucun logement disponible",
    "last_chance": "⚠️ DERNIÈRES DISPONIBILITÉS — Dépêche-toi !",
    "available": "✅ DES LOGEMENTS SONT DISPONIBLES !",
    "unknown": "❓ Statut inconnu — vérifier manuellement",
}


def _result(status, message=None):
    return {
        "status": status,
        "message": message or MESSAGES[status],
        "checkedAt": datetime.now(timezone.utc).isoformat(),
    }


def check_availability():
    """Scrape la page Studea et renvoie le statut de disponibilité."""
    try:
        r_fr = requests.get(FR_URL, headers=HEADERS, timeout=15)
        page_text = BeautifulSoup(r_fr.text, "html.parser").get_text(separator=" ", strip=True).lower()

        # La version anglaise est plus explicite quand la résidence est pleine
        r_en = requests.get(EN_URL, headers=HEADERS, timeout=15)
        text_en = r_en.text.lower()

        if "complete residence" in text_en or "résidence complète" in page_text:
            return _result("full")
        if "dernières disponibilités" in page_text:
            return _result("last_chance")
        if "disponible" in page_text or "réserver" in page_text:
            return _result("available")
        return _result("unknown")

    except Exception as e:
        return _result("error", f"🔴 Erreur réseau : {e}")
