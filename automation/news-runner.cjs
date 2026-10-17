'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dataPath=path.join(root,'platform/news/articles.json');
const art={
 'Тийнейджъри':['teen','Двама тийнейджъри разговарят на пейка, оставили телефона настрани.'],
 'Деца и семейство':['family','Родители с внимание наблюдават дете, което строи мост от дървени кубчета.'],
 'Двойки':['couple','Двойка разговаря спокойно в уютна стая.'],
 'Жени и безопасност':['safety','Жена разговаря с подкрепяща я консултантка край светъл прозорец.'],
 'Страхове и фобии':['phobia','Жена с очила за виртуална реалност седи безопасно до терапевт.'],
 'Констелации':['constellations','Жена разглежда дървени фигури с подкрепата на консултант.']
};
const hosts=['pubmed.ncbi.nlm.nih.gov','pmc.ncbi.nlm.nih.gov','doi.org','jamanetwork.com','nature.com','link.springer.com','acamh.onlinelibrary.wiley.com','onlinelibrary.wiley.com','thelancet.com','bmj.com','who.int','cochranelibrary.com','frontiersin.org','sciencedirect.com','research.rug.nl','academic.oup.com','cambridge.org','journals.sagepub.com'];
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Sofia'});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function sourceKey(s){const u=new URL(s);u.hash='';u.search='';return (u.hostname.replace(/^www\./,'')+decodeURIComponent(u.pathname).replace(/\/+$/,'')).toLowerCase();}
function validUrl(s){const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h));}
function validate(result,data,day=today()){return require('./news-policy.cjs').validate(result,data,day);}
async function registrySource(url){
 const m=decodeURIComponent(url).match(/10\.\d{4,9}\/[^?#]+/);if(!m)throw Error('Source blocks verification and has no DOI');
 const doi=m[0].replace(/\/$/,'').toLowerCase();
 const res=await fetch('https://api.crossref.org/works/'+encodeURIComponent(doi),{signal:AbortSignal.timeout(25000),headers:{'User-Agent':'PsychologyJaneNews/1.0 (bibliographic verification)'}});
 if(!res.ok)throw Error('DOI registry unavailable: '+res.status);const record=(await res.json()).message;
 if(!record||record.DOI?.toLowerCase()!==doi||record.type!=='journal-article'||!record.title?.[0])throw Error('DOI metadata not verified');
 if(record.relation?.['is-retracted-by']?.length)throw Error('Retraction recorded');
 const parts=record['published-online']?.['date-parts']?.[0]||record.published?.['date-parts']?.[0];
 return {url,doi,verification:'registry-metadata',title:record.title[0],publicationDate:parts?.map((n,i)=>i?String(n).padStart(2,'0'):String(n)).join('-')||null};
}
async function verifySource(url){
 let current=url;
 for(let hop=0;hop<6;hop++){
  if(!validUrl(current)&&!(new URL(url).hostname==='link.springer.com'&&new URL(current).hostname==='idp.springer.com'&&new URL(current).protocol==='https:'))throw Error('Unexpected source redirect');
  const res=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(25000),headers:{'User-Agent':'PsychologyJaneNews/1.0 (source verification)'}});
  if([301,302,303,307,308].includes(res.status)){const next=res.headers.get('location');await res.body?.cancel();if(!next)throw Error('Redirect has no target');current=new URL(next,current).href;continue;}
  if([403,429].includes(res.status)){await res.body?.cancel();return registrySource(url);}
  if(!res.ok)throw Error('Source unavailable: '+res.status);
  if(!validUrl(current)){await res.body?.cancel();return registrySource(url);}
  const type=res.headers.get('content-type')||'';if(!/text\/html|application\/pdf/.test(type))throw Error('Unexpected source type');
  if(type.includes('pdf')){await res.body?.cancel();return {url:current,doi:null};}
  const text=await res.text();if(text.length<500||/cf-chl-|<title>\s*(?:Just a moment|Access Denied|Checking your browser)/i.test(text))return registrySource(url);
  const match=text.match(/<meta[^>]+name=["'](?:citation_doi|DC\.Identifier)["'][^>]+content=["'](?:doi:)?(10\.\d{4,9}\/[^"']+)/i);
  if(!match&&/10\.\d{4,9}\//.test(decodeURIComponent(url)))return registrySource(url);
  const canonical=new URL(current);canonical.search='';canonical.hash='';
  return {url:canonical.href,doi:match?.[1]?.toLowerCase()||decodeURIComponent(url).match(/10\.\d{4,9}\/[^?#]+/)?.[0]?.toLowerCase()||null,verification:'public-source-page'};
 }
 throw Error('Too many redirects');
}
function publish(data,article,original){
 if(digest(fs.readFileSync(dataPath))!==digest(original))throw Error('News changed during research; retry next run');
 const stamp=new Date().toISOString().replace(/[:.]/g,'-'),backup=path.join(root,'backups','before-news-update-'+stamp);
 fs.mkdirSync(backup,{recursive:true});const target=path.join(backup,'articles.json');fs.copyFileSync(dataPath,target);
 if(digest(fs.readFileSync(target))!==digest(original))throw Error('Backup verification failed');
 fs.writeFileSync(path.join(backup,'manifest.json'),JSON.stringify({original:'platform/news/articles.json',sha256:digest(original),createdAt:new Date().toISOString()},null,2));
 const next={...data,updatedAt:today(),articles:[article,...data.articles]},temp=dataPath+'.'+stamp+'.tmp';
 fs.writeFileSync(temp,JSON.stringify(next,null,2)+'\n','utf8');
 const check=JSON.parse(fs.readFileSync(temp,'utf8'));if(check.articles.length!==data.articles.length+1||check.articles[0].id!==article.id)throw Error('Staged news invalid');
 if(digest(fs.readFileSync(dataPath))!==digest(original)){fs.unlinkSync(temp);throw Error('Concurrent news change');}
 fs.renameSync(temp,dataPath);return backup;
}

async function auditArticle(cli,runDir,article,illustration){
 const output=path.join(runDir,'audit.json'),log=fs.openSync(path.join(runDir,'audit-agent.log'),'wx');
 const prompt=fs.readFileSync(path.join(__dirname,'news-audit-prompt.md'),'utf8')+'\nCANDIDATE:\n'+JSON.stringify({article,illustration});
 const args=['--search','--ask-for-approval','never','exec','--sandbox','read-only','--skip-git-repo-check','--ephemeral','-C',root,'--output-schema',path.join(__dirname,'news-audit.schema.json'),'-o',output,'-'];
 try{await new Promise((resolve,reject)=>{const child=spawn(cli,args,{cwd:root,windowsHide:true,stdio:['pipe',log,log]});const timer=setTimeout(()=>{child.kill();reject(Error('Editorial audit exceeded 8 minutes'))},8*60*1000);child.once('error',e=>{clearTimeout(timer);reject(e)});child.once('exit',code=>{clearTimeout(timer);code===0?resolve():reject(Error('Editorial audit failed, exit '+code))});child.stdin.on('error',()=>{});child.stdin.end(prompt)});}finally{fs.closeSync(log)}
 const result=JSON.parse(fs.readFileSync(output,'utf8'));if(typeof result.pass!=='boolean'||!Array.isArray(result.issues)||!Array.isArray(result.confirmedSources))throw Error('Invalid audit');return result;
}

async function run(){
 const lock=path.join(os.tmpdir(),'psychology-jane-news-'+digest(root).slice(0,12)+'.lock');
 let fd;try{fd=fs.openSync(lock,'wx');fs.writeFileSync(fd,String(process.pid));}catch(e){if(e.code==='EEXIST'){const pid=Number(fs.readFileSync(lock,'utf8'));try{process.kill(pid,0);console.log('Another update is running');return;}catch{fs.unlinkSync(lock);fd=fs.openSync(lock,'wx');fs.writeFileSync(fd,String(process.pid));}}else throw e;}
 const stamp=new Date().toISOString().replace(/[:.]/g,'-'),runDir=path.join(__dirname,'runs',stamp);fs.mkdirSync(runDir,{recursive:true});
 const report={startedAt:new Date().toISOString(),dryRun:process.argv.includes('--dry-run'),status:'running'};
 try{
  const original=fs.readFileSync(dataPath),data=JSON.parse(original),topics=Object.keys(art),preferred=topics[data.articles.length%topics.length];
  const instructions=fs.readFileSync(path.join(__dirname,'news-editorial-prompt.md'),'utf8');
  const available=require('./news-policy.cjs').availableIllustrations(data);if(!available.length){report.status='skipped';report.reason='No unused suitable illustration is available; older images will not be repeated.';return;}
  const context={allowedSourceHosts:require('./news-policy.cjs').allowedHosts,today:today(),preferredTopic:preferred,topics,availableIllustrations:available.map(a=>({id:a.id,topics:a.topics,description:a.description,composition:a.composition})),recentScenes:data.articles.slice(0,6).map(a=>({topic:a.topic,imageComposition:a.imageComposition})),existing:data.articles.map(a=>({id:a.id,title:a.title,sources:a.sources}))};
  const prompt=instructions+'\nCONTEXT:\n'+JSON.stringify(context);
  fs.writeFileSync(path.join(runDir,'prompt.txt'),prompt,'utf8');
  const cli=process.env.CODEX_NEWS_CLI||path.join(process.env.LOCALAPPDATA||'','Programs/OpenAI/Codex/bin/codex.exe');
  if(!fs.existsSync(cli))throw Error('Codex CLI not found; set CODEX_NEWS_CLI');
  const candidatePath=path.join(runDir,'candidate.json'),log=fs.openSync(path.join(runDir,'agent.log'),'wx');
  const args=['--search','--ask-for-approval','never','exec','--sandbox','read-only','--skip-git-repo-check','--ephemeral','-C',root,'--output-schema',path.join(__dirname,'news-output.schema.json'),'-o',candidatePath,'-'];
  const code=await new Promise((resolve,reject)=>{const child=spawn(cli,args,{cwd:root,windowsHide:true,stdio:['pipe',log,log]});const timer=setTimeout(()=>{child.kill();reject(Error('Research exceeded 12 minutes'));},12*60*1000);child.once('error',e=>{clearTimeout(timer);reject(e)});child.once('exit',code=>{clearTimeout(timer);resolve(code)});child.stdin.on('error',()=>{});child.stdin.end(prompt);}).finally(()=>fs.closeSync(log));
  if(code!==0)throw Error('Research agent failed, exit '+code+'; see agent.log');
  const result=JSON.parse(fs.readFileSync(candidatePath,'utf8')),article=validate(result,data);report.reason=result.reason;
  if(!article){report.status='skipped';}
  else{
   const verification=[];for(const s of article.sources)verification.push(await verifySource(s.url));
   if(verification[0].publicationDate&&verification[0].publicationDate!==article.sourceDate.slice(0,verification[0].publicationDate.length))throw Error('Research date differs from DOI registry');
   const oldKeys=new Set(data.articles.flatMap(a=>a.sources.map(s=>sourceKey(s.url))));
   if(verification.some(s=>oldKeys.has(sourceKey(s.url))))throw Error('Source redirects to an existing study');
   // Compare verified primary DOI metadata with the retained identity of older sources.
   const newDois=verification.map(s=>s.doi).filter(Boolean);
   const oldDois=new Set(data.articles.flatMap(a=>(a.sourceKeys||[]).map(s=>s.doi).filter(Boolean)));
   for(const a of data.articles)for(const s of a.sources){const m=decodeURIComponent(s.url).match(/10\.\d{4,9}\/[^?#]+/);if(m)oldDois.add(m[0].replace(/\/$/,'').toLowerCase());}
   if(newDois.some(doi=>oldDois.has(doi)))throw Error('Study already published under an alternative URL');
   article.sourceKeys=verification;report.article=article.id;
   const audit=await auditArticle(cli,runDir,result.article,available.find(a=>a.id===article.imageId));if(!audit.pass||audit.issues.length||!article.sources.every(s=>audit.confirmedSources.some(u=>sourceKey(u)===sourceKey(s.url))))throw Error('Independent source/translation audit failed: '+audit.issues.join('; '));
   article.editorialAudit={checkedAt:new Date().toISOString(),mode:'automated-independent-source-and-translation-audit',confirmedSources:audit.confirmedSources};report.independentAudit='passed';
   report.status=report.dryRun?'validated-dry-run':'published';
   if(!report.dryRun)report.backup=publish(data,article,original);
  }
 }catch(e){report.status='failed';report.error=String(e.message||e);process.exitCode=1;}
 finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(runDir,'result.json'),JSON.stringify(report,null,2),'utf8');if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(lock)}catch{}console.log(JSON.stringify({...report,runDir},null,2));}
}
module.exports={validate,sourceKey,validUrl,publish,verifySource,auditArticle};
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
