export function completedCards(state){
 const counts=new Map();for(const journey of [state.session,...state.history].filter(Boolean))for(const slot of journey.slots)if(slot.status==='done'&&slot.card)counts.set(slot.card.id,(counts.get(slot.card.id)||0)+1);
 return counts;
}
export function achievements(state){
 const journeys=[state.session,...state.history].filter(Boolean),distinct=completedCards(state).size;
 const completed=journeys.flatMap(journey=>journey.slots.filter(slot=>slot.status==='done'&&slot.card));
 const events=new Set(completed.filter(slot=>slot.type==='event').map(slot=>slot.card.id)).size;
 const custom=completed.some(slot=>slot.card.id.startsWith('custom-'));
 const saved=state.history.filter(journey=>['short','half','free'].includes(journey.mode)&&journey.endedAt!=null&&journey.closing&&new Set(journey.slots.filter(slot=>slot.status==='done'&&slot.card).map(slot=>slot.type)).size===3).length;
 return [
  {id:'departure',name:'第一次出发',condition:'开始过一局散步',earned:journeys.length>0,progress:journeys.length?'已出发':'等待出发'},
  {id:'trio',name:'三类同行',condition:'在同一局完成观察、对话、合作三类卡',earned:journeys.some(se=>new Set(se.slots.filter(x=>x.status==='done').map(x=>x.type)).size===3),progress:'同一局三类任务'},
  {id:'discoveries',name:'新的眼光',condition:'完成过 8 张不同任务',earned:distinct>=8,progress:`${Math.min(distinct,8)} / 8 张`},
  ...['observe','duo'].map(theme=>({id:`theme-${theme}`,name:theme==='observe'?'城市观察章':'默契同行章',condition:`完成一程${theme==='observe'?'观察城市':'默契挑战'}并勾选一起收尾`,earned:state.history.some(journey=>completeThemeJourney(journey,theme)),progress:'计划卡全部完成；自由模式集齐三类任务'})),
  {id:'sixteen',name:'十六个新发现',condition:'完成过 16 张不同任务',earned:distinct>=16,progress:`${Math.min(distinct,16)} / 16 张`},
  {id:'journeys-3',name:'同行三程',condition:'保存 3 程正式旅程，每程完成三类任务并一起收尾',earned:saved>=3,progress:`${Math.min(saved,3)} / 3 程`},
  {id:'events-6',name:'事件合拍',condition:'完成过 6 张不同事件卡',earned:events>=6,progress:`${Math.min(events,6)} / 6 张`},
  {id:'custom-first',name:'亲手成牌',condition:'完成过 1 张自己创建的任务卡',earned:custom,progress:`${Number(custom)} / 1 张`},
  {id:'discoveries-32',name:'三十二个新发现',condition:'完成过 32 张不同任务',earned:distinct>=32,progress:`${Math.min(distinct,32)} / 32 张`}
 ];
}
export function completeThemeJourney(journey,theme){return journey.journeyTheme===theme&&journey.endedAt!==null&&journey.closing&&journey.slots.length>0&&journey.slots.every(slot=>slot.status==='done')&&(journey.mode!=='free'||new Set(journey.slots.map(slot=>slot.type)).size===3);}
export function nextAchievement(state,nextTheme){
 const badges=achievements(state);
 return badges.find(badge=>badge.id===`theme-${nextTheme}`&&!badge.earned)||badges.find(badge=>!badge.earned)||null;
}
export function keepsakeSummary(state,id){
 const badges=achievements(state),totalBadges=badges.length,earnedCount=badges.filter(badge=>badge.earned).length;
 const index=state.history.findIndex(journey=>journey.id===id);if(index<0)return{newBadges:[],next:null,nextTheme:'observe',totalBadges,earnedCount};
 const earlier={...state,session:null,history:state.history.slice(index+1)},after={...earlier,history:state.history.slice(index)};
 after.history=[state.history[index],...earlier.history];
 const prior=new Set(achievements(earlier).filter(badge=>badge.earned).map(badge=>badge.id)),nextTheme=state.history[index].journeyTheme==='observe'?'duo':'observe';
 const order=[`theme-${state.history[index].journeyTheme}`,'journeys-3','events-6','custom-first','discoveries-32',...badges.map(badge=>badge.id)];
 const newBadges=achievements(after).filter(badge=>badge.earned&&!prior.has(badge.id)).sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
 return{newBadges,next:nextAchievement(state,nextTheme),nextTheme,totalBadges,earnedCount};
}
export function pickCard(state,pool,rng=Math.random){
 // Preferences soften recent repetition, never remove a hard-filtered candidate.
 const recent=new Set(state.history.slice(0,3).flatMap(se=>se.slots.filter(x=>x.status==='done'&&x.card).map(x=>x.card.id)));
 const weights=pool.map(card=>recent.has(card.id)?.25:1),total=weights.reduce((a,b)=>a+b,0);
 let needle=Math.min(.999999999999,Math.max(0,rng()))*total;
 for(let i=0;i<pool.length;i++){needle-=weights[i];if(needle<0)return pool[i];}
 return pool.at(-1);
}
