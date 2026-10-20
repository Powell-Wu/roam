// Optional, deterministic local image preparation. Published WebP files are committed.
// Usage: node scripts/prepare-content-art.mjs [path-to-sharp-module]
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const sharp=require(process.argv[2]||'sharp');
const root=path.resolve(import.meta.dirname,'..');
const archive=path.join(root,'docs/design/sources/content-update-20261019');
const publicDir=path.join(root,'public');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const manifest={sharp:sharp.versions.sharp,vips:sharp.versions.vips,entries:[]};
const baseline=JSON.parse(await fs.readFile(path.join(archive,'baseline-derivatives.json'),'utf8'));

async function publish(sourceName,name,make,parameters){
 const source=await fs.readFile(path.join(archive,sourceName));
 const bytes=await make(source);
 const meta=await sharp(bytes).metadata();
 assert.equal(meta.width,parameters.width);assert.equal(meta.height,parameters.height);
 if(parameters.maxBytes)assert(bytes.length<=parameters.maxBytes,`${name} exceeds its image budget`);
 await fs.writeFile(path.join(publicDir,name),bytes);
 manifest.entries.push({name,source:sourceName,sourceBytes:source.length,sourceSHA256:hash(source),bytes:bytes.length,SHA256:hash(bytes),...parameters});
 console.log(`${name}: ${bytes.length} B (${meta.width} x ${meta.height})`);
}

for(const entry of baseline){
 const sourceName=`baseline-7b944b9/${entry.file}`;
 assert.equal(hash(await fs.readFile(path.join(archive,sourceName))),entry.sourceSHA256,'Baseline source changed');
 await publish(sourceName,entry.file,source=>sharp(source).resize(480,640,{kernel:'nearest'}).webp({quality:70,alphaQuality:100,effort:6}).toBuffer(),{width:480,height:640,kernel:'nearest',quality:70,alphaQuality:100,effort:6,sourceKind:'Fixed published WebP from git 7b944b9; one encoding pass, not a PNG master'});
}

for(const key of ['improv','shapes','postcard']){
 await publish(`${key}-v1.png`,`art-${key}.webp`,source=>sharp(source).resize(324,432,{kernel:'nearest'}).webp({quality:35,alphaQuality:100,effort:6}).toBuffer(),{width:324,height:432,kernel:'nearest',quality:35,alphaQuality:100,effort:6,maxBytes:20*1024,sourceKind:'Original imagegen PNG'});
}

await publish('seals-content-v1.png','roam-pixel-seals-content-v1.webp',async source=>{
 const resized=await sharp(source).resize(256,256,{kernel:'nearest'}).png().toBuffer();
 const mask=await sharp(resized).extractChannel('alpha').threshold(48).toBuffer();
 // Materialize RGB before joining alpha: Sharp removes alpha late in a single pipeline.
 const rgb=await sharp(resized).removeAlpha().png().toBuffer();
 const indexed=await sharp(rgb).joinChannel(mask).png({palette:true,colours:8,dither:0,effort:10}).toBuffer();
 const bytes=await sharp(indexed).webp({lossless:true,effort:6}).toBuffer();
 const {data,info}=await sharp(bytes).raw().toBuffer({resolveWithObject:true});
 assert.equal(info.channels,4);
 let transparent=0,opaque=0;
 for(let i=3;i<data.length;i+=4){assert(data[i]===0||data[i]===255);transparent+=data[i]===0;opaque+=data[i]===255;}
 assert(transparent>info.width*info.height/3&&opaque>0,'Stamp atlas transparency is invalid');
 for(const [x,y] of [[0,0],[128,0],[0,128],[128,128],[127,127],[255,255]])assert.equal(data[(y*info.width+x)*4+3],0,'Stamp cell corner is not transparent');
 return bytes;
},{width:256,height:256,kernel:'nearest',columns:2,rows:2,cellPixels:128,alphaThreshold:48,paletteColours:8,paletteDither:0,lossless:true,effort:6,maxBytes:8*1024,sourceKind:'Original imagegen transparent PNG'});

manifest.newImageBytes=manifest.entries.filter(entry=>entry.sourceKind.startsWith('Original')).reduce((total,entry)=>total+entry.bytes,0);
manifest.existingImageBytes=manifest.entries.filter(entry=>entry.sourceKind.startsWith('Fixed')).reduce((total,entry)=>total+entry.bytes,0);
manifest.existingImageSavings=baseline.reduce((total,entry)=>total+entry.sourceBytes,0)-manifest.existingImageBytes;
await fs.writeFile(path.join(archive,'preparation-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({newImageBytes:manifest.newImageBytes,existingImageSavings:manifest.existingImageSavings}));
