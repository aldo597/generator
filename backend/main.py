from fastapi import FastAPI, UploadFile, Response, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from logic import *
from pydantic import BaseModel
import uvicorn
import asyncio
import httpx
import os
from bs4 import BeautifulSoup  # Sicherstellen, dass BeautifulSoup importiert ist

class BildRequest(BaseModel):
    punkt: str
    tag: str
    titel: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Exception Handler
# -----------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Fehler bei {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Ein interner Serverfehler ist aufgetreten.", "details": str(exc)}
    )

# -----------------------------
# Async Helferfunktionen
# -----------------------------
async def fetch_website_text(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36"
    }
    async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
        response = await client.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()
        lines = (line.strip() for line in soup.get_text().splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        clean_text = "\n".join(chunk for chunk in chunks if chunk)
        return clean_text

async def parse_weeks_async(url: str):
    text = await fetch_website_text(url)
    wochen = await asyncio.to_thread(get_weeks_from_text, text)
    return wochen

async def parse_days_async(url: str, week: str):
    text = await fetch_website_text(url)
    print("Länge des Textes:", len(text))
    print("Erster Textausschnitt:", text[:500])
    tage = await asyncio.to_thread(tage_ausgeben, week, text)  # Funktion aus logic.py
    print("Gefundene Tage:", tage)
    return tage

async def parse_pdf_async(url: str, tag: str):
    result = await asyncio.to_thread(pdf_finden, url, tag)
    if result is None:
        return None
    pdf_link, xml_link = result
    text = await asyncio.to_thread(read_pdf_with_pdfplumber, pdf_link)
    struktur = await asyncio.to_thread(parse_inhaltsverzeichnis, text)
    return struktur

async def process_bild_async(punkt, tag, titel):
    return await asyncio.to_thread(process_abstimmung, punkt, tag, titel)

# -----------------------------
# Endpoints
# -----------------------------
@app.get("/wochen")
async def get_wochen():
    url = 'https://www.europarl.europa.eu/plenary/en/votes.html?tab=votes#banner_session_live'
    wochen = await parse_weeks_async(url)
    if not wochen:
        raise HTTPException(status_code=404, detail="Wochen nicht gefunden")
    return {"wochen": wochen}

@app.get("/tage")
async def get_tage(week: str):
    url = 'https://www.europarl.europa.eu/plenary/en/votes.html?tab=votes#banner_session_live'
    tage = await parse_days_async(url, week)
    if not tage:
        raise HTTPException(status_code=404, detail=f"Keine Tage für Woche {week} gefunden")
    return {"tage": tage}

@app.get("/punkte")
async def get_punkte(tag: str):
    url = 'https://www.europarl.europa.eu/plenary/en/votes.html?tab=votes#banner_session_live'
    struktur = await parse_pdf_async(url, tag)
    if struktur is None:
        raise HTTPException(status_code=404, detail=f"No votes could be found for the day '{tag}'.")
    return struktur

@app.post("/bild")
async def bild_generieren(body: BildRequest):
    img_path = await process_bild_async(body.punkt, body.tag, body.titel)
    if not img_path:
        raise HTTPException(status_code=404, detail="Bild konnte nicht generiert werden")
    return FileResponse(img_path, media_type="image/png")

# -----------------------------
# Server starten
# -----------------------------
if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8001)),
        log_level="info"
    )
