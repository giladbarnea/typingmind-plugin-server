from fastapi import FastAPI


app = FastAPI()


@app.get("/hi")
def hi() -> dict:
    return {"ok": True}
