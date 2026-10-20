import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {CARDS,initialState,newSession,draw,replaceCard,complete,chooseBranch,eligible,validateBackup} from '../src/lib/domain/core.mjs';
import {taskBrief,taskInstructions} from '../src/lib/domain/task-instructions.mjs';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const legacyCard=card=>/^(scene|talk|event)-(0[1-9]|1[0-6])$/.test(card.id);
const additions=CARDS.filter(card=>!legacyCard(card));
// These fingerprints freeze the released IDs, order and all non-instruction content.
const releasedCatalog={
 scene:'4ce25b0bb4ab6e081ad0c579ab7f27eb2937d6d04bddd588a5c55397e15bf194',
 talk:'60b9148933cb14ce3d7a846c05e69889f469abff7726022be41b79b46af540b8',
 event:'4282a8e0eb8edb7b2bf3d37233882879eb26d799aec7dcf143c9b65fce9454b9'
};
const releasedDuoIds=new Set(['scene-09','scene-12','scene-14','event-13','talk-09','talk-10','talk-12','talk-13','event-09','event-14','event-15','event-16']);

test('released task IDs, attributes and existing paired instructions remain intact',()=>{
 for(const [type,fingerprint] of Object.entries(releasedCatalog)){
  const cards=CARDS.filter(card=>legacyCard(card)&&card.type===type).map(({id,type,text,minutes,cost,place,note,source})=>({id,type,text,minutes,cost,place,note,source}));
  assert.equal(hash(cards),fingerprint,`${type}: a released ID or task attribute changed`);
 }
 assert.equal(hash(CARDS.filter(card=>releasedDuoIds.has(card.id)).map(({id,duo})=>({id,duo}))),'d11d957dd4fe6260012dd586fbdf56e507ba584d30e7fd8d71d26d87cff1e08e');
 assert.equal(new Set(CARDS.map(card=>card.id)).size,CARDS.length,'task IDs must stay unique');
});

test('every built-in task has a specific, short first-screen action and completion rule',()=>{
 for(const card of CARDS){
  const rule=taskBrief(card,null);
  assert(card.duo,`${card.id}: new draws must carry their instructions in the snapshot`);
  assert(rule.first.trim(),`${card.id}: missing first player`);
  assert(rule.action.trim()&&rule.action.length<=36,`${card.id}: action does not fit the first screen`);
  assert(rule.done.trim()&&rule.done.length<=26,`${card.id}: completion rule does not fit the first screen`);
  assert(!rule.action.includes('你先尝试'),`${card.id}: generic handoff remains`);
  assert(!rule.done.includes('完成卡上的任务'),`${card.id}: generic completion remains`);
 }
 assert.equal(taskBrief(CARDS.find(card=>card.id==='scene-03')).done,'两人都休息了两分钟');
});

test('the eight appended events offer zero-cost indoor and outdoor activities with distinct handoffs',()=>{
 assert.deepEqual(additions.map(card=>card.id),['event-17','event-18','event-19','event-20','event-21','event-22','event-23','event-24']);
 assert.equal(new Set(additions.map(card=>card.duo.action)).size,additions.length);
 for(const card of additions){
  assert.equal(card.type,'event');
  assert.equal(card.cost,0);
  assert.equal(card.place,'both');
  assert(card.minutes>=3&&card.minutes<=5);
  for(const place of ['indoor','outdoor','both']){
   const state=initialState();newSession(state,{...state.preferences,journeyTheme:'mixed',place,budget:0});
   assert(eligible(state,'event').some(candidate=>candidate.id===card.id),`${card.id}: unavailable in ${place}`);
  }
 }
 const cards=Object.fromEntries(additions.map(card=>[card.id,card]));
 assert.match(cards['event-18'].duo.done,/三轮/);
 assert.match(cards['event-18'].note,/不同时也算完成/);
 assert.match(cards['event-19'].duo.done,/两轮/);
 assert.match(cards['event-21'].note,/没有变化也算完成/);
 assert.match(cards['event-23'].duo.action,/三条提示/);
 assert.match(cards['event-23'].note,/不计对错/);
 assert.match(cards['event-24'].note,/坐着.*只用手.*不拍摄/);
});

test('new events preserve hard filtering, per-journey deduplication and exhausted replacement behavior',()=>{
 const state=initialState();newSession(state,{...state.preferences,mode:'free',journeyTheme:'mixed',place:'indoor',budget:0});
 const journey=state.session;
 const pool=eligible(state,'event');
 assert(pool.every(card=>card.cost===0&&card.place!=='outdoor'),'zero-budget indoor filtering must remain strict');
 state.disabled=CARDS.filter(card=>legacyCard(card)&&card.type==='event').map(card=>card.id);
 state.disabled.push('event-18');
 const slotId=draw(state,journey.id,null,'event',()=>0),slot=journey.slots.find(candidate=>candidate.id===slotId);
 assert.equal(slot.card.id,'event-17');
 replaceCard(state,journey.id,slot.id,slot.card.id,()=>0);
 assert.equal(slot.card.id,'event-19','replacement must skip the seen card and disabled event');
 assert(!eligible(state,'event').some(card=>['event-17','event-18','event-19'].includes(card.id)));
 state.disabled.push(...eligible(state,'event').map(card=>card.id));
 const before=structuredClone(slot);
 assert.throws(()=>replaceCard(state,journey.id,slot.id,slot.card.id),/用完/);
 assert.deepEqual(slot,before,'an exhausted pool must retain the current task');
});

test('themed journeys and both trial branches retain their existing candidate boundaries',()=>{
 const addedIds=new Set(additions.map(card=>card.id));
 for(const journeyTheme of ['observe','duo']){
  const state=initialState();newSession(state,{...state.preferences,journeyTheme});
  assert(eligible(state,'event').every(card=>!addedIds.has(card.id)));
  assert(Object.keys(state.session.themePlan.tasks).every(id=>!addedIds.has(id)));
 }
 for(const branch of ['clues','sounds']){
  const state=initialState();newSession(state,{...state.preferences,mode:'trial'});
  const journey=state.session,slot=journey.slots[0];draw(state,journey.id,slot.id,undefined,()=>0);complete(state,journey.id,slot.id,slot.card.id);chooseBranch(state,journey.id,branch);
  const pool=eligible(state,'event');assert(pool.length>0);
  assert(pool.every(card=>!addedIds.has(card.id)));
 }
});

test('new event snapshots round-trip and old drawn cards keep their saved or legacy instructions',()=>{
 const state=initialState();newSession(state,{...state.preferences,mode:'free'});
 state.disabled=CARDS.filter(card=>card.type==='event'&&card.id!=='event-23').map(card=>card.id);
 const slotId=draw(state,state.session.id,null,'event',()=>0),snapshot=structuredClone(state.session.slots[0].card);
 const restored=validateBackup(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(restored.session.slots.find(slot=>slot.id===slotId).card,snapshot);
 assert.deepEqual(taskInstructions(snapshot,restored.session),snapshot.duo);
 const {duo,...oldDraw}=CARDS.find(card=>card.id==='event-05');
 assert.equal(taskInstructions(oldDraw,null).done,'两人都完成卡上的任务','do not replace a pre-update draw with current instructions');
 oldDraw.duo={first:'原先的先手',action:'原先保存的做法',done:'原先保存的完成条件'};
 assert.deepEqual(taskBrief(oldDraw,null),oldDraw.duo);
});
