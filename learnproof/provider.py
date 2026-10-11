"""Server-side structured Gemini adapter; failures never become canned AI answers."""
import json
import os
import time
from pathlib import Path


class ProviderError(RuntimeError):
    pass


def configured():
    return bool(os.environ.get('GEMINI_API_KEY', '').strip())


def model_name(verifier=False):
    return (os.environ.get('GEMINI_VERIFIER_MODEL') if verifier else None) or os.environ.get('GEMINI_MODEL', 'gemini-3.8-flash')


def generate(prompt, images=(), *, video=None, verifier=False):
    if not configured():
        raise ProviderError('Configure GEMINI_API_KEY on the server to enable this feature.')
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=os.environ['GEMINI_API_KEY'], http_options={'timeout': 90000})
    uploaded = None
    try:
        parts = [prompt]
        for image in images:
            parts.append(types.Part.from_bytes(data=Path(image).read_bytes(), mime_type='image/png'))
        if video:
            uploaded = client.files.upload(file=str(video))
            deadline = time.monotonic() + 180
            while uploaded.state.name == 'PROCESSING' and time.monotonic() < deadline:
                time.sleep(2)
                uploaded = client.files.get(name=uploaded.name)
            if uploaded.state.name != 'ACTIVE':
                raise ProviderError('The video did not finish processing. Try a shorter clip.')
            parts.append(uploaded)
        response = client.models.generate_content(
            model=model_name(verifier), contents=parts,
            config=types.GenerateContentConfig(response_mime_type='application/json', temperature=0.1))
        result = json.loads(response.text)
        if not isinstance(result, dict):
            raise ProviderError('Provider returned an invalid structured response.')
        return result
    except ProviderError:
        raise
    except Exception as exc:
        # Do not echo SDK errors that could contain request details or credentials.
        raise ProviderError('The AI provider request failed. Check the configured model, key and quota.') from exc
    finally:
        if uploaded:
            try:
                client.files.delete(name=uploaded.name)
            except Exception:
                pass
        client.close()
