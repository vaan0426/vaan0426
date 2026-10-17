'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),root=path.resolve(__dirname,'..');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
function availableIllustrations(data){
 const assets=JSON.parse(fs.readFileSync(path.join(root,'platform/news/image-catalog.json'),'utf8')).assets;
 const usedPaths=new Set(data.articles.map(a=>a.image)),usedHashes=new Set(data.articles.map(a=>hash(a.image))),usedScenes=new Set(data.articles.map(a=>a.imageComposition).filter(Boolean));
 return assets.filter(a=>!a.previouslyPublished&&!usedPaths.has(a.path)&&!usedHashes.has(a.sha256)&&!usedScenes.has(a.composition)&&/^platform\/images\/news-[a-z0-9-]+-optimized\.jpg$/.test(a.path)&&fs.existsSync(path.join(root,a.path))&&hash(a.path)===a.sha256);
}
function plain(v,min,max){return typeof v==='string'&&v.length>=min&&v.length<=max&&!/\[[^\]]*\]\(|<\/?[a-z][^>]*>|cite|\\u[0-9a-f]{4}/i.test(v);}
function key(url){const u=new URL(url);return(u.hostname.replace(/^www\./,'')+decodeURIComponent(u.pathname).replace(/\/+$/,'')).toLowerCase();}
const allowedHosts=['pubmed.ncbi.nlm.nih.gov','pmc.ncbi.nlm.nih.gov','doi.org','jamanetwork.com','nature.com','link.springer.com','acamh.onlinelibrary.wiley.com','onlinelibrary.wiley.com','thelancet.com','bmj.com','who.int','cochranelibrary.com','frontiersin.org','sciencedirect.com','research.rug.nl','academic.oup.com','cambridge.org','journals.sagepub.com'];
function validUrl(url){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&allowedHosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))}catch{return false}}
function checkCopy(a,name){
 for(const [f,min,max]of [['title',15,180],['summary',40,500],['evidence',10,200],['limitations',30,1100]])if(!plain(a[f],min,max))throw Error('Invalid '+name+' '+f);
 if(!Array.isArray(a.sections)||a.sections.length<3||a.sections.length>5||a.sections.some(s=>!plain(s.title,3,120)||!plain(s.text,40,1800)))throw Error('Invalid '+name+' sections');
 if(!Array.isArray(a.studyFacts)||a.studyFacts.length!==3||a.studyFacts.some(f=>!plain(f.label,3,80)||!plain(f.value,1,150)))throw Error('Invalid '+name+' study facts');
 const words=[a.title,a.summary,a.limitations,...a.sections.flatMap(s=>[s.title,s.text]),...a.studyFacts.flatMap(f=>[f.label,f.value])].join(' ').trim().split(/\s+/).length;
 const maximum=name==='English'?600:420;
 if(words<150||words>maximum)throw Error(name+' article length outside editorial bounds: '+words);
}
function validate(result,data,day){
 if(!result||!['publish','skip'].includes(result.status)||!plain(result.reason,1,1200))throw Error('Invalid result');
 if(result.status==='skip'){if(result.article!==null)throw Error('Skipped result must contain no article');return null}
 const a=result.article;if(!a||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.id)||a.id.length>100||data.articles.some(x=>x.id===a.id))throw Error('Invalid or duplicate slug');
 checkCopy(a,'Bulgarian');if(!/[А-Яа-я]/.test(a.title))throw Error('Bulgarian title required');checkCopy(a.en||{},'English');
 if(/[А-Яа-я]/.test([a.en.title,a.en.summary,a.en.evidence,a.en.limitations,...a.en.sections.flatMap(s=>[s.title,s.text]),...a.en.studyFacts.flatMap(f=>[f.label,f.value])].join(' ')))throw Error('English copy contains untranslated text');
 if(a.en.sections.length!==a.sections.length)throw Error('Translation structure mismatch');
 if(!/^\d{4}-\d\d-\d\d$/.test(a.sourceDate)||Number.isNaN(Date.parse(a.sourceDate))||new Date(a.sourceDate).toISOString().slice(0,10)!==a.sourceDate||a.sourceDate>day||Date.parse(day)-Date.parse(a.sourceDate)>550*86400000)throw Error('Source date outside recent window');
 if(!Array.isArray(a.sources)||a.sources.length<1||a.sources.length>2||a.sources.some(s=>!plain(s.title,10,300)||!validUrl(s.url)))throw Error('Invalid source');
 const used=new Set(data.articles.flatMap(x=>x.sources.map(s=>key(s.url))));if(a.sources.some(s=>used.has(key(s.url))))throw Error('Duplicate source');
 if(!Array.isArray(a.factChecks)||a.factChecks.length<5||a.factChecks.length>20||a.factChecks.some(f=>!plain(f.claim,10,700)||!plain(f.locator,3,180)||!Number.isInteger(f.sourceIndex)||f.sourceIndex<0||f.sourceIndex>=a.sources.length))throw Error('Missing traceable evidence checks');
 const asset=availableIllustrations(data).find(x=>x.id===a.imageId);if(!asset||!asset.topics.includes(a.topic)||!plain(a.imageReason,20,700))throw Error('Illustration missing, repeated, or mismatched');
 return {id:a.id,topic:a.topic,title:a.title,summary:a.summary,evidence:a.evidence,sourceDate:a.sourceDate,sections:a.sections.map(s=>({title:s.title,text:s.text})),limitations:a.limitations,studyFacts:a.studyFacts.map(f=>({label:f.label,value:f.value})),en:{title:a.en.title,summary:a.en.summary,evidence:a.en.evidence,sections:a.en.sections.map(s=>({title:s.title,text:s.text})),limitations:a.en.limitations,studyFacts:a.en.studyFacts.map(f=>({label:f.label,value:f.value})),imageAlt:asset.altEn},sources:a.sources.map(s=>({title:s.title,url:s.url})),factChecks:a.factChecks.map(f=>({claim:f.claim,sourceIndex:f.sourceIndex,locator:f.locator})),publishedAt:day,reviewedAt:day,image:asset.path,imageId:asset.id,imageComposition:asset.composition,imageAlt:asset.alt,imageReason:a.imageReason};
}
module.exports={validate,availableIllustrations,validUrl,allowedHosts};
