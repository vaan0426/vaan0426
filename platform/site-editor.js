import {getLanguage} from './i18n.js';
import {createAdminSession} from './editor-session.js';
import {readImages} from './editor-uploads.js';
const copy={
 'Прикачи снимки':'Attach images','До 3 снимки: JPG, PNG или WebP; до 4 MB всяка и общо 6 MB.':'Up to 3 images: JPG, PNG or WebP; up to 4 MB each and 6 MB total.','Премахни снимката':'Remove image','Подготвям снимките…':'Preparing images…','Можеш да прикачиш до 3 снимки.':'You can attach up to 3 images.','Използвай PNG, JPG или WebP снимка.':'Use a PNG, JPG or WebP image.','Всяка снимка трябва да е до 4 MB.':'Each image must be up to 4 MB.','Общият размер на снимките е до 6 MB.':'Images must be up to 6 MB in total.','Избери по-малка снимка.':'Choose a smaller image.','Снимката е с прекалено големи размери.':'The image dimensions are too large.','Отмени':'Cancel','Чат':'Chat','Редактор на сайта':'Site editor','Затвори':'Close','Изход':'Sign out',
 'Маркирай елемент':'Select an element','Избери родител':'Select parent','Премахни избора':'Clear selection',
 'Посочи част от сайта. Esc отменя избора.':'Choose a part of the site. Esc cancels.',
 'Подготвям снимка…':'Preparing screenshot…','Снимката не се получи. Избери по-малък елемент.':'Capture failed. Select a smaller element.',
 'Опиши желаната промяна…':'Describe the change you want…','Изпрати и промени':'Send and apply',
 'Избери елемент и опиши промяната.':'Select an element and describe the change.',
 'Избраният кадър и описанието се изпращат на Codex. Преди запис се прави проверено копие.':'The selected image and description are sent to Codex. A verified backup is made before saving.',
 'Виж промяната':'View changes','Обработва се…':'Working…','Промяната е записана':'Changes saved','Отговор от Codex':'Codex response',
 'Заявката не завърши':'Request did not complete','Променени файлове':'Changed files','Резервно копие':'Backup',
 'Код за локалния редактор':'Local editor access code','Влез':'Sign in','Влез в редактора':'Sign in to the editor',
 'Отвори файла „Редактор на сайта.bat“ от папката на проекта. Той включва редактора без конзолни команди.':'Open “Редактор на сайта.bat” in the project folder. It starts the editor without console commands.',
 'Чатът продължава контекста на проекта в отделен разговор на Codex.':'This chat continues the project context in a separate Codex conversation.',
 'Неуспешна връзка с локалния редактор.':'Could not connect to the local editor.',
 'Нужен е вход в локалния редактор.':'Sign in to the local editor.',
 'Снимка на избрания елемент':'Selected element screenshot','Съобщение':'Message','Компонент':'Component',
 'Първо избери част от страницата.':'First select part of the page.',
 'Не може да се избере този елемент.':'This element cannot be selected.',
 'Файлът е променен междувременно. Избери елемента отново.':'The file changed meanwhile. Select the element again.',
 'Синтаксисът на променените JS и JSON файлове е проверен. Прегледай визуалния резултат.':'Changed JS and JSON files were checked for syntax. Review the visual result.',
 'Локален администратор':'Local administrator'
};
const t=s=>getLanguage()==='en'?(copy[s]||s):s;
let auth=false,csrf='',opened=false,picking=false,selected=null,selection=null,imageData=null,jobs=[],busy=false,capturing=false,poll=null,host,shadow,draft='',errorText='',uploads=[],uploading=false,sessionClient;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(route,options={}){
 return sessionClient.request(route,options);
}
function initHost(){
 if(host?.isConnected)return;
 host=document.createElement('div');host.id='site-editor-widget';host.dataset.html2canvasIgnore='true';host.dataset.noTranslate='';
 Object.assign(host.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:'2147483000'});
 shadow=host.attachShadow({mode:'open'});shadow.innerHTML='<style>@import url("/platform/site-editor.css");</style><div id="widget"></div><div id="outline" hidden></div><div id="selection-label" hidden aria-hidden="true"></div><div id="picker-tip" hidden></div>';
 document.body.append(host);
}
const ui=()=>shadow.querySelector('#widget');
function attachmentUI(){
 return '<div id="upload-area"><label for="editor-images">'+escape(t('Прикачи снимки'))+'</label><input id="editor-images" type="file" accept="image/png,image/jpeg,image/webp" multiple '+(busy||uploading?'disabled':'')+'><p class="context-note">'+escape(t('До 3 снимки: JPG, PNG или WebP; до 4 MB всяка и общо 6 MB.'))+'</p><div class="upload-list">'+uploads.map((file,index)=>'<div class="upload-item"><img src="'+file.preview+'" alt="'+escape(file.name)+'"><span>'+escape(file.name)+'</span><button type="button" data-remove-upload="'+index+'" '+(busy?'disabled':'')+' aria-label="'+escape(t('Премахни снимката'))+'">×</button></div>').join('')+'</div>'+(uploading?'<p role="status">'+escape(t('Подготвям снимките…'))+'</p>':'')+'</div>';
}

function jobHTML(job){
 const statuses={queued:'Обработва се…',running:'Обработва се…',applying:'Обработва се…',completed:'Промяната е записана',answered:'Отговор от Codex',error:'Заявката не завърши'};
 return '<article class="entry"><p class="owner">'+escape(job.message)+'</p><small class="state">'+escape(t(statuses[job.status]||'Обработва се…'))+'</small>'+(job.hasScreenshot?'<img class="history-shot" alt="'+escape(t('Снимка на избрания елемент'))+'" src="/__editor/jobs/'+escape(job.id)+'/screenshot">':'')+(job.attachments||[]).map((file,index)=>'<img class="history-shot" src="/__editor/jobs/'+escape(job.id)+'/reference/'+index+'" alt="'+escape(file.name)+'">').join('')+'<p class="reply">'+escape(job.answer)+'</p>'+(job.changed?.length?'<p class="meta">'+escape(t('Променени файлове'))+': '+escape(job.changed.join(', '))+'</p><p class="meta">'+escape(t('Резервно копие'))+': '+escape(job.backup)+'</p><p class="meta">'+escape(t('Синтаксисът на променените JS и JSON файлове е проверен. Прегледай визуалния резултат.'))+'</p><button type="button" class="secondary reload">'+escape(t('Виж промяната'))+'</button>':'')+'</article>';
}
function render(){
 if(!host)return;
 const currentText=shadow.querySelector('#request-message');if(currentText)draft=currentText.value;
 const oldText=draft,focused=shadow.activeElement?.id,caret=currentText?.selectionStart;
 const oldScroll=shadow.querySelector('#chat-history'),scroll=oldScroll?.scrollTop||0;
 ui().innerHTML='<button type="button" id="selector-launcher" title="'+escape(t('Маркирай елемент'))+'" aria-label="'+escape(t('Маркирай елемент'))+'" aria-pressed="'+picking+'"><svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5M12 8v8m-4-4h8"/></svg></button><button id="chat-launcher" type="button" aria-expanded="'+opened+'" aria-controls="editor-panel" title="'+escape(t(auth?'Редактор на сайта':'Влез в редактора'))+'"><svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path d="M5 5h14v10H9l-4 4V5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg><span>'+escape(t('Чат'))+'</span></button>'+
 (opened&&!picking?'<section id="editor-panel" role="dialog" aria-label="'+escape(t('Редактор на сайта'))+'"><header><div><strong>'+escape(t('Редактор на сайта'))+'</strong><small>'+escape(t(auth?'Локален администратор':'Влез в редактора'))+'</small></div><div class="header-actions">'+(auth?'<button type="button" id="logout">'+escape(t('Изход'))+'</button>':'')+'<button id="close-chat" type="button" aria-label="'+escape(t('Затвори'))+'">×</button></div></header>'+
 (auth?'<div class="toolbar"><button type="button" id="start-picker" '+(busy||capturing?'disabled':'')+'>'+escape(t('Маркирай елемент'))+'</button>'+(selected?'<button type="button" id="select-parent" class="secondary" '+(busy||capturing?'disabled':'')+'>'+escape(t('Избери родител'))+'</button>':'')+'</div><p class="context-note">'+escape(t('Чатът продължава контекста на проекта в отделен разговор на Codex.'))+'</p><div id="chat-history" aria-live="polite">'+jobs.map(jobHTML).join('')+'</div><div id="selection-card">'+(capturing?'<p role="status">'+escape(t('Подготвям снимка…'))+'</p>':selection?'<div class="selection-top"><strong>'+escape(t('Компонент'))+'</strong><button id="clear-selection" class="secondary" type="button" '+(busy?'disabled':'')+'>'+escape(t('Премахни избора'))+'</button></div><code>'+escape(selection.selector)+'</code><a class="component-link" target="_blank" rel="noopener" href="'+escape(componentLink())+'">'+escape(selection.url)+'</a><img alt="'+escape(t('Снимка на избрания елемент'))+'" src="'+imageData+'">':'<p>'+escape(t('Първо избери част от страницата.'))+'</p>')+'</div><form id="editor-request">'+attachmentUI()+'<label for="request-message">'+escape(t('Съобщение'))+'</label><textarea id="request-message" maxlength="4000" rows="3" placeholder="'+escape(t('Опиши желаната промяна…'))+'" required></textarea><p class="context-note">'+escape(t('Избраният кадър и описанието се изпращат на Codex. Преди запис се прави проверено копие.'))+'</p><button id="send-request" '+(busy||capturing||uploading||!selection||!imageData?'disabled':'')+'>'+escape(t(busy?'Обработва се…':'Изпрати и промени'))+'</button><p id="editor-error" role="alert"></p></form>':
 '<form id="editor-login"><p>'+escape(t('Отвори файла „Редактор на сайта.bat“ от папката на проекта. Той включва редактора без конзолни команди.'))+'</p><label for="editor-key">'+escape(t('Код за локалния редактор'))+'</label><input id="editor-key" type="password" autocomplete="off" required><button>'+escape(t('Влез'))+'</button><p id="editor-error" role="alert"></p></form>')+'</section>':'');
 shadow.querySelector('#selector-launcher').onclick=()=>{if(busy||capturing||uploading)return;if(picking){stopPicker();render()}else startPicker()};
 shadow.querySelector('#chat-launcher').onclick=()=>{if(picking){stopPicker();opened=true;render();return}opened=!opened;render();if(opened)shadow.querySelector(auth?'#start-picker':'#editor-key')?.focus()};
 shadow.querySelector('#close-chat')?.addEventListener('click',()=>{opened=false;render();shadow.querySelector('#chat-launcher').focus()});
 shadow.querySelector('#logout')?.addEventListener('click',async()=>{try{await sessionClient.logout()}catch(error){showError(t(error.message))}});
 shadow.querySelector('#start-picker')?.addEventListener('click',startPicker);
 shadow.querySelector('#select-parent')?.addEventListener('click',()=>{if(selected?.parentElement&&selected.parentElement!==document.body)capture(selected.parentElement)});
 shadow.querySelector('#clear-selection')?.addEventListener('click',()=>{selected=selection=imageData=null;render()});
 shadow.querySelector('#editor-images')?.addEventListener('change',async event=>{const files=[...event.target.files];if(!files.length)return;uploading=true;errorText='';render();try{uploads=await readImages(files,uploads)}catch(error){errorText=t(error.message)}finally{uploading=false;render()}});
 shadow.querySelectorAll('[data-remove-upload]').forEach(button=>button.onclick=()=>{uploads.splice(Number(button.dataset.removeUpload),1);render()});
 shadow.querySelector('#editor-request')?.addEventListener('submit',send);
 shadow.querySelector('#editor-login')?.addEventListener('submit',async event=>{
  event.preventDefault();try{const result=await api('login',{method:'POST',body:JSON.stringify({key:shadow.querySelector('#editor-key').value.trim()})});auth=true;csrf=result.csrf;await refresh();render()}catch(error){showError(error.message)}
 });
 shadow.querySelectorAll('.reload').forEach(button=>button.onclick=()=>location.reload());
 const text=shadow.querySelector('#request-message');if(text){text.value=oldText;text.addEventListener('input',()=>draft=text.value)}
 if(focused&&shadow.getElementById(focused)){shadow.getElementById(focused).focus();if(focused==='request-message'&&typeof caret==='number')text.setSelectionRange(caret,caret)}
 if(errorText&&shadow.querySelector('#editor-error'))shadow.querySelector('#editor-error').textContent=errorText;
 if(shadow.querySelector('#chat-history'))shadow.querySelector('#chat-history').scrollTop=scroll;
 paintSelected();
}
function showError(message){errorText=message;if(!opened){opened=true;render()}const error=shadow.querySelector('#editor-error');if(error)error.textContent=message}
function componentLink(){const url=new URL(selection.url);url.searchParams.set('edit-target',selection.selector);return url.href}
function selectorFor(element){
 const parts=[];let node=element;
 while(node&&node!==document.documentElement){
  if(node.id&&document.querySelectorAll('#'+CSS.escape(node.id)).length===1){parts.unshift('#'+CSS.escape(node.id));break}
  const tag=node.localName,siblings=[...node.parentElement.children].filter(x=>x.localName===tag);
  parts.unshift(tag+(siblings.length>1?':nth-of-type('+(siblings.indexOf(node)+1)+')':''));node=node.parentElement;
 }
 return parts.join(' > ');
}
function highlight(element){
 const rect=element.getBoundingClientRect(),outline=shadow.querySelector('#outline');
 outline.hidden=false;Object.assign(outline.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
 const label=shadow.querySelector('#selection-label');label.textContent=selectorFor(element);label.hidden=false;Object.assign(label.style,{left:Math.max(8,Math.min(rect.left,innerWidth-290))+'px',top:Math.max(4,Math.min(rect.top>30?rect.top-28:rect.bottom+4,innerHeight-32))+'px'});
}
function eligible(element){return auth&&host&&element instanceof Element&&!host.contains(element)&&!['HTML','BODY','SCRIPT','STYLE','LINK','META'].includes(element.tagName)&&element.getBoundingClientRect().width>0}
function startPicker(){
 picking=true;opened=true;shadow.querySelector('#outline').hidden=true;shadow.querySelector('#selection-label').hidden=true;render();shadow.querySelector('#picker-tip').innerHTML='<span>'+escape(t('Посочи част от сайта. Esc отменя избора.'))+'</span><button type="button" id="cancel-picker">'+escape(t('Отмени'))+'</button>';shadow.querySelector('#cancel-picker').onclick=()=>{stopPicker();render()};shadow.querySelector('#picker-tip').hidden=false;
 document.documentElement.classList.add('site-editor-selecting');
}
function stopPicker(){picking=false;document.documentElement.classList.remove('site-editor-selecting');if(shadow){shadow.querySelector('#outline').hidden=true;shadow.querySelector('#selection-label').hidden=true;shadow.querySelector('#picker-tip').hidden=true}}
function fromWidget(event){return event.composedPath().includes(host)}
document.addEventListener('pointermove',event=>{if(!picking||fromWidget(event))return;if(eligible(event.target))highlight(event.target)},true);
document.addEventListener('click',event=>{
 if(!picking||fromWidget(event))return;event.preventDefault();event.stopImmediatePropagation();
 const element=event.target;if(!eligible(element))return;stopPicker();capture(element);
},true);
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&picking){event.preventDefault();stopPicker();render();shadow.querySelector('#start-picker')?.focus()}
 else if(event.key==='Escape'&&opened){opened=false;render();shadow.querySelector('#chat-launcher').focus()}
},true);
let library;
function loadCapture(){
 if(window.html2canvas)return Promise.resolve(window.html2canvas);
 if(!library)library=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/platform/vendor/html2canvas-1.4.1.min.js';script.onload=()=>resolve(window.html2canvas);script.onerror=()=>{library=null;reject(Error(t('Снимката не се получи. Избери по-малък елемент.')))};document.head.append(script)});
 return library;
}
async function capture(element){
 if(!eligible(element)){showError(t('Не може да се избере този елемент.'));return}
 selected=element;selection=imageData=null;errorText='';capturing=true;render();
 try{
  const html2canvas=await loadCapture(),rect=element.getBoundingClientRect();
  if(!rect.width||!rect.height)throw Error();
  const clone=element.cloneNode(true);
  for(const node of [clone,...clone.querySelectorAll('*')]){
   if(node.matches('script')){node.remove();continue}
   for(const attribute of [...node.attributes])if(/^on/i.test(attribute.name)||/^(value|srcdoc)$/i.test(attribute.name))node.removeAttribute(attribute.name);
   if(node.matches('input,textarea,select')){node.textContent='';node.removeAttribute('value')}
  }
  const shot=await html2canvas(document.body,{x:rect.left+scrollX,y:rect.top+scrollY,width:rect.width,height:rect.height,scale:Math.min(1,1600/rect.width,1600/rect.height),backgroundColor:'#fffdf8',logging:false,useCORS:true,imageTimeout:10000,onclone:doc=>{
   doc.querySelector('#site-editor-widget')?.remove();
   doc.querySelectorAll('input,textarea,select').forEach(field=>{field.value='';field.removeAttribute('value');if(field.matches('textarea'))field.textContent=''});
  }});
  imageData=shot.toDataURL('image/png');
  if(imageData.length>3700000)throw Error();
  const url=new URL(location.href);url.searchParams.delete('edit-target');
  selection={url:url.href,selector:selectorFor(element),text:clone.textContent.replace(/\s+/g,' ').trim().slice(0,600),html:clone.outerHTML.slice(0,10000),tag:element.localName};
 }catch{selection=imageData=null;showError(t('Снимката не се получи. Избери по-малък елемент.'))}
 finally{capturing=false;opened=true;render()}
}
async function refresh(){
 return sessionClient.refresh();
}
async function send(event){
 event.preventDefault();const message=shadow.querySelector('#request-message').value.trim();
 if(!selection||!imageData||!message||busy||uploading)return;
 try{
  busy=true;shadow.querySelector('#send-request').disabled=true;
  const result=await api('jobs',{method:'POST',body:JSON.stringify({requestId:crypto.randomUUID(),message,selection,screenshot:imageData,attachments:uploads.map(({name,original,preview})=>({name,original,preview}))})});
  shadow.querySelector('#request-message').value='';draft='';errorText='';uploads=[];jobs.push(result);render();
  clearTimeout(poll);schedulePoll();
 }catch(error){busy=false;render();showError(error.message)}
}
function schedulePoll(){poll=setTimeout(async()=>{poll=null;try{await refresh();if(busy)schedulePoll()}catch{busy=false;showError(t('Неуспешна връзка с локалния редактор.'))}},1400)}
addEventListener('site-language-change',render);
function receiveSession(state){
 const wasAdmin=auth;auth=state.authenticated===true&&state.role==='admin';csrf=state.csrf||'';busy=state.busy||false;jobs=state.jobs||[];
 if(!auth){stopPicker();host?.remove();host=shadow=null;opened=false;selected=selection=imageData=null;uploads=[];if(wasAdmin){draft='';errorText=''}return}
 initHost();render();if(busy&&!poll)schedulePoll();
}
function paintSelected(){
 if(!shadow||picking)return;
 if(auth&&opened&&selected?.isConnected&&imageData){const rect=selected.getBoundingClientRect();if(rect.bottom>=0&&rect.top<=innerHeight){highlight(selected);return}}
 shadow.querySelector('#outline').hidden=true;shadow.querySelector('#selection-label').hidden=true;
}
let frame;
addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(paintSelected)},true);
addEventListener('resize',paintSelected);
sessionClient=createAdminSession(receiveSession);
(async()=>{
 if(!['localhost','127.0.0.1'].includes(location.hostname))return;
 try{
  await sessionClient.boot();
  const target=new URL(location.href).searchParams.get('edit-target');
  if(target&&auth){try{const element=document.querySelector(target);if(element){element.scrollIntoView({block:'center'});opened=true;await capture(element)}}catch{}}
  const style=document.createElement('style');style.textContent='html.site-editor-selecting,html.site-editor-selecting *{cursor:crosshair!important}';document.head.append(style);
 }catch{/* A static preview has no editor service. */}
})();
