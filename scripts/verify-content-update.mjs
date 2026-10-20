import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {serveResources,resourcesFrom} from './server.mjs';
import {v2Baseline} from './v2-baseline.mjs';
import {initialState,newSession,draw,complete,finish,chooseBranch,CARDS,score,validateBackup} from '../src/lib/domain/core.mjs';
import {ART,cardArt} from '../src/lib/ui/art.mjs';
import {taskBrief} from '../src/lib/domain/task-instructions.mjs';

// Run after building dist. This uses a real published release and never changes
// the user's browser, checkout or data; all pages belong to isolated contexts.
const output=process.env.CITYWALK_CONTENT_OUTPUT||(process.env.CITYWALK_E2E_OUTPUT||'test-results')+'/content-update';
await fs.mkdir(output,{recursive:true});
const addedIds=Array.from({length:8},(_,index)=>`event-${index+17}`);
const badgeIds=['departure','trio','discoveries','theme-observe','theme-duo','sixteen','journeys-3','events-6','custom-first','discoveries-32'];
const baseline=await v2Baseline({ref:'7b944b9',directory:process.env.CITYWALK_CONTENT_BASELINE_DIR});
assert.equal(baseline.version,'r-dffed68f37b4','the compatibility baseline must reproduce the published 7b944b9 release');
const resources=await resourcesFrom(process.env.CITYWALK_BUILD_DIR||'dist');
const version=JSON.parse(resources.get('release.json').toString()).version;
assert.notEqual(version,baseline.version,'build the content update before running this verification');
for(const id of addedIds)assert(CARDS.some(card=>card.id===id),`missing content card ${id}`);
const legacyImages=new Set(Object.values(ART).map(art=>art.src));
assert.equal(legacyImages.size,9,'new art must use a separate built-in rendering map');
const browser=await chromium.launch({headless:true,...(process.env.CITYWALK_TEST_BROWSER==='chromium'?{}:{channel:process.env.CITYWALK_TEST_BROWSER||'msedge'})});
const results=[],errors=[];let activePage;
const watch=page=>{activePage=page;page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(error.message));};
const ready=page=>page.waitForFunction(()=>document.querySelector('main')?.getAttribute('aria-busy')==='false');
const read=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
 const request=indexedDB.open('citywalk-for-two',1);request.onerror=()=>reject(request.error);
 request.onsuccess=()=>{const db=request.result,query=db.transaction('state').objectStore('state').get('current');query.onsuccess=()=>{db.close();resolve(query.result);};query.onerror=()=>{db.close();reject(query.error);};};
}));
const seed=(page,state)=>page.evaluate(state=>new Promise((resolve,reject)=>{
 const request=indexedDB.open('citywalk-for-two',1);request.onerror=()=>reject(request.error);
 request.onsuccess=()=>{const db=request.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'current');tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>{db.close();reject(tx.error);};};
}),state);
async function cached(page,release){
 await page.waitForFunction(async release=>!!await(await caches.open('roam-static-'+release)).match(new URL('offline-ready',document.baseURI).href),release);
}
async function waitRevision(page,revision){
 await page.waitForFunction(revision=>new Promise(resolve=>{
  const request=indexedDB.open('citywalk-for-two',1);request.onsuccess=()=>{const db=request.result,query=db.transaction('state').objectStore('state').get('current');query.onsuccess=()=>{db.close();resolve(query.result?.revision===revision);};};
 }),revision);
 await ready(page);
}
async function update(page,expected){
 await page.goto(new URL('#settings',page.url()).href);await ready(page);
 await page.getByRole('button',{name:'检查更新',exact:true}).click();
 await page.getByRole('button',{name:'应用更新并刷新',exact:true}).click();
 await page.locator('[data-current-version]').filter({hasText:expected}).waitFor();
 await ready(page);await cached(page,expected);
}
function preserved(actual,expected){
 assert.equal(actual.version,3);
 for(const key of ['history','customCards','disabled','favorites','preferences'])assert.deepEqual(actual[key],expected[key],`${key} must survive both clients`);
 assert.equal(actual.session.id,expected.session.id);
 assert.deepEqual(actual.session.rules,expected.session.rules);
 assert.equal(actual.session.themePlan,null);
 assert.deepEqual(actual.session.slots.map(slot=>slot.card),expected.session.slots.map(slot=>slot.card));
 assert.deepEqual(actual.session.seen,expected.session.seen);
}
function fixture(){
 const state=initialState();
 for(const journeyTheme of ['observe','duo']){
  newSession(state,{...state.preferences,journeyTheme,place:'indoor',budget:0});
  if(journeyTheme==='observe')delete state.session.themePlan.tasks;
  for(const slot of state.session.slots){
   draw(state,state.session.id,slot.id,undefined,()=>0);
   if(journeyTheme==='observe')slot.card.duo={first:'旧旅程先手',action:'旧旅程保存的配合',done:'旧旅程保存的完成条件'};
   complete(state,state.session.id,slot.id,slot.card.id);
  }
  finish(state,state.session.id,{name:`保留的${journeyTheme}旅程`,memory:'旧文字、规则和主题快照都不改变',closing:true});
 }
 newSession(state,{...state.preferences,mode:'trial'});
 draw(state,state.session.id,state.session.slots[0].id,undefined,()=>0);
 complete(state,state.session.id,state.session.slots[0].id,state.session.slots[0].card.id);
 chooseBranch(state,state.session.id,'sounds');
 for(const slot of state.session.slots.slice(1)){draw(state,state.session.id,slot.id,undefined,()=>0);complete(state,state.session.id,slot.id,slot.card.id);}
 finish(state,state.session.id,{name:'旧试玩分支',memory:'保留声音分支',closing:true});
 state.customCards=[{id:'custom-v3-compat',type:'event',text:'原有自定义任务',note:'保留原有选图',minutes:3,cost:0,place:'both',artKey:'sound'}];
 state.disabled=[...CARDS.filter(card=>!addedIds.includes(card.id)).map(card=>card.id),'custom-v3-compat'];
 state.favorites=['scene-09','event-17'];
 newSession(state,{...state.preferences,mode:'free',journeyTheme:'mixed',place:'indoor',budget:0,scoring:true});
 for(const id of addedIds){const slot=draw(state,state.session.id,null,'event',()=>0);assert.equal(state.session.slots.find(item=>item.id===slot).card.id,id);}
 state.sound=false;state.revision=41;validateBackup(state);return state;
}
async function completeVisible(page,id){
 activePage=page;
 await page.waitForFunction(id=>document.querySelector('[data-swipe-card]')?.getAttribute('data-card')===id,id);
 await ready(page);const before=await read(page);
 assert.equal(await page.locator('.task-copy h2').innerText(),before.session.slots.find(slot=>slot.card.id===id).card.text);
 await page.getByRole('button',{name:'完成',exact:true}).click();await waitRevision(page,before.revision+1);
 const after=await read(page);assert.equal(after.session.slots.find(slot=>slot.card.id===id).status,'done');return after;
}
async function geometry(page,card){
 await ready(page);await page.locator('.task-art').evaluate(image=>image.decode());
 const brief=taskBrief(card,(await read(page)).session);
 assert.equal(await page.locator('.brief-action').innerText(),brief.action);
 assert.equal(await page.locator('.brief-done').innerText(),`完成：${brief.done}`);
 const layout=await page.evaluate(()=>{
  const rect=selector=>document.querySelector(selector).getBoundingClientRect().toJSON();
  return{card:rect('.card-front'),brief:rect('[data-task-cooperation]'),meta:rect('.task-meta'),nav:rect('.nav'),controls:[...document.querySelectorAll('[data-task-actions]>button')].map(button=>button.getBoundingClientRect().toJSON()),overflow:document.documentElement.scrollWidth-innerWidth,font:parseFloat(getComputedStyle(document.querySelector('.task-brief')).fontSize)};
 });
 assert(layout.overflow<=1,JSON.stringify(layout));assert(layout.font>=12);
 assert(layout.brief.bottom<=layout.card.bottom&&layout.brief.top>=layout.card.top,JSON.stringify(layout));
 assert(layout.meta.top>=layout.brief.bottom-1,JSON.stringify(layout));
 assert.equal(layout.controls.length,2);
 for(const control of layout.controls){assert(control.width>=44&&control.height>=44);assert(control.top>=0&&control.bottom<=layout.nav.top-8,JSON.stringify(layout));}
 return layout;
}
async function album(page){
 await ready(page);
 assert.deepEqual(await page.locator('[data-achievement]').evaluateAll(cards=>cards.map(card=>card.dataset.achievement)),badgeIds);
 const images=await page.locator('[data-achievement-seal]').evaluateAll(async seals=>Promise.all(seals.map(async seal=>{
  const style=getComputedStyle(seal),src=style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
  if(!src)throw Error(`Missing seal image: ${seal.dataset.achievementSeal}`);
  const image=new Image();image.src=src;await image.decode();
  return{id:seal.dataset.achievementSeal,src,width:image.naturalWidth,height:image.naturalHeight,position:style.backgroundPosition};
 })));
 assert.equal(images.length,10);
 for(const image of images){
  assert(image.width>0&&image.height>0);
  if(badgeIds.indexOf(image.id)>=6)assert(image.src.endsWith('/roam-pixel-seals-content-v1.webp'));
 }
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert(overflow<=1,`achievement album overflow: ${overflow}`);
 return images;
}

let served=baseline.resources;
const server=await serveResources(()=>served);
try{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 try{
  const old=await context.newPage();watch(old);
  await old.goto(server.base+'#settings');await ready(old);await cached(old,baseline.version);await old.reload();await ready(old);
  const initial=fixture(),historyScores=initial.history.map(score);await seed(old,initial);await old.reload();await ready(old);
  assert.deepEqual(await read(old),initial,'published v3 must open every new snapshot without a write');
  await old.evaluate(()=>globalThis.contentCompatibilityMarker='published-v3');
  await old.locator('#reward-0').fill('旧标签还没有保存的奖励');
  const current=await context.newPage();watch(current);await current.goto(server.base+'#settings');await ready(current);
  await current.locator('#reward-0').fill('应用内容更新后仍保留的草稿');
  served=resources;await update(current,version);
  assert.deepEqual(await read(current),initial,'applying an update must not rewrite stored records');
  assert.equal(await current.locator('#reward-0').inputValue(),'应用内容更新后仍保留的草稿');
  assert.equal(await old.locator('#reward-0').inputValue(),'旧标签还没有保存的奖励');
  assert.equal(await old.evaluate(()=>contentCompatibilityMarker),'published-v3');
  let revision=initial.revision;
  for(const page of [old,current]){
   await page.locator('[data-action="toggle-sound"]').click();await waitRevision(page,++revision);
   preserved(await read(page),initial);
  }
  assert.equal((await read(current)).sound,false);
  await old.goto(server.base+'#walk');await current.goto(server.base+'#walk');await ready(old);await ready(current);
  assert.equal(await old.evaluate(()=>contentCompatibilityMarker),'published-v3','the old client must keep running its published bundle');
  const oldImage=await old.locator('.task-art').getAttribute('src');
  assert(legacyImages.has(oldImage.split('/').at(-1)),'the published page may use its existing fallback art');
  assert.equal(await current.locator('.task-art').getAttribute('src'),new URL(cardArt(initial.session.slots[0].card).src,server.base).pathname,'current card uses the built-in rendering map');
  const completions=[];
  for(let index=0;index<7;index++){
   if(index===4){await cached(old,baseline.version);await cached(current,version);await context.setOffline(true);}
   const page=index%2?current:old,saved=await completeVisible(page,addedIds[index]);
   assert.equal(saved.revision,++revision);preserved(saved,initial);
   assert.deepEqual(saved.history.map(score),historyScores);
   completions.push({id:addedIds[index],client:index%2?'current':'published',offline:index>=4,revision});
  }
  // Each release commits offline while another version remains open.
  for(const page of [old,current]){await page.goto(server.base+'#settings');await ready(page);await page.locator('[data-action="toggle-sound"]').click();await waitRevision(page,++revision);preserved(await read(page),initial);}
  assert.equal(await old.evaluate(()=>contentCompatibilityMarker),'published-v3');
  results.push({test:'published/current v3 bidirectional online and offline writes',baseline:baseline.version,version,completions,historyScores});
  console.log('PASS content v3 dual-client snapshots and offline writes');

  await context.setOffline(false);await old.close();
  await current.goto(server.base+'#finish');await ready(current);
  await current.locator('#walk-name').fill('回退时保留的旅程名称');
  await current.locator('#memory').fill('内容更新与回退后都保留这段尚未保存的回忆');
  const beforeFallback=await read(current);served=baseline.resources;
  await update(current,baseline.version);
  assert.deepEqual(await read(current),beforeFallback,'opening the fallback must not mutate new snapshots');
  await current.goto(server.base+'#finish');await ready(current);
  assert.equal(await current.locator('#walk-name').inputValue(),'回退时保留的旅程名称');
  assert.equal(await current.locator('#memory').inputValue(),'内容更新与回退后都保留这段尚未保存的回忆');
  await current.goto(server.base+'#walk');await ready(current);
  await current.locator('.task-art').evaluate(image=>image.decode());
  assert(legacyImages.has((await current.locator('.task-art').getAttribute('src')).split('/').at(-1)));
  await context.setOffline(true);
  const fallbackSaved=await completeVisible(current,addedIds.at(-1));
  assert.equal(fallbackSaved.revision,++revision);preserved(fallbackSaved,initial);
  assert.equal(score(fallbackSaved.session).base,24);
  await current.goto(server.base+'#finish');await ready(current);
  await current.locator('[name="closing"]').check();
  await current.getByRole('button',{name:'保存记录',exact:true}).click();
  await waitRevision(current,++revision);
  if(await current.locator('.reward-dialog[open]').count())await current.getByRole('button',{name:'查看纪念票',exact:true}).click();
  const finished=await read(current);
  assert.equal(finished.session,null);assert.equal(finished.history[0].name,'回退时保留的旅程名称');
  assert.equal(finished.history[0].memory,'内容更新与回退后都保留这段尚未保存的回忆');
  assert.deepEqual(finished.history[0].slots.map(slot=>slot.card),initial.session.slots.map(slot=>slot.card));
  assert.deepEqual(finished.history.slice(1),initial.history);
  assert.equal(finished.version,3);
  await context.setOffline(false);served=resources;await update(current,version);
  assert.deepEqual(await read(current),finished,'returning from fallback must not rewrite the completed new cards');
  await current.goto(server.base+'#library');await ready(current);
  await album(current);
  await current.screenshot({path:output+'/ten-achievements.png',fullPage:true});
  await current.getByRole('button',{name:'任务卡池',exact:true}).click();
  await current.getByRole('button',{name:'＋ 写一张自己的卡',exact:true}).click();
  assert.equal(await current.locator('.art-options input[name="artKey"]').count(),9,'new built-in illustration keys must never leak into saved custom art choices');
  results.push({test:'published v3 fallback completes and saves all eight new cards offline, preserves drafts/history and returns to the new release',from:version,to:baseline.version,revision:finished.revision,finalScore:score(finished.history[0])});
  console.log('PASS published v3 content fallback and forward return');
 }finally{await context.close();}

 served=resources;
 // Existing theme layout coverage stays in the original suite. Check the
 // longest newly clarified task in each base type plus every added event here.
 const alreadySpecific=new Set(['scene-03','scene-09','scene-12','scene-14','talk-09','talk-10','talk-12','talk-13','event-09','event-13','event-14','event-15','event-16']);
 const clarified=CARDS.filter(card=>!addedIds.includes(card.id)&&!alreadySpecific.has(card.id));
 assert.equal(clarified.length,35);
 const length=card=>card.text.length+taskBrief(card,{themePlan:null}).action.length+taskBrief(card,{themePlan:null}).done.length;
 const cases=[...['scene','talk','event'].map(type=>clarified.filter(card=>card.type===type).sort((a,b)=>length(b)-length(a))[0]),...addedIds.map(id=>CARDS.find(card=>card.id===id))];
 for(const width of [320,390]){
  const context=await browser.newContext({viewport:{width,height:width===320?700:844},reducedMotion:'reduce'});
  try{
   const page=await context.newPage();watch(page);await page.goto(server.base+'#walk');await ready(page);
   const layouts=[];
   for(const card of cases){
    const state=initialState();newSession(state,{...state.preferences,mode:'free',journeyTheme:'mixed',place:'both',budget:card.cost,scoring:false});
    state.disabled=CARDS.filter(item=>item.id!==card.id).map(item=>item.id);
    draw(state,state.session.id,null,card.type,()=>0);assert.equal(state.session.slots[0].card.id,card.id);
    await seed(page,state);await page.reload();await page.locator('[data-swipe-card]').waitFor();
    layouts.push({id:card.id,...await geometry(page,card)});
   }
   await page.screenshot({path:`${output}/new-event-${width}.png`});
   await page.goto(server.base+'#library');await page.getByRole('button',{name:'我的纪念',exact:true}).click();
   const seals=await album(page);await page.screenshot({path:`${output}/ten-achievements-${width}.png`,fullPage:true});
   results.push({test:'longest clarified base tasks, eight new events and ten decoded achievement seals retain readable layouts',width,layouts,seals});
   console.log(`PASS content task layout ${width}`);
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile(output+'/results.json',JSON.stringify({baseline:baseline.ref,baselineRelease:baseline.version,release:version,browser:browser.version(),results,errors},null,2));
}catch(error){
 await fs.writeFile(output+'/failure.json',JSON.stringify({message:error.message,results,errors},null,2));
 if(activePage&&!activePage.isClosed())await activePage.screenshot({path:output+'/failure.png',fullPage:true}).catch(()=>{});
 throw error;
}finally{await browser.close();await server.close();}
