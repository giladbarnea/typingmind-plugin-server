from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI()


# In-memory pad text
PAD_TEXT = ""


class PadPutRequest(BaseModel):
    text: str


@app.get("/pad")
def get_pad() -> dict:
    return {"text": PAD_TEXT}


@app.put("/pad")
def put_pad(req: PadPutRequest) -> dict:
    global PAD_TEXT
    PAD_TEXT = req.text
    return {"ok": True, "text": PAD_TEXT}


@app.get("/hi")
def hi() -> dict:
    return {"ok": True}
