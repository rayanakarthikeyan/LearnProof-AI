"""SQLite persistence for a loopback-only, single-machine prototype."""

import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4
from .config import load_environment

load_environment()
DATA = Path(os.environ.get("LEARNPROOF_DATA_DIR", ".local-data")).resolve()


def uid(prefix: str) -> str:
    return prefix + "_" + uuid4().hex


@contextmanager
def connection():
    DATA.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DATA / "learnproof.db", timeout=20)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def initialize():
    with connection() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS courses(id TEXT PRIMARY KEY, name TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS learners(id TEXT PRIMARY KEY, name TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sources(
          id TEXT PRIMARY KEY, course_id TEXT REFERENCES courses(id), name TEXT,
          kind TEXT, path TEXT, hash TEXT, status TEXT, error TEXT, warnings TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS units(
          id TEXT PRIMARY KEY, source_id TEXT REFERENCES sources(id), course_id TEXT,
          text TEXT, concepts TEXT, page INTEGER, start REAL, end REAL,
          image TEXT, visual TEXT, extraction TEXT);
        CREATE TABLE IF NOT EXISTS questions(
          id TEXT PRIMARY KEY, course_id TEXT, concept TEXT, kind TEXT,
          difficulty INTEGER, prompt TEXT, payload TEXT, source_ids TEXT,
          verification TEXT, fingerprint TEXT);
        CREATE TABLE IF NOT EXISTS attempts(
          id TEXT PRIMARY KEY, learner_id TEXT REFERENCES learners(id),
          question_id TEXT REFERENCES questions(id), answer TEXT, correct INTEGER,
          feedback TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(learner_id,question_id));
        CREATE TABLE IF NOT EXISTS mastery(
          learner_id TEXT, course_id TEXT, concept TEXT, estimate REAL,
          observations INTEGER, PRIMARY KEY(learner_id,course_id,concept));
        CREATE TABLE IF NOT EXISTS chats(
          id TEXT PRIMARY KEY, learner_id TEXT, course_id TEXT, question TEXT,
          response TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS concepts(
          course_id TEXT, id TEXT, name TEXT, description TEXT, prerequisites TEXT,
          origin TEXT, PRIMARY KEY(course_id,id));
        CREATE TABLE IF NOT EXISTS exams(
          id TEXT PRIMARY KEY, learner_id TEXT, course_id TEXT, question_ids TEXT,
          scope TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS repair_sessions(
          learner_id TEXT, course_id TEXT, target TEXT, stage TEXT, probe TEXT,
          question_id TEXT, PRIMARY KEY(learner_id,course_id));
        CREATE TABLE IF NOT EXISTS vectors(unit_id TEXT PRIMARY KEY,model TEXT,embedding TEXT);
        CREATE INDEX IF NOT EXISTS units_course ON units(course_id);
        CREATE INDEX IF NOT EXISTS questions_scope ON questions(course_id,concept,kind);
        CREATE INDEX IF NOT EXISTS attempts_learner ON attempts(learner_id);
        """)
        db.execute(
            "INSERT OR IGNORE INTO courses VALUES ('data-structures', 'Data Structures Foundations')"
        )
        db.execute(
            "INSERT OR IGNORE INTO learners VALUES ('local-learner', 'My learning space')"
        )
        for concept, meta in CONCEPTS.items():
            db.execute(
                "INSERT OR IGNORE INTO concepts VALUES (?,?,?,?,?,?)",
                (
                    "data-structures",
                    concept,
                    meta["name"],
                    meta["description"],
                    json_value(meta["prerequisites"]),
                    "authored-course-graph",
                ),
            )


def rows(query, args=()):
    with connection() as db:
        return [dict(r) for r in db.execute(query, args).fetchall()]


def execute(query, args=()):
    with connection() as db:
        db.execute(query, args)


def json_value(value):
    return json.dumps(value, ensure_ascii=False)


CONCEPTS = {
    "pointers": {
        "name": "Pointers & references",
        "prerequisites": [],
        "description": "Understand what a reference points to.",
    },
    "traversal": {
        "name": "Linked-list traversal",
        "prerequisites": ["pointers"],
        "description": "Follow next links, one node at a time.",
    },
    "insertion": {
        "name": "Insertion & rewiring",
        "prerequisites": ["pointers"],
        "description": "Preserve links when inserting a node.",
    },
    "complexity": {
        "name": "Operation complexity",
        "prerequisites": ["traversal", "insertion"],
        "description": "Distinguish finding a position from changing links.",
    },
    "stacks": {
        "name": "Stacks & LIFO",
        "prerequisites": [],
        "description": "Trace the last-in, first-out rule.",
    },
    "queues": {
        "name": "Queues & FIFO",
        "prerequisites": [],
        "description": "Trace the first-in, first-out rule.",
    },
}


def course_concepts(course):
    return {
        r["id"]: {
            "name": r["name"],
            "description": r["description"],
            "prerequisites": json.loads(r["prerequisites"]),
            "origin": r["origin"],
        }
        for r in rows(
            "SELECT * FROM concepts WHERE course_id=? ORDER BY rowid", (course,)
        )
    }
