from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path


app = FastAPI()


# File-based pad storage
PAD_FILE = Path(__file__).resolve().parents[2] / "pad.md"


def read_pad_text() -> str:
    if PAD_FILE.exists():
        return PAD_FILE.read_text(encoding="utf-8")
    return ""


def write_pad_text(text: str) -> None:
    PAD_FILE.write_text(text, encoding="utf-8")


class PadPutRequest(BaseModel):
    text: str


@app.get("/pad")
def get_pad() -> dict:
    return {"text": read_pad_text()}


@app.put("/pad")
def put_pad(req: PadPutRequest) -> dict:
    write_pad_text(req.text)
    return {"ok": True, "text": req.text}


@app.get("/hi")
def hi() -> dict:
    return {"ok": True}
