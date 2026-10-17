'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base='http://localhost:4173';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function healthy(){try{return (await(await fetch(base+'/__editor/health',{signal:AbortSignal.timeout(1200)})).json()).kind==='psychology-site-editor'}catch{return false}}
(async()=>{
 if(!await healthy()){
  const dir=path.join(root,'backups','.site-editor-private');fs.mkdirSync(dir,{recursive:true});
  const out=fs.openSync(path.join(dir,'launcher-server.log'),'a');
  const child=spawn(process.execPath,[path.join(root,'server.cjs')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',out,out]});child.unref();fs.closeSync(out);
  for(let i=0;i<40&&!await healthy();i++)await wait(250);
  if(!await healthy())throw Error('Site did not start. Port 4173 may be occupied; see backups/.site-editor-private/launcher-server.log');
 }
 if(!process.argv.includes('--no-browser')){
  const editor=process.argv.includes('--editor'),key=editor?fs.readFileSync(path.join(root,'backups','.site-editor-private/owner-key.txt'),'utf8').trim():'';
  const url=editor?base+'/admin/index.html#editor-login='+key:base+'/';
  const browser=spawn('explorer.exe',[url],{detached:true,windowsHide:true,stdio:'ignore'});browser.unref();
 }
 console.log('Site ready: '+base+'/');
})().catch(error=>{console.error(error.message);process.exitCode=1});
