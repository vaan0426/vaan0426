import {esc,nav} from './ui.js';
import {loadNews,card,image,meta,date} from './news-shared.js';
document.querySelector('#news-nav').innerHTML=nav('news');
const root=document.querySelector('#news-content');
const facts=a=>a.studyFacts?.length?'<dl class="news-facts">'+a.studyFacts.map(f=>'<div><dt>'+esc(f.label)+'</dt><dd>'+esc(f.value)+'</dd></div>').join('')+'</dl>':'';
try{
 const articles=await loadNews(),id=new URLSearchParams(location.search).get('article');
 if(id){
  const a=articles.find(a=>a.id===id);
  document.querySelector('.news-heading').remove();
  if(!a){document.title='Публикацията не е намерена';root.innerHTML='<h1>Публикацията не е намерена</h1><p><a href="news.html">Върни се към новините →</a></p>';}
  else{
   document.title=a.title+' · Психолог Цвети Симеонова';
   root.innerHTML='<article class="news-article"><a class="news-read" href="news.html">← Всички публикации</a>'+meta(a)+'<h1>'+esc(a.title)+'</h1><p class="news-lead">'+esc(a.summary)+'</p><figure>'+image(a,true)+'<figcaption>Тематична AI илюстрация. Сцената не представя действителните участници или точните занимания от изследването.</figcaption></figure><div class="news-article-body"><p class="news-evidence">'+esc(a.evidence)+' · Източник: '+esc(date(a.sourceDate))+'</p>'+facts(a)+a.sections.map(s=>'<section><h2>'+esc(s.title)+'</h2><p>'+esc(s.text)+'</p></section>').join('')+'<aside class="news-limit"><h2>Важно при тълкуването</h2><p>'+esc(a.limitations)+'</p></aside><section class="news-sources"><h2>Източници</h2><ul>'+a.sources.map(s=>'<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+' ↗</a></li>').join('')+'</ul><p class="news-meta">Самостоятелен редакционен преразказ на български. Проверено на '+esc(date(a.reviewedAt||a.publishedAt))+'.</p></section><a class="news-read" href="news.html#archive">Към архива →</a></div></article>';
  }
 }else{
  const latest=articles.slice(0,3),archive=articles.slice(3);
  root.innerHTML='<section aria-labelledby="recent-title"><div class="news-section-title"><h2 id="recent-title">Последни публикации</h2><a href="#archive" class="news-read">Към архива ↓</a></div><div class="news-grid" id="recent-news">'+latest.map(card).join('')+'</div></section><section id="archive" class="news-archive" aria-labelledby="archive-title"><p class="news-kicker">ОЩЕ ТЕМИ ЗА РАЗМИСЪЛ</p><h2 id="archive-title">Архив</h2><form class="news-filters" role="search"><label for="news-search">Търси в архива<input id="news-search" type="search" placeholder="Дума, тема или заглавие…" maxlength="120"></label><label for="news-topic">Тема<select id="news-topic"><option value="">Всички теми</option>'+[...new Set(archive.map(a=>a.topic))].sort((a,b)=>a.localeCompare(b,'bg')).map(t=>'<option value="'+esc(t)+'">'+esc(t)+'</option>').join('')+'</select></label><button type="reset" class="news-reset">Изчисти</button></form><p id="archive-count" class="news-meta" role="status" aria-live="polite"></p><div id="archive-results" class="news-grid"></div><button id="archive-more" class="news-reset" hidden>Покажи още</button></section>';
  const search=root.querySelector('#news-search'),topic=root.querySelector('#news-topic'),results=root.querySelector('#archive-results'),more=root.querySelector('#archive-more');
  let limit=12;
  const normalize=v=>v.toLocaleLowerCase('bg-BG').normalize('NFKC').replace(/\s+/g,' ').trim();
  function render(){const q=normalize(search.value),filtered=archive.filter(a=>(!topic.value||a.topic===topic.value)&&normalize([a.title,a.summary,a.topic,...a.sections.map(s=>s.text),a.en?.title||'',a.en?.summary||'',...((a.en?.sections||[]).map(s=>s.text))].join(' ')).includes(q));results.innerHTML=filtered.slice(0,limit).map(card).join('')||'<p class="news-empty">Няма намерени публикации. Опитай друга дума или тема.</p>';root.querySelector('#archive-count').textContent='Намерени: '+filtered.length+' · Показани: '+Math.min(limit,filtered.length);more.hidden=filtered.length<=limit;}
  search.addEventListener('input',()=>{limit=12;render()});topic.addEventListener('change',()=>{limit=12;render()});
  root.querySelector('form').addEventListener('submit',e=>{e.preventDefault();render()});root.querySelector('form').addEventListener('reset',()=>{search.value='';topic.value='';limit=12;render()});more.addEventListener('click',()=>{limit+=12;render()});render();
  if(location.hash==='#archive')requestAnimationFrame(()=>root.querySelector('#archive').scrollIntoView());
 }
}catch{root.innerHTML='<h2>Временно не можем да заредим публикациите.</h2><p><a href="news.html">Опитай отново</a> или <a href="index.html">към началото</a>.</p>';}
finally{root.setAttribute('aria-busy','false');}
