import {esc,nav} from './ui.js';
import {t} from './workspace-i18n.js';
import {loadNews,card,image,meta,date} from './news-shared.js';
document.querySelector('#news-nav').innerHTML=nav('news');
const root=document.querySelector('#news-content');
const facts=a=>a.studyFacts?.length?'<dl class="news-facts">'+a.studyFacts.map(f=>'<div><dt>'+esc(f.label)+'</dt><dd>'+esc(f.value)+'</dd></div>').join('')+'</dl>':'';

function mountArticleComments(article){
 if(!/^[a-z0-9][a-z0-9-]{0,159}$/.test(article.id))return;
 const container=document.createElement('section');
 container.id='article-comments';container.className='news-sources news-comments';
 container.dataset.noTranslate='';container.setAttribute('aria-labelledby','article-comments-title');
 const articleBody=root.querySelector('.news-article-body');
 articleBody.insertBefore(container,articleBody.querySelector(':scope > a.news-read'));
 const draft={name:'',email:'',message:''};
 let sending=false,notice='';
 const notices={
  success:()=>t('Коментарът е записан и е достъпен за администратора.','Your comment has been saved and is available to the administrator.'),
  short:()=>t('Напиши коментар от поне 5 знака.','Write a comment of at least 5 characters.'),
  long:()=>t('Коментарът е прекалено дълъг. Съкрати го и опитай отново.','Your comment is too long. Shorten it and try again.'),
  rate:()=>t('Изпратени са много съобщения. Изчакай малко и опитай отново.','Too many messages have been sent. Please wait and try again.'),
  error:()=>t('Коментарът не е потвърден като записан. Текстът е запазен във формата; опитай по-късно.','Your comment could not be confirmed as saved. Your text is still in the form; please try later.')
 };
 function remember(){
  const form=container.querySelector('form');
  if(form)for(const key of Object.keys(draft))draft[key]=form.elements[key].value;
 }
 function render(keepDraft=true){
  if(keepDraft)remember();
  const active=container.contains(document.activeElement)?document.activeElement:null;
  const activeName=active?.name;let caret;
  try{caret=active?.selectionStart}catch{}
  container.innerHTML='<h2 id="article-comments-title">'+t('Остави коментар','Leave a comment')+'</h2><p class="news-meta">'+t('Коментарът се изпраща до администратора и не се публикува автоматично. Не включвай чувствителна лична или здравна информация.','Your comment is sent to the administrator and is not published automatically. Do not include sensitive personal or health information.')+'</p><form id="article-comment-form"><fieldset '+(sending?'disabled':'')+'><label for="comment-name">'+t('Име','Name')+'</label><input id="comment-name" name="name" autocomplete="name" required maxlength="100" value="'+esc(draft.name)+'"><label for="comment-email">'+t('Имейл · само за връзка','Email · for contact only')+'</label><input id="comment-email" name="email" type="email" autocomplete="email" required maxlength="254" value="'+esc(draft.email)+'"><label for="comment-text">'+t('Твоят коментар','Your comment')+'</label><textarea id="comment-text" name="message" required minlength="5" maxlength="1500" rows="5">'+esc(draft.message)+'</textarea><div hidden aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div><button type="submit">'+t(sending?'Изпращане…':'Изпрати коментара',sending?'Sending…':'Send comment')+'</button></fieldset><p id="article-comment-status" class="news-meta" role="status" aria-live="polite">'+(notices[notice]?esc(notices[notice]()):'')+'</p></form>';
  container.querySelector('form').addEventListener('submit',submit);
  if(activeName&&!sending){const field=container.querySelector('form').elements[activeName];if(field){field.focus();if(typeof caret==='number')try{field.setSelectionRange(caret,caret)}catch{}}}
 }
 async function submit(event){
  event.preventDefault();if(sending)return;
  const form=event.currentTarget;if(!form.reportValidity())return;
  remember();
  const text=draft.message.trim();
  if(text.length<5){notice='short';render();return}
  const message='[article-comment:v1]\n'+JSON.stringify({articleId:article.id,title:article.title.slice(0,300),titleEn:(article.en?.title||article.title).slice(0,300),text});
  if(message.length>3900){notice='long';render();return}
  const payload={name:draft.name.trim(),email:draft.email.trim(),message,website:form.elements.website.value};
  sending=true;notice='';render();
  try{
   const response=await fetch('/api/contact',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   if(!response.ok){notice=response.status===429?'rate':'error';return}
   const result=await response.json();if(result.ok!==true)throw Error('Unconfirmed response');
   draft.name='';draft.email='';draft.message='';notice='success';
  }catch{notice='error'}
  finally{sending=false;render(notice!=='success')}
 }
 addEventListener('site-language-change',()=>render());
 render();
 if(location.hash==='#article-comments')requestAnimationFrame(()=>container.scrollIntoView({block:'start'}));
}

try{
 const articles=await loadNews(),id=new URLSearchParams(location.search).get('article');
 if(id){
  const a=articles.find(a=>a.id===id);
  document.querySelector('.news-heading').remove();
  if(!a){document.title='Публикацията не е намерена';root.innerHTML='<h1>Публикацията не е намерена</h1><p><a href="news.html">Върни се към новините →</a></p>';}
  else{
   document.title=a.title+' · Психолог Цвети Симеонова';
   root.innerHTML='<article class="news-article"><a class="news-read" href="news.html">← Всички публикации</a>'+meta(a)+'<h1>'+esc(a.title)+'</h1><p class="news-lead">'+esc(a.summary)+'</p><figure>'+image(a,true)+'<figcaption>Тематична AI илюстрация. Сцената не представя действителните участници или точните занимания от изследването.</figcaption></figure><div class="news-article-body"><p class="news-evidence">'+esc(a.evidence)+' · Източник: '+esc(date(a.sourceDate))+'</p>'+facts(a)+a.sections.map(s=>'<section><h2>'+esc(s.title)+'</h2><p>'+esc(s.text)+'</p></section>').join('')+'<aside class="news-limit"><h2>Важно при тълкуването</h2><p>'+esc(a.limitations)+'</p></aside><section class="news-sources"><h2>Източници</h2><ul>'+a.sources.map(s=>'<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+' ↗</a></li>').join('')+'</ul><p class="news-meta">Самостоятелен редакционен преразказ на български. Проверено на '+esc(date(a.reviewedAt||a.publishedAt))+'.</p></section><a class="news-read" href="news.html#archive">Към архива →</a></div></article>';
   mountArticleComments(a);
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
