import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {CARDS,initialState,newSession,draw} from '../src/lib/domain/core.mjs';
import {ART,TASK_ILLUSTRATIONS,cardArt,cardArtKey} from '../src/lib/ui/art.mjs';
import {renderView} from '../src/lib/ui/views.mjs';
import {showCompletion} from '../src/lib/interactions/rewards.mjs';

test('task art is stable, all built-in and custom card types resolve to public source assets',()=>{
 const covered=new Set();
 for(const card of [...CARDS,...['scene','talk','event'].map(type=>({type,text:'自定义任务'}))]){
  const art=cardArt(card);assert.deepEqual(cardArt({...card}),art);covered.add(art.src);
  assert(existsSync(new URL('../public/'+art.src,import.meta.url)));
 }
 for(const art of Object.values(ART))assert(covered.has(art.src),'original art remains used: '+art.src);
 for(const art of Object.values(TASK_ILLUSTRATIONS))assert(covered.has(art.src),'new art is used: '+art.src);
 assert.equal(Object.keys(ART).length,9,'custom cards keep the published v3 art vocabulary');
 for(const [artKey,art] of Object.entries(ART))assert.equal(cardArt({id:'custom-kept',type:'event',text:'自定义任务',artKey}),art);
 assert.equal(cardArtKey(CARDS.find(card=>card.id==='scene-12')),'discover','display art must not change the task stamp category');
 for(const file of ['deck-pattern.svg','chest-closed.webp','chest-open.webp','explorer-badge.webp'])assert(existsSync(new URL('../public/'+file,import.meta.url)));
});

test('completion/replacement are outside secondary disclosure; paused cards cannot swipe',()=>{
 const s=initialState();newSession(s,s.preferences);draw(s,s.session.id,s.session.slots[0].id);
 const html=renderView(s,{},'walk');
 const disclosure=html.match(/<details class="card-options">([\s\S]*?)<\/details>/)?.[0];
 assert(disclosure);assert.doesNotMatch(disclosure,/data-action="(?:complete|replace)"/);
 assert.match(html.replace(disclosure,''),/data-action="complete"/);assert.match(html.replace(disclosure,''),/data-action="replace"/);
 assert.match(html,/data-swipe-card/);assert.match(html,/class="task-art"/);
 assert.doesNotMatch(renderView(s,{swipeSeen:true},'walk'),/class="swipe-guide"/);
 s.session.pausedAt=Date.now();const paused=renderView(s,{},'walk');
 assert.doesNotMatch(paused,/data-swipe-card/);assert.match(paused,/data-action="complete"[^>]*disabled/);
});

test('completion can be dismissed or interrupted without leaving dialog listeners or scoring side effects',async()=>{
 const globals=['document','window','matchMedia'];const original=Object.fromEntries(globals.map(k=>[k,globalThis[k]]));
 try{
  for(const reduced of [false,true])for(const trigger of ['button','cancel','hashchange','hidden']){
   const handlers={},win=new Map(),doc=new Map();let removed=false,click;
   const layer={open:false,classList:{add(value){handlers.mode=value;}},setAttribute(){},addEventListener(k,v){handlers[k]=v;},querySelector(){return{addEventListener(k,v){click=v;}};},showModal(){this.open=true;},close(){this.open=false;handlers.close?.();},remove(){removed=true;}};
   globalThis.document={hidden:false,createElement:()=>layer,body:{append(){}},addEventListener:(k,v)=>doc.set(k,v),removeEventListener:k=>doc.delete(k)};
   globalThis.window={addEventListener:(k,v)=>win.set(k,v),removeEventListener:k=>win.delete(k)};
   globalThis.matchMedia=()=>({matches:reduced});
   const done=showCompletion({points:2,milestone:{points:8,name:'一起吃甜品'}});
   assert.equal(handlers.mode,reduced?'reward-still':'reward-playing');assert.match(layer.innerHTML,/一起吃甜品/);
   if(trigger==='button')click();
   if(trigger==='cancel')handlers.cancel({preventDefault(){}});
   if(trigger==='hashchange')win.get('hashchange')();
   if(trigger==='hidden'){document.hidden=true;doc.get('visibilitychange')();}
   await done;assert(removed);assert.equal(win.size,0);assert.equal(doc.size,0);assert.equal(layer.open,false);
  }
 }finally{for(const k of globals)if(original[k]===undefined)delete globalThis[k];else globalThis[k]=original[k];}
});
