# src/typingmind_plugin_server/__init__.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path

app = FastAPI()

PAD_FILE = Path.cwd() / "pad.md"

class PadAction(BaseModel):
    action: str          # "get" | "set"
    text: str | None = None

def read_pad() -> str:
    try:
        return PAD_FILE.read_text(encoding="utf-8")
    except FileNotFoundError:
        return ""

def write_pad(text: str) -> None:
    PAD_FILE.write_text(text, encoding="utf-8")

@app.post("/pad")
def pad(req: PadAction):
    a = req.action.lower().strip()
    if a == "get":
        return {"text": read_pad()}
    if a == "set":
        if req.text is None:
            raise HTTPException(status_code=400, detail="text is required for action 'set'")
        write_pad(req.text)
        return {"ok": True, "text": req.text}
    raise HTTPException(status_code=400, detail="action must be 'get' or 'set'")
