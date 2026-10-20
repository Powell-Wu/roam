import {spawn} from 'node:child_process';
import {serveResources,resourcesFrom} from './server.mjs';
const resources=await resourcesFrom(process.env.CITYWALK_BUILD_DIR||'dist');
const server=await serveResources(()=>resources);
try{
 const scripts=['scripts/verify-migration.mjs',...(process.env.CITYWALK_E2E_FILTER?[]:['scripts/verify-lifecycle.mjs','scripts/verify-second-round.mjs','scripts/verify-roam-migration.mjs','scripts/verify-editor-polish.mjs','scripts/verify-player-review.mjs','scripts/verify-content-update.mjs'])];
 for(const script of scripts){
  const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[script],{stdio:'inherit',env:{...process.env,CITYWALK_TEST_URL:server.base},windowsHide:true});child.on('error',reject);child.on('exit',code=>resolve(Number.isInteger(code)?code:1));});
  if(code){process.exitCode=code;break;}
 }
}finally{await server.close();}
