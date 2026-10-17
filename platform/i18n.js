const KEY='psychology-site-language';
let language='bg';try{language=new URLSearchParams(location.search).get('lang')||localStorage.getItem(KEY)||'bg'}catch{}if(!['bg','en'].includes(language))language='bg';
const dictionary=new Map(),originals=new WeakMap(),attributes=new WeakMap();
const normalize=s=>s.replace(/\s+/g,' ').trim();
export const getLanguage=()=>language;
export function addTranslations(pairs){for(const [bg,en]of pairs)if(bg&&en)dictionary.set(normalize(bg),en);schedule();}
export function translate(text){if(language==='bg')return text;const key=normalize(text);if(dictionary.has(key))return text.match(/^\s*/)[0]+dictionary.get(key)+text.match(/\s*$/)[0];
 let value=text;
 for(const [bg,en]of [...dictionary].sort((a,b)=>b[0].length-a[0].length))if(bg.length>5&&value.includes(bg))value=value.split(bg).join(en);
 // Dynamic labels keep their values, IDs, amounts and user-entered content intact.
 value=value.replace(/(\d{1,2})\.(\d{1,2})\.(\d{4})\s*г\.,?\s*(\d{1,2}:\d{2})/g,(_,d,m,y,time)=>d+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m)-1]+' '+y+', '+time);
 for(const [bg,en]of [...replacements,['Няма','None']].sort((a,b)=>b[0].length-a[0].length)){const escaped=bg.replace(/[.*+?^\x24{}()|[\]\\]/g,'\\$&');const end=/[\p{L}\p{N}]$/u.test(bg)?'(?![\\p{L}\\p{N}])':'';value=value.replace(new RegExp('(?<![\\p{L}\\p{N}])'+escaped+end,'gu'),()=>en);}
 return value;
}
const replacements=[
 ['Психолог Цвети Симеонова','Psychologist Tsveti Simeonova'],['Цветомила Симеонова','Tsvetomila Simeonova'],['Цвети Симеонова','Tsveti Simeonova'],
 ['Заявка №','Request #'],['Поръчка №','Order #'],['Избран час:','Selected appointment:'],['Заявен час:','Requested appointment:'],['Нов час:','New appointment:'],['Първоначален час:','Original appointment:'],['Текущ час:','Current appointment:'],['Клиентска бележка:','Client note:'],['Бележка:','Note:'],['Общо:','Total:'],['Намерени:','Found:'],['Показани:','Shown:'],['Източник:','Source:'],['Проверено на','Reviewed on'],['Редакция:','Edit:'],
 ['Самостоятелен редакционен преразказ на български.','Independent editorial summary.'],['Водещ: Демо психолог','Facilitator: Demo psychologist'],['Часова зона:','Time zone:'],['Валута:','Currency:'],
 ['Демо посетител','Demo visitor'],['Демо психолог','Demo psychologist'],['Демо администратор','Demo administrator'],['консултации','consultations'],['консултация','consultation'],['за консултация','per consultation'],['минути','minutes'],['места','places'],
 ['януари','January'],['февруари','February'],['март','March'],['април','April'],['май','May'],['юни','June'],['юли','July'],['август','August'],['септември','September'],['октомври','October'],['ноември','November'],['декември','December'],
 ['яну','Jan'],['фев','Feb'],['мар','Mar'],['апр','Apr'],['юни','Jun'],['юли','Jul'],['авг','Aug'],['сеп','Sep'],['окт','Oct'],['ное','Nov'],['дек','Dec'],[' г.',''],[' ч.',''],
 ['Психолог','Psychologist']
];
function updateNode(node){const current=node.nodeValue;let state=originals.get(node);if(!state||current!==state.rendered)state={source:current,rendered:current};state.rendered=translate(state.source);if(current!==state.rendered)node.nodeValue=state.rendered;originals.set(node,state);}
function updateAttribute(element,name){const value=element.getAttribute(name);if(value===null)return;let state=attributes.get(element);if(!state){state={};attributes.set(element,state)}let entry=state[name];if(!entry||value!==entry.rendered)entry={source:value};entry.rendered=translate(entry.source);if(value!==entry.rendered)element.setAttribute(name,entry.rendered);state[name]=entry;}
let pending=false,languageControl;const observer=new MutationObserver(schedule);
function schedule(){if(pending)return;pending=true;queueMicrotask(()=>{pending=false;apply()})}
export function apply(){observer.disconnect();try{
 document.documentElement.lang=language;
 const navigation=document.querySelector('.site-nav,.nav');if(languageControl&&navigation&&!languageControl.isConnected)navigation.append(languageControl);
 const walker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('script,style,textarea,[contenteditable],[data-no-translate]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 let node;while(node=walker.nextNode())if(node.nodeValue.trim())updateNode(node);
 for(const el of document.querySelectorAll('[alt],[aria-label],[placeholder],[title]'))if(!el.closest('[data-no-translate]'))for(const name of ['alt','aria-label','placeholder','title'])updateAttribute(el,name);
 const description=document.querySelector('meta[name=description]');if(description)updateAttribute(description,'content');
 for(const a of document.querySelectorAll('a[href]')){const raw=a.getAttribute('href');if(!raw||raw[0]==='#'||a.hasAttribute('download'))continue;try{const url=new URL(raw,location.href);if(url.origin!==location.origin||!(/\.html$|\/$/.test(url.pathname)))continue;if(language==='en')url.searchParams.set('lang','en');else url.searchParams.delete('lang');const next=url.pathname+url.search+url.hash;if(raw!==next)a.setAttribute('href',next)}catch{}}
 document.querySelectorAll('[data-language]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.language===language));b.classList.toggle('is-current',b.dataset.language===language)});
 }finally{observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true})}}
export function setLanguage(next){if(!['bg','en'].includes(next))return;language=next;try{localStorage.setItem(KEY,next)}catch{}const url=new URL(location.href);url.searchParams.set('lang',next);history.replaceState(null,'',url);apply();dispatchEvent(new CustomEvent('site-language-change',{detail:{language}}));}
const icon='<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg>';
function boot(){const box=document.createElement('div');languageControl=box;box.className='language-switch';box.dataset.noTranslate='';box.setAttribute('role','group');box.setAttribute('aria-label','Език / Language');box.innerHTML=icon+'<button type="button" data-language="bg" lang="bg" aria-label="Прочети на български">BG</button><button type="button" data-language="en" lang="en" aria-label="Read in English">EN</button>';box.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.language)));apply();}
const data=await (await fetch(new URL('./i18n-ui.json',import.meta.url),{cache:'no-cache'})).json();addTranslations(Object.entries(data));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('storage',e=>{if(e.key===KEY&&['bg','en'].includes(e.newValue)){language=e.newValue;apply();dispatchEvent(new CustomEvent('site-language-change',{detail:{language}}))}});
