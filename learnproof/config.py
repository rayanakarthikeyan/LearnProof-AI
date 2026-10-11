"""Small allow-listed .env loader; existing process environment wins."""
import os
from pathlib import Path


def load_environment():
    path = Path('.env')
    if not path.exists():
        return
    allowed = {'GEMINI_API_KEY','GEMINI_MODEL','GEMINI_VERIFIER_MODEL','LEARNPROOF_DATA_DIR'}
    for line in path.read_text(encoding='utf-8').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key,value = line.split('=',1)
            if key.strip() in allowed:
                os.environ.setdefault(key.strip(),value.strip().strip('"\''))
