const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {validate,availableIllustrations,validUrl}=require('../automation/news-policy.cjs');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../platform/news/articles.json'),'utf8'));
const example=structuredClone(data.articles.find(a=>a.id==='socialni-mrezhi-tineydzhari-2026'));
const asset=availableIllustrations(data).find(a=>a.topics.includes(example.topic));assert.ok(asset,'A fresh thematic illustration exists');
const result={status:'publish',reason:'Synthetic validation fixture, never published',article:{...example,id:'new-research-test',sourceDate:'2026-10-01',imageId:asset.id,imageReason:'A new thematic scene matches the adolescent audience without depicting study participants.',factChecks:Array.from({length:5},(_,i)=>({claim:'Synthetic evidence check for validation only '+i,sourceIndex:0,locator:'Methods and Results'})),sources:[{title:'Synthetic primary study for unit validation',url:'https://pubmed.ncbi.nlm.nih.gov/99999999/'}]}};
const valid=validate(result,data,'2026-10-15');assert.equal(valid.image,asset.path);assert.equal(valid.en.title,result.article.en.title);
for(const url of ['http://pubmed.ncbi.nlm.nih.gov/1','https://pubmed.ncbi.nlm.nih.gov.evil.example/1','https://localhost/1','https://user:pass@pubmed.ncbi.nlm.nih.gov/1','https://pubmed.ncbi.nlm.nih.gov:4430/1','not-a-url'])assert.equal(validUrl(url),false,url);
for(const change of [
 a=>a.id=data.articles[0].id,a=>a.sources=data.articles[0].sources,a=>a.sourceDate='2027-01-01',a=>a.sourceDate='2026-02-31',a=>a.sourceDate='2020-01-01',a=>a.topic='Other',a=>a.sections=[],a=>a.summary='word '.repeat(500),a=>a.sources=[{title:'Private server',url:'https://127.0.0.1/admin'}],a=>a.en=null,a=>a.en.title='Непреведено заглавие',a=>a.en.sections.pop(),a=>a.studyFacts=[],a=>a.factChecks=[],a=>a.factChecks[0].sourceIndex=5,a=>a.imageId=data.articles[0].imageId
]){const copy=structuredClone(result);change(copy.article);assert.throws(()=>validate(copy,data,'2026-10-15'))}
const consumed={...data,articles:[...data.articles,valid]};assert.ok(!availableIllustrations(consumed).some(a=>a.id===asset.id),'Published assets cannot be reused');
const renamed={...data,articles:[...data.articles,{...valid,imageId:'other-id'}]};assert.ok(!availableIllustrations(renamed).some(a=>a.id===asset.id),'Path/hash prevents reuse after renaming an ID');
assert.equal(validate({status:'skip',reason:'No suitable evidence',article:null},data,'2026-10-15'),null);
assert.equal(new Set(data.articles.map(a=>a.image)).size,data.articles.length,'Every published article has a distinct image');
console.log({passed:true,checks:'bilingual structure, source traceability, valid dates/URLs, no reused images, safe skip'});
