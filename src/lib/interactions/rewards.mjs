import {score,thresholds} from '../domain/core.mjs';
const escapeText=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function rewardMilestone(session,before){
 if(!session?.scoring)return null;
 const total=score(session).total,ts=thresholds(session);
 const index=ts.reduce((best,t,i)=>before<t&&total>=t?i:best,-1);
 return index<0?null:{points:ts[index],name:session.rewards[index]};
}
// Presentation only: points and completion are persisted before this runs.
export function showCompletion({points=0,scoring=true,milestone=null,signal,compact=false,closing=false,newBadges=[]}={}){
 if(signal?.aborted)return Promise.resolve();
 milestone=scoring?milestone:null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const pageHash=globalThis.location?.hash;
 if(!milestone||compact)return new Promise(resolve=>{
  const stamp=document.createElement('div');stamp.className='completion-stamp';stamp.setAttribute('role','status');
  stamp.textContent=milestone?`✓ 已达奖励档 · ${milestone.name} · 收尾时领取最高档`:scoring?`✓ 任务完成 · +${Number(points)||0} 分`:'✓ 又留下一段共同回忆';
  let timer,ended=false;
  const end=()=>{if(ended)return;ended=true;clearTimeout(timer);stamp.remove();window.removeEventListener('hashchange',navigated);document.removeEventListener('visibilitychange',hidden);signal?.removeEventListener('abort',end);resolve();};
  const navigated=e=>{if(!e?.newURL||new URL(e.newURL).hash!==pageHash)end();};
  const hidden=()=>{if(document.hidden)end();};
  window.addEventListener('hashchange',navigated);document.addEventListener('visibilitychange',hidden);
  signal?.addEventListener('abort',end,{once:true});
  const host=document.querySelector('.card-stage')||document.querySelector('.walk-status');
  if(!host){end();return;}host.append(stamp);
  timer=setTimeout(end,milestone?1600:420);
  // The new card is already persisted and rendered. Ordinary feedback must not
  // block its controls; only milestone dialogs wait for player confirmation.
  resolve();
 });
 return new Promise(resolve=>{
  const layer=document.createElement('dialog');
  layer.className=`reward-dialog${milestone?' reward-milestone':''}`;layer.setAttribute('aria-label',closing?'这一程已收好':milestone?'奖励已解锁':'任务完成');
  const badgeSummary=closing&&newBadges.length?`<p class="closing-badges">这一程点亮 ${newBadges.length} 枚纪念章：${newBadges.slice(0,2).map(escapeText).join(' · ')}${newBadges.length>2?`，另有 ${newBadges.length-2} 枚`:''}。在纪念票下查看。</p>`:'';
  layer.innerHTML=`<div class="reward-scene" aria-hidden="true"><img class="chest chest-closed" src="./chest-closed.webp" alt=""><img class="chest chest-open" src="./chest-open.webp" alt=""><img class="loot-badge" src="./explorer-badge.webp" alt=""><i class="loot-spark s1">✦</i><i class="loot-spark s2">✦</i></div><h2>${closing?'这一程已收好':milestone?'奖励已解锁':'任务完成'}</h2><p>${scoring?`+${Number(points)||0} 积分`:'又发现一段共同回忆'}</p>${milestone?`<div class="milestone-prize"><strong>${escapeText(milestone.name)}</strong><span>${Number(milestone.points)} 分档 · ${closing?'本次领取这一档奖励':'结束时按最高档领取'}</span></div>`:''}${badgeSummary}<button type="button" class="btn ${milestone?'block':'text'}" data-dismiss>${closing?'查看纪念票':'继续冒险'}</button>`;
  let timer,ended=false;
  const end=()=>{if(ended)return;ended=true;clearTimeout(timer);window.removeEventListener('hashchange',navigated);document.removeEventListener('visibilitychange',hidden);signal?.removeEventListener('abort',end);if(layer.open)layer.close();layer.remove();resolve();};
  // A pending hashchange from entering the recap must not dismiss its reward.
  const navigated=e=>{if(!e?.newURL||new URL(e.newURL).hash!==pageHash)end();};
  const hidden=()=>{if(document.hidden)end();};
  layer.addEventListener('cancel',e=>{e.preventDefault();end();});
  layer.addEventListener('close',end);
  layer.querySelector('[data-dismiss]').addEventListener('click',end);
  window.addEventListener('hashchange',navigated);document.addEventListener('visibilitychange',hidden);
  signal?.addEventListener('abort',end,{once:true});
  document.body.append(layer);
  try{layer.showModal();layer.classList.add(reduced?'reward-still':'reward-playing');}catch{end();}
 });
}
