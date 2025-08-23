# src/typingmind_plugin_server/__init__.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import os

app = FastAPI()

# Allow browser-based calls (TypingMind client) without CORS issues.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # KISS: open CORS for MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File-based pad storage (repo root). Override with PAD_FILE env if you like.
PAD_FILE = Path(os.getenv("PAD_FILE", Path.cwd() / "pad.md"))

def read_pad_text() -> str:
    try:
        return PAD_FILE.read_text(encoding="utf-8")
    except FileNotFoundError:
        return ""

def write_pad_text(text: str) -> None:
    PAD_FILE.write_text(text, encoding="utf-8")

class PadPutRequest(BaseModel):
    text: str

class PadAction(BaseModel):
    action: str  # "get" | "set"
    text: str | None = None

@app.get("/pad")
def get_pad() -> dict:
    # Kept for convenience/back-compat
    return {"text": read_pad_text()}

@app.put("/pad")
def put_pad(req: PadPutRequest) -> dict:
    # Kept for convenience/back-compat
    write_pad_text(req.text)
    return {"ok": True, "text": req.text}

@app.post("/pad")
def pad_action(req: PadAction) -> dict:
    act = req.action.lower().strip()
    if act == "get":
        return {"text": read_pad_text()}
    if act == "set":
        if req.text is None:
            raise HTTPException(status_code=400, detail="text is required for action 'set'")
        write_pad_text(req.text)
        return {"ok": True, "text": req.text}
    raise HTTPException(status_code=400, detail="action must be 'get' or 'set'")

@app.get("/hi")
def hi() -> dict:
    return {"ok": True}
