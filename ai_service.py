"""
Astrogalaxy — Servicio de Inteligencia Artificial
Lenguaje: Python 3.11+   ·   Framework: FastAPI

Recibe la foto de evidencia y decide si corresponde al reto, devolviendo
una confianza (0-1) y los puntos sugeridos. Detecta además fotos repetidas
mediante un hash perceptual.

Ejecutar:
    pip install -r requirements.txt
    uvicorn ai_service:app --reload --port 8000
"""

from fastapi import FastAPI, UploadFile, Form
from PIL import Image
import imagehash          # hash perceptual para detectar fotos repetidas
import io

app = FastAPI(title="Astrogalaxy AI")

# Puntos base por reto (en producción vendría de la base de datos)
CHALLENGE_POINTS = {
    "recycle-classroom": 150,
    "no-plastic-week": 300,
    "galactic-reforest": 800,
}

# "Memoria" simple de hashes ya vistos (en producción: Redis / PostgreSQL)
SEEN_HASHES: set[str] = set()


def classify_image(image: Image.Image, challenge: str) -> float:
    """
    Devuelve la confianza (0-1) de que la imagen corresponde al reto.

    Aquí iría tu modelo de visión real (PyTorch/TensorFlow o una API de
    visión). Para el ejemplo devolvemos una confianza simulada.
    """
    # modelo = torch.load("models/eco_classifier.pt")
    # pred = modelo(preprocess(image))
    # return float(pred[CHALLENGE_LABELS[challenge]])
    return 0.97


@app.post("/verify")
async def verify(photo: UploadFile, challenge: str = Form(...)):
    raw = await photo.read()
    image = Image.open(io.BytesIO(raw)).convert("RGB")

    # 1) ¿Es una foto repetida?
    phash = str(imagehash.phash(image))
    is_duplicate = phash in SEEN_HASHES
    SEEN_HASHES.add(phash)

    # 2) ¿Corresponde al reto?
    confidence = classify_image(image, challenge)

    approved = (confidence >= 0.80) and not is_duplicate
    points = CHALLENGE_POINTS.get(challenge, 100) if approved else 0

    return {
        "ai_verified": approved,
        "confidence": round(confidence, 2),
        "duplicate": is_duplicate,
        "points": points,
    }


@app.get("/health")
def health():
    return {"status": "ok"}
