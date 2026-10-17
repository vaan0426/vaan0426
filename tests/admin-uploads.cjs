'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createEditor}=require('../editor/bridge.cjs');
const project=path.resolve(__dirname,'..'),root=fs.mkdtempSync(path.join(project,'backups','admin-upload-test-'));
fs.mkdirSync(path.join(root,'platform/images'),{recursive:true});
fs.writeFileSync(path.join(root,'index.html'),'<!doctype html><html><body><h1>Before</h1></body></html>');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
const original=Buffer.from(png.split(',')[1],'base64');
let runs=0;
const runner=async({job,original:files,uploads,imageFiles,prompt})=>{
 runs++;assert.equal(uploads.length,1);assert.deepEqual(uploads[0].original.bytes,original);assert.ok(prompt.includes('ATTACHED_IMAGES'));
 if(job.message==='reference only')return {summary:'Reference seen',edits:[]};
 const asset=job.attachments[0].assetPath;
 return {summary:'Image placed',edits:[{path:'index.html',baseSha256:files.find(x=>x.path==='index.html').sha256,content:'<!doctype html><html><body><h1>Before</h1><img src="/'+asset+'"></body></html>'}]};
};
let editor=createEditor(root,{runner});
const server=http.createServer(async(req,res)=>{if(!await editor.handle(req,res,new URL(req.url,'http://localhost'))){res.writeHead(404);res.end()}});
(async()=>{try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://localhost:'+server.address().port;
 const call=(route,data,headers={})=>fetch(base+'/__editor/'+route,{method:data?'POST':'GET',headers:{Origin:base,'Content-Type':'application/json',...headers},body:data?JSON.stringify(data):undefined});
 const key=fs.readFileSync(path.join(editor.privateDir,'owner-key.txt'),'utf8').trim();
 const login=await call('login',{key}),cookie=login.headers.get('set-cookie').split(';')[0],access=await login.json(),headers={Cookie:cookie,'X-Editor-CSRF':access.csrf};
 assert.equal(access.role,'admin');
 const saved=fs.readFileSync(path.join(editor.privateDir,'sessions.json'),'utf8');assert.ok(!saved.includes(cookie.slice(12)),'Session identifiers stored hashed');
 editor=createEditor(root,{runner});
 const resumed=await(await call('status',null,headers)).json();assert.equal(resumed.authenticated,true);assert.equal(resumed.role,'admin','Admin session survives restart');
 const request=()=>({requestId:crypto.randomUUID(),message:'place image',selection:{url:base+'/',selector:'h1',text:'Before',html:'<h1>Before</h1>',tag:'h1'},screenshot:png,attachments:[{name:'my photo.png',original:png,preview:png}]});
 let data=request();assert.equal((await call('jobs',{...data,attachments:[{...data.attachments[0],original:'data:image/svg+xml;base64,PHN2Zy8+'}]},headers)).status,400);
 assert.equal((await call('jobs',{...data,attachments:Array(4).fill(data.attachments[0])},headers)).status,400);
 data.message='reference only';const response=await call('jobs',data,headers);assert.equal(response.status,202);
 let state;for(let i=0;i<100;i++){state=await(await call('status',null,headers)).json();if(!state.busy)break;await new Promise(r=>setTimeout(r,20))}
 let job=state.jobs.at(-1);assert.equal(job.status,'answered');assert.ok(!fs.existsSync(path.join(root,job.attachments[0].assetPath)),'Reference-only image remains private');
 assert.equal((await call('jobs/'+data.requestId+'/reference/0')).status,401);
 assert.equal((await call('jobs/'+data.requestId+'/reference/0',null,headers)).status,200);
 assert.deepEqual(fs.readFileSync(path.join(editor.privateDir,'runs',data.requestId,'original-0.png')),original,'Original preserved byte-for-byte');
 data=request();await call('jobs',data,headers);
 for(let i=0;i<100;i++){state=await(await call('status',null,headers)).json();if(!state.busy)break;await new Promise(r=>setTimeout(r,20))}
 job=state.jobs.at(-1);assert.equal(job.status,'completed');assert.ok(job.changed.includes(job.attachments[0].assetPath));
 assert.deepEqual(fs.readFileSync(path.join(root,job.attachments[0].assetPath)),original,'Published image preserves original');
 assert.ok(fs.readFileSync(path.join(root,job.backup,'index.html'),'utf8').includes('Before'));
 assert.ok(JSON.parse(fs.readFileSync(path.join(root,job.backup,'manifest.json'),'utf8')).some(row=>row.existed===false));
 await call('logout',{},headers);editor=createEditor(root,{runner});assert.equal((await(await call('status',null,headers)).json()).authenticated,false,'Logout survives restart');
 console.log(JSON.stringify({passed:true,adminRole:true,persistentSession:true,hashedSessions:true,uploadValidation:true,originalPreserved:true,referencePrivate:true,explicitPublication:true,backupVerified:true,persistentLogout:true,fixture:root},null,2));
}finally{server.close()}})().catch(error=>{console.error(error);process.exitCode=1});
