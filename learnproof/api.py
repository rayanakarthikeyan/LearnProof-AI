"""Local learning API. Start with: python -m uvicorn learnproof.api:app."""
import json
import os
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, Field

from . import assessment, provider, tutoring
from .ingestion import ingest, register
from .store import CONCEPTS, DATA, execute, initialize, json_value, rows, uid
from .config import load_environment as load_local_env


@asynccontextmanager
async def lifespan(app):
    load_local_env()
    initialize()
    execute("UPDATE sources SET status='failed',error='Ingestion was interrupted. Retry the source.' WHERE status IN ('queued','extracting')")
    from .sample import seed
    seed()
    yield


app = FastAPI(title='LearnProof AI',version='0.2.0',lifespan=lifespan)
app.add_middleware(TrustedHostMiddleware,allowed_hosts=['127.0.0.1','localhost','testserver'])


@app.middleware('http')
async def origin_boundary(request: Request,call_next):
    origin = request.headers.get('origin')
    if request.method not in ('GET','HEAD','OPTIONS') and origin and origin not in ('http://127.0.0.1:5173','http://localhost:5173','http://127.0.0.1:8000','http://localhost:8000'):
        from fastapi.responses import JSONResponse
        return JSONResponse({'detail':'This local prototype does not accept that origin.'},status_code=403)
    return await call_next(request)


def course_exists(course):
    if not rows('SELECT id FROM courses WHERE id=?',(course,)):
        raise HTTPException(404,'Course not found.')


def learner_exists(learner):
    if not rows('SELECT id FROM learners WHERE id=?',(learner,)):
        raise HTTPException(404,'Learning profile not found.')


@app.get('/api/health')
def health():
    return {'status':'ok','provider_configured':provider.configured(),
            'model':provider.model_name() if provider.configured() else None,
            'mode':'gemini' if provider.configured() else 'local-excerpts',
            'deployment':'local-single-user','version':'0.2.0'}


@app.get('/api/courses')
def courses():
    return rows('SELECT * FROM courses')


class NameInput(BaseModel):
    name: str = Field(min_length=2,max_length=80)


@app.post('/api/courses')
def create_course(body: NameInput):
    id = uid('course')
    execute('INSERT INTO courses VALUES (?,?)',(id,body.name.strip()))
    return {'id':id,'name':body.name.strip()}


@app.get('/api/learners')
def learners():
    return rows('SELECT * FROM learners')


@app.post('/api/learners')
def create_learner(body: NameInput):
    id = uid('learner')
    execute('INSERT INTO learners VALUES (?,?)',(id,body.name.strip()))
    return {'id':id,'name':body.name.strip()}


@app.get('/api/courses/{course}/sources')
def sources(course: str):
    course_exists(course)
    records = rows('''SELECT s.id,s.name,s.kind,s.status,s.error,s.warnings,s.created_at,
                     (SELECT COUNT(*) FROM units WHERE source_id=s.id) AS unit_count
                     FROM sources s WHERE course_id=? ORDER BY created_at''',(course,))
    for record in records:
        record['warnings'] = json.loads(record['warnings'] or '[]')
    return records


@app.post('/api/courses/{course}/sources')
async def upload(course: str,background: BackgroundTasks,file: UploadFile=File(...)):
    course_exists(course)
    name = Path(file.filename or 'upload').name
    suffix = Path(name).suffix.lower()
    if suffix not in ('.pdf','.pptx','.mp4','.webm'):
        raise HTTPException(400,'Upload a PDF, PPTX, MP4 or WebM file.')
    directory = DATA / 'uploads'
    directory.mkdir(parents=True,exist_ok=True)
    path = directory / (uid('file')+suffix)
    limit = 100*1024*1024 if suffix in ('.mp4','.webm') else 25*1024*1024
    size = 0
    try:
        with path.open('wb') as output:
            while chunk := await file.read(1024*1024):
                size += len(chunk)
                if size > limit:
                    raise HTTPException(413,'Upload exceeds the file-size limit.')
                output.write(chunk)
        if not size:
            raise HTTPException(400,'The file is empty.')
        id = register(path,course,name=name)
    except Exception:
        path.unlink(missing_ok=True)
        raise
    finally:
        await file.close()
    background.add_task(ingest,id)
    return {'id':id,'status':'queued'}


@app.post('/api/sources/{source_id}/retry')
def retry(source_id: str,background: BackgroundTasks):
    records = rows('SELECT * FROM sources WHERE id=?',(source_id,))
    if not records:
        raise HTTPException(404,'Source not found.')
    if records[0]['status'] in ('queued','extracting'):
        raise HTTPException(409,'This source is already processing.')
    # Preserve source IDs used by existing assessment citations: re-extraction is allowed only for failed sources.
    if records[0]['status'] != 'failed':
        raise HTTPException(409,'Upload a new copy to reprocess an indexed source.')
    execute("UPDATE sources SET status='queued',error=NULL WHERE id=?",(source_id,))
    background.add_task(ingest,source_id)
    return {'status':'queued'}


@app.get('/api/sources/{source_id}/units')
def units(source_id: str):
    return [tutoring.citation(u)|{'concepts':json.loads(u['concepts']),'visual':u['visual'],
            'extraction':u['extraction']} for u in rows('SELECT * FROM units WHERE source_id=? ORDER BY page,start',(source_id,))]


@app.get('/api/sources/{source_id}/file')
def source_file(source_id: str):
    records = rows('SELECT * FROM sources WHERE id=?',(source_id,))
    if not records or not Path(records[0]['path']).is_file():
        raise HTTPException(404,'Source file not found.')
    kind = records[0]['kind']
    mime = {'pdf':'application/pdf','pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation','mp4':'video/mp4','webm':'video/webm'}[kind]
    return FileResponse(records[0]['path'],media_type=mime)


@app.get('/api/units/{unit_id}/image')
def unit_image(unit_id: str):
    records = rows('SELECT image FROM units WHERE id=?',(unit_id,))
    if not records or not records[0]['image'] or not Path(records[0]['image']).is_file():
        raise HTTPException(404,'Source preview not found.')
    return FileResponse(records[0]['image'],media_type='image/png')


class ChatInput(BaseModel):
    question: str = Field(min_length=3,max_length=2000)


@app.post('/api/courses/{course}/chat')
def chat(course: str,body: ChatInput,x_learner_id: str=Header('local-learner')):
    course_exists(course)
    learner_exists(x_learner_id)
    try:
        result = tutoring.answer(course,body.question)
    except provider.ProviderError as exc:
        raise HTTPException(502,str(exc)) from exc
    execute('INSERT INTO chats(id,learner_id,course_id,question,response) VALUES (?,?,?,?,?)',
            (uid('chat'),x_learner_id,course,body.question,json_value(result)))
    return result


@app.get('/api/courses/{course}/chats')
def chats(course: str,x_learner_id: str=Header('local-learner')):
    learner_exists(x_learner_id)
    return [{'id':r['id'],'question':r['question'],'response':json.loads(r['response'])} for r in
            rows('SELECT * FROM chats WHERE learner_id=? AND course_id=? ORDER BY created_at,rowid',(x_learner_id,course))[-40:]]


class PracticeInput(BaseModel):
    concept: str
    kind: str = 'mcq'
    adaptive: bool = True


@app.post('/api/courses/{course}/practice')
def practice(course: str,body: PracticeInput,x_learner_id: str=Header('local-learner')):
    course_exists(course)
    learner_exists(x_learner_id)
    if body.concept not in CONCEPTS or body.kind not in ('mcq','short','numerical'):
        raise HTTPException(400,'Invalid topic or question format.')
    try:
        return assessment.select(x_learner_id,course,body.concept,body.kind,body.adaptive)
    except provider.ProviderError as exc:
        raise HTTPException(502,str(exc)) from exc


class AnswerInput(BaseModel):
    answer: str = Field(min_length=1,max_length=2000)


@app.post('/api/questions/{question_id}/answer')
def submit(question_id: str,body: AnswerInput,x_learner_id: str=Header('local-learner')):
    learner_exists(x_learner_id)
    try:
        return assessment.submit(x_learner_id,question_id,body.answer)
    except ValueError as exc:
        raise HTTPException(409 if 'already' in str(exc) else 400,str(exc)) from exc
    except provider.ProviderError as exc:
        raise HTTPException(502,str(exc)) from exc


@app.get('/api/courses/{course}/progress')
def progress(course: str,x_learner_id: str=Header('local-learner')):
    course_exists(course)
    learner_exists(x_learner_id)
    topics = assessment.state(x_learner_id,course)
    attempts = rows('''SELECT a.id,a.correct,a.feedback,a.created_at,q.concept,q.prompt,q.kind
                     FROM attempts a JOIN questions q ON q.id=a.question_id
                     WHERE a.learner_id=? AND q.course_id=? ORDER BY a.created_at DESC,a.rowid DESC''',(x_learner_id,course))
    scored = [a for a in attempts if a['correct'] is not None]
    return {'topics':topics,'attempts':attempts[:30],'total_attempts':len(attempts),
            'scored_attempts':len(scored),'correct_attempts':sum(a['correct'] for a in scored),
            'observed_topics':sum(t['observations'] > 0 for t in topics),
            'estimate_note':'Provisional Bayesian estimates with illustrative parameters; not measured learning gains.'}


@app.get('/api/courses/{course}/evaluation')
def evaluation(course: str):
    course_exists(course)
    path = DATA / 'evaluation' / f'{course}.json'
    return json.loads(path.read_text()) if path.exists() else {
        'status':'not-run','message':'No Ragas benchmark has been run for this course. Metrics will appear after an actual evaluation run.'}
