"""Optional real semantic vectors and reciprocal-rank fusion, with explicit fallback."""

import json
import math
from . import provider
from .store import execute, json_value, rows


def cosine(a, b):
    if not a or len(a) != len(b):
        return 0
    denominator = math.sqrt(sum(x * x for x in a) * sum(x * x for x in b))
    return sum(x * y for x, y in zip(a, b)) / denominator if denominator else 0


def index_course(course, source=None):
    units = rows(
        "SELECT u.* FROM units u JOIN sources s ON s.id=u.source_id WHERE u.course_id=? AND s.status='indexed'",
        (course,),
    )
    units = [u for u in units if source is None or u["source_id"] == source]
    missing = [
        u
        for u in units
        if not rows("SELECT unit_id FROM vectors WHERE unit_id=?", (u["id"],))
    ]
    for start in range(0, len(missing), 12):
        batch = missing[start : start + 12]
        vectors = provider.embed([u["text"][:20000] for u in batch])
        for unit, vector in zip(batch, vectors):
            execute(
                "INSERT OR REPLACE INTO vectors VALUES (?,?,?)",
                (unit["id"], "gemini-embedding-001", json_value(vector)),
            )
    return len(missing)


def fuse(course, question, lexical, limit):
    vectors = rows(
        "SELECT v.* FROM vectors v JOIN units u ON u.id=v.unit_id WHERE u.course_id=?",
        (course,),
    )
    if not vectors or not provider.configured():
        return lexical[:limit]
    try:
        query = provider.embed([question], query=True)[0]
    except provider.ProviderError:
        return lexical[:limit]
    ranked = sorted(
        [(cosine(query, json.loads(v["embedding"])), v["unit_id"]) for v in vectors],
        reverse=True,
    )
    # Only a retrieval gate; final semantic claim support is independently checked.
    semantic = [id for score, id in ranked if score >= 0.4][:12]
    scores = {}
    for ranking in ([u["id"] for u in lexical], semantic):
        for rank, id in enumerate(ranking, 1):
            scores[id] = scores.get(id, 0) + 1 / (60 + rank)
    ids = sorted(scores, key=lambda id: (-scores[id], id))[:limit]
    return [rows("SELECT * FROM units WHERE id=?", (id,))[0] for id in ids]
