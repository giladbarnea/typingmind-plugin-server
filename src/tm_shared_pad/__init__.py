import json
import os
from datetime import datetime
from urllib import error, parse, request

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- tiny helper: load .env.local in local dev (no third-party dotenv) ---
if not os.getenv("BLOB_READ_WRITE_TOKEN"):
    try:
        with open(".env.local", "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                k, v = line.split("=", 1)
                if k.strip() == "BLOB_READ_WRITE_TOKEN" and not os.getenv(
                    "BLOB_READ_WRITE_TOKEN"
                ):
                    os.environ["BLOB_READ_WRITE_TOKEN"] = v.strip().strip('"')
                    break
    except FileNotFoundError:
        pass

BLOB_TOKEN = os.getenv("BLOB_READ_WRITE_TOKEN")
if not BLOB_TOKEN:
    raise RuntimeError(
        "BLOB_READ_WRITE_TOKEN is not set. Configure it in Vercel or .env.local for local runs."
    )

# Token format: vercel_blob_rw_<team>_<storeId>_...
# We derive the public read base URL from the store id so we can GET pads directly.
# Example: https://<storeId>.public.blob.vercel-storage.com/pads/<chat_id>.md
_store_parts = BLOB_TOKEN.split("_")
STORE_ID = _store_parts[3] if len(_store_parts) > 3 else ""
if not STORE_ID:
    raise RuntimeError("Could not parse store id from BLOB_READ_WRITE_TOKEN.")
PUBLIC_BASE = f"https://{STORE_ID}.public.blob.vercel-storage.com"

# Upload endpoint used by the official SDK internally:
# PUT https://vercel.com/api/blob/?pathname=<path>
# headers: Authorization: Bearer <BLOB_READ_WRITE_TOKEN>
#          x-content-type: <mime>
#          x-allow-overwrite: 1 (optional)
API_BASE = "https://vercel.com/api/blob/"


def _blob_read(pathname: str) -> tuple[int, str]:
    """Return (status_code, text). 404 => (404, "")."""
    url = f"{PUBLIC_BASE}/{pathname}"
    req = request.Request(url, method="GET")
    try:
        with request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            return resp.getcode(), body
    except error.HTTPError as e:
        if e.code == 404:
            return 404, ""
        raise


def _blob_write(pathname: str, content: str) -> dict:
    url = f"{API_BASE}?" + parse.urlencode({"pathname": pathname})
    data = content.encode("utf-8")
    headers = {
        "authorization": f"Bearer {BLOB_TOKEN}",
        "x-content-type": "text/markdown; charset=utf-8",
        "x-allow-overwrite": "1",  # overwrite same key is fine for this MVP
    }
    req = request.Request(url, data=data, headers=headers, method="PUT")
    with request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
        try:
            return json.loads(raw)
        except Exception:
            return {"ok": resp.getcode() == 200, "raw": raw}


# --- Pad helpers using Blob ---


def _pad_path(chat_id: str) -> str:
    # Ensure no slashes leak into the path (SDK disallows "//").
    safe = parse.quote(chat_id, safe="")
    return f"pads/{safe}.md"


def read_pad_text(chat_id: str) -> str:
    status, text = _blob_read(_pad_path(chat_id))
    if status == 404:
        return ""
    return text


def write_pad_text(chat_id: str, text: str) -> None:
    _blob_write(_pad_path(chat_id), text)


def remove_frontmatter(content: str) -> str:
    closing_horizontal_rule_index = 0
    for index, line in enumerate(map(str.strip, content.split("\n"))):
        if index == 0 and line != "---":
            # No frontmatter, return original content
            return content
        if index == 0 and line == "---":
            continue
        if line == "---":
            closing_horizontal_rule_index = index
            break
    return "\n".join(content.split("\n")[closing_horizontal_rule_index + 1 :])


def ensure_frontmatter(
    chat_id: str, content: str, old_content: str | None = None
) -> str:
    """Ensure frontmatter-like metadata for pad content at the top of the file."""
    file_path = file_for(chat_id)
    content_length = len(content) if content else 0
    old_content_length = len(old_content) if old_content else 0
    if content:
        # Remove existing frontmatter block if exists
        content = remove_frontmatter(content)

    frontmatter_lines = [
        "---",
        f"chat_id: {chat_id}",
        f"file_path: {file_path}",
        f"file_created_at: {datetime.fromtimestamp(file_path.stat().st_ctime).strftime('%Y-%m-%d %H:%M:%S')}",
        f"content_length: {content_length}",
    ]

    if old_content is not None:
        frontmatter_lines.append(f"old_content_length: {old_content_length}")

    frontmatter_lines.append("---")

    return "\n".join(frontmatter_lines) + "\n" + content


class PadPostRequest(BaseModel):
    text: str


@app.get("/pad/{chat_id}")
def get_pad(chat_id: str) -> dict:
    content = read_pad_text(chat_id)
    # return {"text": ensure_frontmatter(chat_id, content)}
    return {"text": content}


@app.post("/pad/{chat_id}")
def pad_action(chat_id: str, req: PadPostRequest) -> dict:
    # Get old content length before writing
    # old_content = read_pad_text(chat_id)
    write_pad_text(chat_id, req.text)
    # return {"ok": True, "text": ensure_frontmatter(chat_id, req.text, old_content)}
    return {"ok": True, "text": req.text}


@app.get("/hi")
def hi() -> dict:
    return {"ok": True}
