import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,newSession,draw,replaceCard,complete,chooseBranch,finish,validateBackup,CARDS,BRANCHES,target} from '../src/lib/domain/core.mjs';
import {TRIAL_FIRST} from '../src/lib/domain/rules.mjs';
const start=()=>{const s=initialState();newSession(s,{...s.preferences,mode:'trial',budget:500,scoring:true});return s;};
test('trial has exactly three zero-cost 3–5 minute tasks and saves an effective, immutable branch',()=>{
 const histories={};
 for(const branch of Object.keys(BRANCHES)){
  const s=start(),se=s.session;assert.equal(se.scoring,false);assert.equal(se.budget,0);assert.equal(target(se),0);
  draw(s,se.id,se.slots[0].id,undefined,()=>0);assert(TRIAL_FIRST.includes(se.slots[0].card.id));
  assert.throws(()=>draw(s,se.id,se.slots[1].id),/方向/);complete(s,se.id,se.slots[0].id,se.slots[0].card.id);
  chooseBranch(s,se.id,branch);assert.throws(()=>chooseBranch(s,se.id,branch),/方向已保存/);
  const restored=validateBackup(JSON.parse(JSON.stringify(s)));assert.equal(restored.session.branch,branch);
  for(const slot of restored.session.slots.slice(1)){draw(restored,se.id,slot.id,undefined,()=>0);assert(BRANCHES[branch][slot.type].includes(slot.card.id));assert.equal(slot.card.cost,0);assert(slot.card.minutes>=3&&slot.card.minutes<=5);complete(restored,se.id,slot.id,slot.card.id);}
  finish(restored,se.id,{name:'三卡纪念',memory:'一起听见城市',closing:true});histories[branch]=restored.history[0];assert.equal(validateBackup(restored).history[0].branch,branch);
 }
 assert.notDeepEqual(histories.clues.slots.slice(1).map(x=>x.card.id),histories.sounds.slots.slice(1).map(x=>x.card.id));
});
test('trial preserves hard disabled filters, local deduplication and the current card on exhaustion',()=>{
 const s=start(),se=s.session;s.disabled=TRIAL_FIRST.slice(1);draw(s,se.id,se.slots[0].id,undefined,()=>0);const current=structuredClone(se.slots[0]);assert.throws(()=>replaceCard(s,se.id,current.id,current.card.id),/用完/);assert.deepEqual(se.slots[0],current);
});
test('all built-in cards preserve the original curated handoffs and specify a concrete shared task',()=>{
 const original=['scene-09','scene-12','scene-14','event-13','talk-09','talk-10','talk-12','talk-13','event-09','event-14','event-15','event-16'];
 for(const id of original)assert(CARDS.find(card=>card.id===id)?.duo,'original handoff retained: '+id);
 for(const card of CARDS){assert(card.duo,'specific handoff for '+card.id);for(const key of ['first','action','done'])assert(card.duo[key].trim());assert.notEqual(card.duo.done,'两人都完成卡上的任务');}
});
test('current schema validates snapshots, branches and duo prose at runtime before importing',()=>{
 const s=start();for(const mutate of [s=>delete s.session.rules,s=>s.session.rules.thresholds=[1,2,3],s=>s.session.slots[0].points=77,s=>s.session.branch='__proto__',s=>s.sound='yes',s=>s.session.rules.id='unknown']){const raw=structuredClone(s);mutate(raw);assert.throws(()=>validateBackup(raw));}
});
