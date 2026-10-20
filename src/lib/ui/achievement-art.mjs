import {POSTAL_ART} from './postal-art.mjs';

const oldSeals={departure:3,trio:4,discoveries:5,'theme-observe':4,'theme-duo':5,sixteen:2};
const newSeals={'journeys-3':0,'events-6':1,'custom-first':2,'discoveries-32':3};

export function achievementArt(id){
 if(Object.hasOwn(newSeals,id))return{src:'roam-pixel-seals-content-v1.webp',columns:2,rows:2,index:newSeals[id]};
 return{src:POSTAL_ART.seals,columns:3,rows:2,index:oldSeals[id]??oldSeals.departure};
}
