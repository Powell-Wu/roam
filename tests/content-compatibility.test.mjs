import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import * as current from '../src/lib/domain/core.mjs';
import {ART} from '../src/lib/ui/art.mjs';
import {TRIAL_FIRST, BRANCHES} from '../src/lib/domain/rules.mjs';

// Exercise the real published reader, rather than a second copy of its schema.
const reference='7b944b9';
const root=fileURLToPath(new URL('../',import.meta.url));
const addedIds=Array.from({length:8},(_,index)=>`event-${index+17}`);
let fixture,legacy,legacyArt,legacyRules;
before(async()=>{
 fixture=await fs.mkdtemp(path.join(os.tmpdir(),'roam-content-v3-'));
 const files=['domain/core','domain/cards','domain/collection','domain/rules','domain/journey-themes','domain/theme-tasks','ui/art','ui/themes'];
 await Promise.all(files.map(async name=>{
  const relative=`src/lib/${name}.mjs`,target=path.join(fixture,relative);
  const source=execFileSync('git',['-C',root,'show',`${reference}:${relative}`],{encoding:'utf8'});
  await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,source);
 }));
 [legacy,legacyArt,legacyRules]=await Promise.all(['domain/core','ui/art','domain/rules'].map(name=>import(pathToFileURL(path.join(fixture,`src/lib/${name}.mjs`)).href)));
});
after(async()=>{if(fixture)await fs.rm(fixture,{recursive:true,force:true});});

function drawNewEvents(){
 const state=current.initialState();
 current.newSession(state,{...state.preferences,mode:'free',journeyTheme:'mixed',place:'indoor',budget:0});
 state.disabled=current.CARDS.filter(card=>!addedIds.includes(card.id)).map(card=>card.id);
 for(const id of addedIds){
  const slot=current.draw(state,state.session.id,null,'event',()=>0);
  assert.equal(state.session.slots.find(item=>item.id===slot).card.id,id);
 }
 return state;
}

test('the first content release retains v3, published theme/trial pools and the nine saved art keys',()=>{
 assert.equal(current.initialState().version,3);
 assert.deepEqual(Object.keys(ART).sort(),Object.keys(legacyArt.ART).sort());
 assert.equal(Object.keys(ART).length,9);
 assert.deepEqual(current.JOURNEY_THEMES,legacy.JOURNEY_THEMES);
 assert.deepEqual(TRIAL_FIRST,legacyRules.TRIAL_FIRST);
 assert.deepEqual(BRANCHES,legacyRules.BRANCHES);
 assert.equal(legacy.CARDS.length,48);
 assert.deepEqual(current.CARDS.filter(card=>!addedIds.includes(card.id)).map(card=>card.id),legacy.CARDS.map(card=>card.id));
 const stableFields=['id','type','text','note','minutes','cost','place','source'];
 for(const original of legacy.CARDS){
  const card=current.CARDS.find(item=>item.id===original.id);
  for(const field of stableFields)assert.deepEqual(card[field],original[field],`${original.id}.${field} is a saved task identity`);
 }
 assert.deepEqual(current.CARDS.filter(card=>!legacy.CARDS.some(old=>old.id===card.id)).map(card=>card.id),addedIds);
 for(const card of current.CARDS.filter(card=>addedIds.includes(card.id))){
  assert.equal(card.cost,0);assert.equal(card.place,'both');assert.equal(card.artKey,undefined);
  for(const field of ['first','action','done'])assert.equal(typeof card.duo?.[field],'string',`${card.id}.${field}`);
 }
});

test('all eight new complete snapshots survive published v3 reads, completion, undo and a new-client round trip',()=>{
 const state=drawNewEvents(),snapshots=structuredClone(state.session.slots.map(slot=>slot.card));
 state.favorites=[addedIds[0]];state.revision=41;
 state.customCards=[{id:'custom-v3-picture',type:'event',text:'我们原来写的任务',note:'保留选图',minutes:3,cost:0,place:'both',artKey:'sound'}];
 const input=structuredClone(state);
 let restored=legacy.migrateState(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(state,input,'validation must not mutate its input');
 assert.deepEqual(restored,state);
 for(const [index,snapshot] of snapshots.entries()){
  const domain=index%2?current:legacy,slot=restored.session.slots[index];
  domain.complete(restored,restored.session.id,slot.id,snapshot.id,0,Date.now()+index);
  const other=index%2?legacy:current;
  restored=other.migrateState(JSON.parse(JSON.stringify(restored)));
  assert.equal(restored.session.slots[index].status,'done');
  assert.deepEqual(restored.session.slots.map(item=>item.card),snapshots);
  assert(Object.values(legacyArt.ART).some(art=>art.src===legacyArt.cardArt(snapshot).src),'old rendering uses a known fallback image');
 }
 assert.equal(current.score(restored.session).base,24);
 const undone=legacy.undo(restored,restored.session.id);
 assert.equal(undone,restored.session.slots.at(-1).id);
 assert.equal(current.score(current.migrateState(restored).session).base,21);
 assert.deepEqual(restored.customCards,state.customCards);
 assert.deepEqual(restored.favorites,state.favorites);
 assert.equal(restored.session.themePlan,null);
});

test('published v3 history and active task prose survive the new reader without backfilling instructions',()=>{
 const old=legacy.initialState();
 legacy.newSession(old,{...old.preferences,journeyTheme:'observe',place:'indoor'});
 delete old.session.themePlan.tasks;
 const slot=old.session.slots[0];legacy.draw(old,old.session.id,slot.id,undefined,()=>0);
 slot.card.duo={first:'旧记录的先手',action:'旧记录当时的配合方式',done:'旧记录当时的完成条件'};
 legacy.complete(old,old.session.id,slot.id,slot.card.id);
 legacy.finish(old,old.session.id,{name:'保留过去的旅程',memory:'不因新内容覆盖旧回忆',closing:true});
 legacy.newSession(old,{...old.preferences,journeyTheme:'mixed'});
 legacy.draw(old,old.session.id,old.session.slots[0].id,undefined,()=>0);
 old.revision=17;
 const before=structuredClone(old),updated=current.migrateState(JSON.parse(JSON.stringify(old)));
 assert.deepEqual(updated,before);
 assert.deepEqual(legacy.migrateState(updated),before);
 assert.deepEqual(current.score(updated.history[0]),legacy.score(old.history[0]));
 assert.equal(Object.hasOwn(updated.history[0].themePlan,'tasks'),false);
});
