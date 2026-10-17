'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function sessionStore(dir){
 const file=path.join(dir,'sessions.json'),digest=id=>crypto.createHash('sha256').update(String(id)).digest('hex');
 let records={};try{records=JSON.parse(fs.readFileSync(file,'utf8'))}catch{}
 for(const [key,value] of Object.entries(records))if(!/^[a-f0-9]{64}$/.test(key)||value?.role!=='admin'||!Number.isFinite(value.expires)||value.expires<Date.now()||!/^[a-f0-9]{48}$/.test(value.csrf||''))delete records[key];
 const persist=()=>{const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(records),{mode:0o600});fs.renameSync(temp,file)};
 return {
  get(id){if(!/^[a-f0-9]{64}$/.test(id||''))return;const key=digest(id),value=records[key];if(value?.expires>Date.now()&&value.role==='admin')return value;if(value){delete records[key];persist()}},
  set(id,value){records[digest(id)]={...value,role:'admin'};persist()},
  delete(id){if(id){delete records[digest(id)];persist()}}
 };
};
