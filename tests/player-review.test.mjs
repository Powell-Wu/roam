import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,newSession,draw,complete,finish,validateBackup,CARDS} from '../src/lib/domain/core.mjs';
import {themeSnapshot} from '../src/lib/domain/journey-themes.mjs';
import {THEME_TASKS} from '../src/lib/domain/theme-tasks.mjs';
import {taskInstructions} from '../src/lib/domain/task-instructions.mjs';
import {achievements,keepsakeSummary} from '../src/lib/domain/collection.mjs';

function walk(state,theme,{count=4,closing=true,mode='short'}={}){
 newSession(state,{...state.preferences,mode,journeyTheme:theme,place:'indoor',budget:0});const se=state.session;
 for(const slot of se.slots.slice(0,count)){draw(state,se.id,slot.id,undefined,()=>0);complete(state,se.id,slot.id,slot.card.id);}
 return finish(state,se.id,{name:'评审优化测试',memory:'',closing});
}
test('every themed candidate has short roles/action/completion; duo exploration and talk require shared decisions',()=>{
 for(const key of ['observe','duo']){const plan=themeSnapshot(key),ids=Object.values(plan.cards).flat();assert.deepEqual(Object.keys(plan.tasks).sort(),ids.sort());for(const id of ids){const rule=taskInstructions(CARDS.find(card=>card.id===id),{themePlan:plan});assert(rule.first&&rule.action&&rule.done);assert(rule.action.length<=36);assert(rule.done.length<=26);if(key==='duo')assert.match(rule.action,/猜|交换|轮流|交替|共选|分工/);}}
 assert.notEqual(THEME_TASKS.observe['scene-03'].action,THEME_TASKS.duo['scene-03'].action);
});
test('new theme instructions survive source edits, backup and resume; old v3 snapshots retain old card prose',()=>{
 const state=initialState();newSession(state,{...state.preferences,journeyTheme:'duo'});const plan=structuredClone(state.session.themePlan),prior=THEME_TASKS.duo['scene-03'];
 try{THEME_TASKS.duo['scene-03']={...prior,action:'未来的新做法'};const restored=validateBackup(state);assert.deepEqual(restored.session.themePlan,plan);assert.equal(taskInstructions(CARDS.find(card=>card.id==='scene-03'),restored.session).action,prior.action);}finally{THEME_TASKS.duo['scene-03']=prior;}
 const legacy=structuredClone(state);delete legacy.session.themePlan.tasks;draw(legacy,legacy.session.id,legacy.session.slots[0].id,undefined,()=>0);const card=legacy.session.slots[0].card;card.duo={first:'旧记录的先手',action:'旧记录的做法',done:'旧记录的完成条件'};assert.deepEqual(taskInstructions(card,validateBackup(legacy).session),card.duo);
});
test('invalid or incomplete theme instructions are rejected without changing the input',()=>{
 const s=initialState();newSession(s,{...s.preferences,journeyTheme:'observe'});
 for(const change of [p=>delete p.tasks['scene-03'],p=>p.tasks['scene-03'].action='',p=>p.tasks['scene-03'].done='x'.repeat(181),p=>p.tasks=[]]){const raw=structuredClone(s);change(raw.session.themePlan);const before=structuredClone(raw);assert.throws(()=>validateBackup(raw));assert.deepEqual(raw,before);}
});
test('theme badge requires completed plan and closing; partial/unchecked walks do not earn it, deletion recomputes',()=>{
 for(const theme of ['observe','duo']){const state=initialState();walk(state,theme,{count:3});assert(!achievements(state).find(b=>b.id===`theme-${theme}`).earned);walk(state,theme,{closing:false});assert(!achievements(state).find(b=>b.id===`theme-${theme}`).earned);const id=walk(state,theme);assert(achievements(state).find(b=>b.id===`theme-${theme}`).earned);const summary=keepsakeSummary(state,id);assert(summary.newBadges.some(b=>b.id===`theme-${theme}`));assert.equal(summary.nextTheme,theme==='observe'?'duo':'observe');state.history=state.history.filter(se=>se.id!==id);assert(!achievements(state).find(b=>b.id===`theme-${theme}`).earned);}
});
test('sixteen-task milestone counts task IDs once and offers another goal after the first trip',()=>{
 const state=initialState();const id=walk(state,'mixed');assert.deepEqual(achievements(state).slice(0,6).map(b=>b.id),['departure','trio','discoveries','theme-observe','theme-duo','sixteen']);assert.equal(achievements(state).length,10);assert(keepsakeSummary(state,id).next);assert(!achievements(state).find(b=>b.id==='sixteen').earned);
 const finished=state.history[0];finished.slots=CARDS.slice(0,16).map(card=>({status:'done',card}));assert(achievements(state).find(b=>b.id==='sixteen').earned);finished.slots.push(finished.slots[0]);assert.equal(achievements(state).find(b=>b.id==='sixteen').progress,'16 / 16 张');finished.slots=finished.slots.slice(0,15);assert(!achievements(state).find(b=>b.id==='sixteen').earned);
});
test('free-theme badge requires all three types; viewing older keepsakes excludes later achievements',()=>{
 const state=initialState();newSession(state,{...state.preferences,journeyTheme:'observe',mode:'free',place:'indoor'});const se=state.session;
 for(const type of ['scene','talk','event']){draw(state,se.id,null,type,()=>0);const slot=se.slots.at(-1);complete(state,se.id,slot.id,slot.card.id);}
 const id=finish(state,se.id,{name:'自由主题',memory:'',closing:true});assert(achievements(state).find(b=>b.id==='theme-observe').earned);walk(state,'duo');assert(!keepsakeSummary(state,id).newBadges.some(b=>b.id==='theme-duo'));
 state.history.find(se=>se.id===id).slots.pop();assert(!achievements(state).find(b=>b.id==='theme-observe').earned);
});
