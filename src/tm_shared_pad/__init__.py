import os
import re
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
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

BASE_DIR = Path(os.getenv("PAD_DIR", Path.cwd() / "pads"))
BASE_DIR.mkdir(parents=True, exist_ok=True)


def file_for(chat_id: str) -> Path:
    path = BASE_DIR / f"{chat_id}.md"
    path.touch(exist_ok=True)
    return path


def read_pad_text(chat_id: str) -> str:
    return file_for(chat_id).read_text(encoding="utf-8")


def write_pad_text(chat_id: str, text: str) -> None:
    file_for(chat_id).write_text(text, encoding="utf-8")


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
    return {"text": ensure_frontmatter(chat_id, content)}


@app.post("/pad/{chat_id}")
def pad_action(chat_id: str, req: PadPostRequest) -> dict:
    # Get old content length before writing
    old_content = read_pad_text(chat_id)
    write_pad_text(chat_id, req.text)
    return {"ok": True, "text": ensure_frontmatter(chat_id, req.text, old_content)}


@app.get("/hi")
def hi() -> dict:
    return {"ok": True}
