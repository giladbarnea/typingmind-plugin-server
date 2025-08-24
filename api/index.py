import os
import sys

# Ensure the local src/ directory is importable when running on Vercel
CURRENT_DIR = os.path.dirname(__file__)
SRC_DIR = os.path.normpath(os.path.join(CURRENT_DIR, "..", "src"))
if SRC_DIR not in sys.path:
    sys.path.append(SRC_DIR)

from tm_shared_pad import app as fastapi_app

# Vercel's Python runtime will detect this ASGI app
app = fastapi_app