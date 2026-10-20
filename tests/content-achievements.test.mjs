import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState,newSession,draw,complete,finish,undo,setSlotStatus,chooseBranch,allCards,validateBackup,CARDS} from '../src/lib/domain/core.mjs';
import {achievements,completedCards,keepsakeSummary,nextAchievement} from '../src/lib/domain/collection.mjs';

const OLD_IDS=['departure','trio','discoveries','theme-observe','theme-duo','sixteen'];
const NEW_IDS=['journeys-3','events-6','custom-first','discoveries-32'];
const badge=(state,id)=>achievements(state).find(item=>item.id===id);
const cardsOf=type=>CARDS.filter(card=>card.type===type);
function begin(state,config={}){
 newSession(state,{...state.preferences,mode:'free',journeyTheme:'mixed',place:'both',budget:10000,...config},1800000000000);
 return state.session;
}
function take(state,cardId,status='done'){
 const card=allCards(state).find(item=>item.id===cardId),disabled=state.disabled;
 // Simulate choosing the only enabled card, without depending on recent-card weights.
 state.disabled=allCards(state).filter(item=>item.type===card.type&&item.id!==cardId).map(item=>item.id);
 let id;
 try{id=draw(state,state.session.id,null,card.type,()=>0);}finally{state.disabled=disabled;}
 if(status==='done')complete(state,state.session.id,id,cardId,0,1800000000001);
 else if(status!=='active')setSlotStatus(state,state.session.id,id,status);
 return id;
}
function save(state,closing=true){return finish(state,state.session.id,{name:'沿途测试',memory:'',closing},1800000000002);}
function walk(state,{mode='short',count=Infinity,closing=true,theme='mixed',skipRest=false}={}){
 const journey=begin(state,{mode,journeyTheme:theme});
 for(const [index,slot] of journey.slots.entries()){
  if(index>=count){if(skipRest)setSlotStatus(state,journey.id,slot.id,'skipped');continue;}
  draw(state,journey.id,slot.id,undefined,()=>0);complete(state,journey.id,slot.id,slot.card.id,0,1800000000001);
  if(mode==='trial'&&index===0)chooseBranch(state,journey.id,'clues');
 }
 return save(state,closing);
}

test('ten badges preserve the original six IDs and append four stable goals',()=>{
 const state=initialState(),before=structuredClone(state),badges=achievements(state);
 assert.deepEqual(badges.map(item=>item.id),[...OLD_IDS,...NEW_IDS]);
 assert(badges.every(item=>!item.earned));
 assert.equal(badge(state,'journeys-3').progress,'0 / 3 程');
 assert.equal(badge(state,'events-6').progress,'0 / 6 张');
 assert.equal(badge(state,'custom-first').progress,'0 / 1 张');
 assert.equal(badge(state,'discoveries-32').progress,'0 / 32 张');
 assert.deepEqual(state,before);
 assert.equal(nextAchievement(state).id,'departure');
});

test('three saved journeys require three completed types and closing; trial and unfinished sessions do not count',()=>{
 const state=initialState();
 walk(state,{count:3,skipRest:true});
 assert.equal(badge(state,'journeys-3').progress,'1 / 3 程');
 walk(state,{mode:'trial'});
 walk(state,{closing:false});
 walk(state,{count:2,skipRest:true});
 assert.equal(badge(state,'journeys-3').progress,'1 / 3 程');
 walk(state,{mode:'half',count:3,skipRest:true});
 assert.equal(badge(state,'journeys-3').progress,'2 / 3 程');
 begin(state,{scoring:false});
 for(const type of ['scene','talk','event'])take(state,cardsOf(type)[0].id);
 assert.equal(badge(state,'journeys-3').earned,false);
 save(state);
 assert.equal(badge(state,'journeys-3').earned,true);
 assert.equal(badge(state,'journeys-3').progress,'3 / 3 程');
 // All journeys used the same timestamps: no elapsed-time, day or scoring gate applies.
 state.history.shift();
 assert.equal(badge(state,'journeys-3').earned,false);
 assert.equal(badge(state,'journeys-3').progress,'2 / 3 程');
});

test('six events count completed IDs across retained history and the current session; undo and deletion recompute',()=>{
 const state=initialState(),events=cardsOf('event');begin(state);
 for(const card of events.slice(0,5))take(state,card.id);
 save(state,false);
 begin(state);take(state,events[0].id);
 state.session.slots[0].card.text='同一编号的新文字';
 assert.equal(badge(state,'events-6').progress,'5 / 6 张');
 assert.equal(badge(state,'events-6').earned,false);
 const last=take(state,events[5].id);
 assert.equal(complete(state,state.session.id,last,events[5].id),false);
 assert.equal(badge(state,'events-6').earned,true);
 assert.equal(badge(state,'events-6').progress,'6 / 6 张');
 undo(state,state.session.id);
 assert.equal(badge(state,'events-6').earned,false);
 complete(state,state.session.id,last,events[5].id);
 const id=save(state,false);
 state.history=state.history.filter(journey=>journey.id!==id);
 assert.equal(badge(state,'events-6').progress,'5 / 6 张');
 state.history=[];
 assert.equal(badge(state,'events-6').progress,'0 / 6 张');
});

test('trial events and custom events count, while active, later and skipped events do not',()=>{
 const state=initialState();walk(state,{mode:'trial'});
 assert.equal(badge(state,'events-6').progress,'1 / 6 张');
 const custom={...cardsOf('event')[0],id:'custom-shared-event'};state.customCards.push(custom);
 begin(state);take(state,custom.id);
 assert.equal(badge(state,'events-6').progress,'2 / 6 张');
 for(const [index,status] of ['active','later','skipped'].entries())take(state,cardsOf('event')[index].id,status);
 assert.equal(badge(state,'events-6').progress,'2 / 6 张');
 assert.equal(badge(state,'custom-first').earned,true);
});

test('custom creation alone does not earn a badge; completed snapshots survive deletion of the original card',()=>{
 const state=initialState(),custom={...cardsOf('talk')[0],id:'custom-our-story'};state.customCards.push(custom);
 assert.equal(badge(state,'custom-first').earned,false);
 begin(state);const slotId=take(state,custom.id,'later');
 assert.equal(badge(state,'custom-first').earned,false);
 complete(state,state.session.id,slotId,custom.id);
 assert.equal(badge(state,'custom-first').earned,true);
 undo(state,state.session.id);
 assert.equal(badge(state,'custom-first').earned,false);
 complete(state,state.session.id,slotId,custom.id);save(state,false);
 state.customCards=[];
 const restored=validateBackup(state);
 assert.equal(badge(restored,'custom-first').earned,true);
 assert.equal(badge(restored,'custom-first').progress,'1 / 1 张');
 restored.history=[];
 assert.equal(badge(restored,'custom-first').earned,false);
});

test('32 discoveries include custom cards and count repeated or edited IDs only once',()=>{
 const state=initialState();begin(state);
 for(const card of CARDS.slice(0,31))take(state,card.id);
 assert.equal(badge(state,'discoveries-32').earned,false);
 assert.equal(badge(state,'discoveries-32').progress,'31 / 32 张');
 const custom={...cardsOf('event')[0],id:'custom-thirty-two'};state.customCards.push(custom);take(state,custom.id);
 assert.equal(badge(state,'discoveries-32').earned,true);
 assert.equal(badge(state,'discoveries-32').progress,'32 / 32 张');
 save(state,false);begin(state);take(state,CARDS[0].id);
 state.session.slots[0].card.text='改名仍是同一个任务';
 assert.equal(completedCards(state).size,32);
 assert.equal(badge(state,'discoveries-32').progress,'32 / 32 张');
 state.history=[];
 assert.equal(badge(state,'discoveries-32').earned,false);
 assert.equal(badge(state,'discoveries-32').progress,'1 / 32 张');
});

test('new-badge summaries belong only to the inspected journey and its earlier retained records',()=>{
 const state=initialState(),events=cardsOf('event');begin(state);
 for(const card of events.slice(0,5))take(state,card.id);
 const early=save(state,false);begin(state);take(state,events[5].id);const milestone=save(state,false);
 assert(!keepsakeSummary(state,early).newBadges.some(item=>item.id==='events-6'));
 assert(keepsakeSummary(state,milestone).newBadges.some(item=>item.id==='events-6'));
 const custom={...cardsOf('talk')[0],id:'custom-later-story'};state.customCards.push(custom);
 begin(state);take(state,custom.id);const latest=save(state,false);const before=structuredClone(state);
 assert(!keepsakeSummary(state,milestone).newBadges.some(item=>item.id==='custom-first'));
 assert(keepsakeSummary(state,latest).newBadges.some(item=>item.id==='custom-first'));
 assert.deepEqual(state,before);
 const summary=keepsakeSummary(state,early);
 assert.equal(summary.totalBadges,10);
 assert.equal(summary.earnedCount,achievements(state).filter(item=>item.earned).length);
 assert.equal(summary.next.id,'theme-observe');
 assert.deepEqual(keepsakeSummary(state,'missing'),{newBadges:[],next:null,nextTheme:'observe',totalBadges:10,earnedCount:summary.earnedCount});
});

test('next goal prioritizes the other theme, then every unearned badge in fixed order, and handles all ten earned',()=>{
 const state=initialState();const observe=walk(state,{theme:'observe'});
 assert.equal(keepsakeSummary(state,observe).next.id,'theme-duo');
 assert.equal(keepsakeSummary(state,observe).newBadges[0].id,'theme-observe');
 walk(state,{theme:'duo'});
 assert.equal(nextAchievement(state,'observe').id,achievements(state).find(item=>!item.earned).id);
 begin(state);for(const card of CARDS.slice(0,32))take(state,card.id);
 for(const card of cardsOf('event').slice(0,6))take(state,card.id);
 const custom={...cardsOf('talk')[0],id:'custom-complete-album'};state.customCards.push(custom);take(state,custom.id);
 const id=save(state);
 assert(achievements(state).every(item=>item.earned));
 assert.equal(nextAchievement(state,'duo'),null);
 assert.equal(keepsakeSummary(state,id).next,null);
 assert.equal(keepsakeSummary(state,id).totalBadges,10);
 assert.equal(keepsakeSummary(state,id).earnedCount,10);
 assert.deepEqual(keepsakeSummary(state,id).newBadges.slice(0,4).map(item=>item.id),NEW_IDS);
});

test('v1, v2 and v3 completed snapshots can earn new badges without adding award dates or rewriting history',()=>{
 for(const version of [1,2]){
  const raw=JSON.parse(readFileSync(new URL(`./fixtures/v${version}-state.json`,import.meta.url),'utf8'));
  raw.history[0].slots.find(slot=>slot.status==='done').card.id='custom-legacy-story';
  const restored=validateBackup(raw),before=structuredClone(restored);
  assert.equal(badge(restored,'custom-first').earned,true);
  assert(keepsakeSummary(restored,restored.history[0].id).newBadges.some(item=>item.id==='custom-first'));
  assert.deepEqual(restored,before);
 }
 const state=initialState();for(let index=0;index<3;index++)walk(state,{count:3,skipRest:true});
 const restored=validateBackup(state),before=structuredClone(restored);
 assert.equal(badge(restored,'journeys-3').earned,true);
 assert.deepEqual(restored,before);
 assert.equal(badge(initialState(),'journeys-3').earned,false);
});

test('history eviction removes the last retained evidence for a derived custom badge',()=>{
 const state=initialState(),custom={...cardsOf('talk')[0],id:'custom-oldest-story'};state.customCards.push(custom);
 begin(state);take(state,custom.id);save(state,false);state.customCards=[];
 for(let index=0;index<299;index++){begin(state);save(state,false);}
 assert.equal(state.history.length,300);
 assert.equal(badge(state,'custom-first').earned,true);
 begin(state);save(state,false);
 assert.equal(state.history.length,300);
 assert.equal(badge(state,'custom-first').earned,false);
});
