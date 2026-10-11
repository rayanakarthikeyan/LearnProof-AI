"""Seeded synthetic policy comparison; never presented as real student gains."""
import argparse
import json
import random
from statistics import mean, stdev

from .learner import next_concept, update_mastery

GRAPH = {'pointers':(), 'traversal':('pointers',), 'insertion':('pointers',), 'complexity':('traversal','insertion')}
PROFILES = {'beginner':[.15,.1,.1,.1], 'traversal-gap':[.8,.2,.7,.2], 'advanced':[.85,.8,.8,.7]}


def run(policy,profile,seed,budget=20):
    rng = random.Random(seed)
    concepts = list(GRAPH)
    hidden = dict(zip(concepts,PROFILES[profile]))
    estimates = dict.fromkeys(concepts,.3)
    initial = mean(hidden.values())
    before = sum(rng.random() < hidden[c] for c in concepts for _ in range(25))/100
    for index in range(budget):
        if policy=='fixed-order':
            concept = concepts[index % len(concepts)]
        elif policy=='mastery-only':
            concept = min(concepts,key=lambda c:(estimates[c],c))
        else:
            concept = next_concept('complexity',GRAPH,estimates)
        correct = rng.random() < (hidden[concept]*.9+(1-hidden[concept])*.2)
        estimates[concept] = update_mastery(estimates[concept],correct)
        # Same explicit learning rule for every policy; prerequisites affect ease of acquisition.
        readiness = min([hidden[p] for p in GRAPH[concept]],default=1)
        rate = .04 + .12*readiness
        hidden[concept] += (1-hidden[concept])*rate
    after = sum(rng.random() < hidden[c] for c in concepts for _ in range(25))/100
    return {'hidden_mastery_gain':mean(hidden.values())-initial,
            'estimated_mastery_mean':mean(estimates.values()),
            'held_out_gain':after-before,'held_out_accuracy':after}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--seeds',type=int,default=30)
    args = parser.parse_args()
    if args.seeds < 2:
        parser.error('Use at least two seeds to report variability.')
    result = {'label':'SIMULATION ONLY — not real educational efficacy',
              'assumptions':'20 practice events; 0.1 slip/0.2 guess; hidden transition rate 0.04+0.12*minimum prerequisite mastery; fresh held-out Bernoulli observations.',
              'seeds':args.seeds,'sessions':'5 sessions of 4 practice events; no forgetting modeled',
              'question_repetition':'Not evaluated: this simulator models concept events, not an item bank.',
              'results':[]}
    for profile in PROFILES:
        for policy in ['fixed-order','mastery-only','prerequisite-repair']:
            traces = [run(policy,profile,seed) for seed in range(args.seeds)]
            result['results'].append({'profile':profile,'policy':policy,
                'metrics':{key:{'mean':round(mean(t[key] for t in traces),4),'stddev':round(stdev(t[key] for t in traces),4)} for key in traces[0]}})
    print(json.dumps(result,indent=2,ensure_ascii=False))


if __name__=='__main__':
    main()
