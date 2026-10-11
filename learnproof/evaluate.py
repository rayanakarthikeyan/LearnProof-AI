"""Real Ragas runner; requires a provider key and optional evaluation packages."""
import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path

from . import provider, tutoring
from .store import DATA, initialize, rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--course',default='data-structures')
    parser.add_argument('--gold',default='evaluation/gold.sample.jsonl')
    args = parser.parse_args()
    from .api import load_local_env
    load_local_env()
    if not provider.configured():
        parser.error('Set GEMINI_API_KEY in .env or the server environment. No benchmark was run.')
    try:
        from ragas import EvaluationDataset, evaluate
        from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
        from ragas.llms import LangchainLLMWrapper
        from ragas.embeddings import LangchainEmbeddingsWrapper
        from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
    except ImportError:
        parser.error('Install requirements-evaluation.txt first. No benchmark was run.')
    initialize()
    gold = [json.loads(line) for line in Path(args.gold).read_text(encoding='utf-8').splitlines() if line.strip()]
    if not gold or not any(not g['off_material'] for g in gold):
        parser.error('The gold set must contain answerable questions.')
    evidence = rows('SELECT u.*,s.name AS source_name FROM units u JOIN sources s ON u.source_id=s.id WHERE u.course_id=?',(args.course,))
    records, raw, off_count, off_refusals, false_refusals = [], [], 0, 0, 0
    for item in gold:
        context_ids = {u['id'] for u in evidence if any(u['source_name']==loc['source_name'] and u['page']==loc.get('page') for loc in item['locations'])}
        if not item['off_material'] and not context_ids:
            parser.error('A gold reference location does not resolve. Check the course/source names.')
        start = time.monotonic()
        result = tutoring.answer(args.course,item['question'])
        retrieved = tutoring.retrieve(args.course,item['question'])
        raw.append({'question':item['question'],'reference':item['reference'],'expected_unit_ids':sorted(context_ids),
                    'response':result,'retrieved_unit_ids':[u['id'] for u in retrieved],
                    'latency_seconds':time.monotonic()-start})
        if item['off_material']:
            off_count += 1
            off_refusals += result['status']=='unsupported'
            continue
        false_refusals += result['status']=='unsupported'
        records.append({'user_input':item['question'],'response':' '.join(c['text'] for c in result['claims']) or result['message'],
                        'retrieved_contexts':[u['text'] for u in retrieved],
                        'reference':item['reference']})
    import os
    llm = LangchainLLMWrapper(ChatGoogleGenerativeAI(model=provider.model_name(True),google_api_key=os.environ['GEMINI_API_KEY'],temperature=0))
    embeddings = LangchainEmbeddingsWrapper(GoogleGenerativeAIEmbeddings(model='models/gemini-embedding-001',google_api_key=os.environ['GEMINI_API_KEY']))
    scores = evaluate(EvaluationDataset.from_list(records),metrics=[faithfulness,answer_relevancy,context_precision,context_recall],llm=llm,embeddings=embeddings)
    frame = scores.to_pandas()
    metrics = {('response_relevancy' if name=='answer_relevancy' else name):float(frame[name].mean()) for name in ['faithfulness','answer_relevancy','context_precision','context_recall']}
    if any(not __import__('math').isfinite(value) for value in metrics.values()):
        raise RuntimeError('At least one metric is invalid. The UI report was not saved; inspect evaluator failures.')
    output = DATA/'evaluation'
    output.mkdir(parents=True,exist_ok=True)
    report = {'status':'measured','message':f'Measured on {len(gold)} cases. Sample gold set is a development smoke set, not the frozen hackathon benchmark.',
              'metrics':metrics,'model':provider.model_name(),'verifier_model':provider.model_name(True),
              'framework':'ragas 0.3.7','created_at':datetime.now(timezone.utc).isoformat(),
              'off_material_count':off_count,'off_material_refusal_rate':off_refusals/off_count if off_count else None,
              'answerable_false_refusals':false_refusals,'gold_path':args.gold}
    (output/f'{args.course}-raw.json').write_text(json.dumps(raw,indent=2,ensure_ascii=False),encoding='utf-8')
    frame.to_csv(output/f'{args.course}-scores.csv',index=False)
    (output/f'{args.course}.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))


if __name__=='__main__':
    main()
