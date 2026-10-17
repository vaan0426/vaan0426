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
Object.assign(copy,{'Ти':'You','Редактор':'Editor','Изпращам заявката…':'Sending your request…','Заявката е получена':'Request received','Подготвям избрания компонент':'Preparing the selected component','Свързвам се с Codex':'Connecting to Codex','Обработвам заявката':'Processing your request','Преглеждам файловете':'Inspecting files','Проверявам предложението':'Checking the proposal','Правя резервно копие и записвам':'Backing up and saving','Готово — промените са записани':'Done — changes saved','Готово — отговорът е получен':'Done — response received','Проверявам връзката…':'Checking the connection…','Връзката е прекъсната. Заявката може да продължава на сървъра.':'Connection interrupted. Your request may still be running on the server.','Провери отново':'Check again','Изпрати отново':'Send again','Време':'Elapsed','Обнови снимката':'Refresh capture','Елементът вече не е на страницата. Избери го отново.':'The element is no longer on the page. Select it again.','Задръж Alt за избор на вложен елемент.':'Hold Alt to select a nested element.','Последна активност':'Last activity','Не затваряй сайта, за да следиш отговора тук. Можеш да затвориш само прозореца на чата.':'Keep the site open to follow the response here. You can close just the chat panel.','Покажи снимките':'Show images','Проверките са завършени. Прегледай резултата на сайта.':'Checks completed. Review the result on the website.'});
let sending=false,pendingPayload=null,chatConnection='online',followChat=false;
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
 const active=['sending','queued','running','applying','connection'].includes(job.status),phase=job.events?.at(-1)?.phase||job.status;
 const phases={sending:'Изпращам заявката…',received:'Заявката е получена',queued:'Заявката е получена',preparing:'Подготвям избрания компонент',connecting:'Свързвам се с Codex',running:'Обработвам заявката',working:'Обработвам заявката',inspecting:'Преглеждам файловете',validating:'Проверявам предложението',saving:'Правя резервно копие и записвам',completed:'Готово — промените са записани',answered:'Готово — отговорът е получен',error:'Заявката не завърши',connection:'Проверявам връзката…'};
 const images=(job.hasScreenshot?'<img class="history-shot" alt="'+escape(t('Снимка на избрания елемент'))+'" src="/__editor/jobs/'+escape(job.id)+'/screenshot">':'')+(job.attachments||[]).map((file,index)=>'<img class="history-shot" src="/__editor/jobs/'+escape(job.id)+'/reference/'+index+'" alt="'+escape(file.name)+'">').join('');
 return '<article class="entry" data-job-id="'+escape(job.id)+'"><div class="message-owner"><small>'+t('Ти')+'</small><p class="owner">'+escape(job.message)+'</p></div>'+(images?'<details class="history-images"><summary>'+t('Покажи снимките')+'</summary>'+images+'</details>':'')+'<div class="message-assistant"><small>'+t('Редактор')+'</small><p class="state" role="status">'+(active?'<span class="typing" aria-hidden="true"><i></i><i></i><i></i></span>':'')+'<strong>'+escape(t(phases[phase]||phases[job.status]||'Обработва се…'))+'</strong></p><ol class="job-progress">'+(job.events||[]).slice(-5).map(event=>'<li><time>'+escape(new Date(event.at).toLocaleTimeString(getLanguage()==='en'?'en-GB':'bg-BG',{hour:'2-digit',minute:'2-digit'}))+'</time> '+escape(t(phases[event.phase]||'Обработва се…'))+'</li>').join('')+'</ol>'+(job.answer?'<p class="reply">'+escape(job.answer)+'</p>':'')+'<p class="meta">'+t('Време')+': <span data-elapsed="'+escape(job.createdAt)+'" '+(job.finishedAt?'data-finished="'+escape(job.finishedAt)+'"':'')+'></span></p>'+(active?'<p class="meta">'+t('Не затваряй сайта, за да следиш отговора тук. Можеш да затвориш само прозореца на чата.')+'</p>':'')+(job.status==='connection'?'<button type="button" class="secondary check-connection">'+t('Провери отново')+'</button><button type="button" class="secondary retry-send">'+t('Изпрати отново')+'</button>':'')+(job.changed?.length?'<p class="meta">'+escape(t('Променени файлове'))+': '+escape(job.changed.join(', '))+'</p><p class="meta">'+escape(t('Резервно копие'))+': '+escape(job.backup)+'</p><p class="meta">'+escape(t('Проверките са завършени. Прегледай резултата на сайта.'))+'</p><button type="button" class="secondary reload">'+escape(t('Виж промяната'))+'</button>':'')+'</div></article>';
}
function render(){
 if(!host)return;
 const currentText=shadow.querySelector('#request-message');if(currentText)draft=currentText.value;
 const oldText=draft,focused=shadow.activeElement?.id,caret=currentText?.selectionStart;
 const oldScroll=shadow.querySelector('#chat-history'),scroll=oldScroll?.scrollTop||0,atEnd=!oldScroll||oldScroll.scrollHeight-oldScroll.clientHeight-scroll<55;
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
 if(shadow.querySelector('#chat-history')){const history=shadow.querySelector('#chat-history');history.scrollTop=followChat||atEnd?history.scrollHeight:scroll;followChat=false;history.setAttribute('role','log');history.setAttribute('aria-label',t('Чат'))}
 shadow.querySelectorAll('.check-connection').forEach(button=>button.onclick=()=>refresh().catch(()=>showError(t('Връзката е прекъсната. Заявката може да продължава на сървъра.'))));
 shadow.querySelectorAll('.retry-send').forEach(button=>button.onclick=()=>{if(pendingPayload&&!sending)transmit(pendingPayload)});
 const card=shadow.querySelector('#selection-card');if(card&&selected&&imageData){const refreshButton=document.createElement('button');refreshButton.type='button';refreshButton.className='secondary';refreshButton.textContent=t('Обнови снимката');refreshButton.disabled=busy||capturing;refreshButton.onclick=()=>capture(selected);card.append(refreshButton);if(selection?.bounds){const size=document.createElement('small');size.textContent=Math.round(selection.bounds.width)+' × '+Math.round(selection.bounds.height)+' px';card.append(size)}}
 updateElapsed();
 shadow.querySelector('#chat-launcher').dataset.busy=String(busy);
 if(chatConnection==='offline'&&opened){const notice=document.createElement('p');notice.id='connection-status';notice.setAttribute('role','status');notice.textContent=t('Връзката е прекъсната. Заявката може да продължава на сървъра.');const button=document.createElement('button');button.className='secondary';button.textContent=t('Провери отново');button.onclick=()=>refresh().catch(()=>{});notice.append(button);shadow.querySelector('#chat-history')?.before(notice)}
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
function eligible(element){if(!auth||!host||!(element instanceof Element)||host.contains(element)||['HTML','BODY','SCRIPT','STYLE','LINK','META'].includes(element.tagName))return false;const r=element.getBoundingClientRect(),s=getComputedStyle(element);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'}
function pickTarget(event){let element=event.composedPath().find(node=>node instanceof Element&&!host?.contains(node));if(!element)return null;const svg=element.closest('svg');if(svg)element=svg;if(!event.altKey&&!element.matches('img,input,textarea,select'))element=element.closest('button,a,label')||element;return element}
function startPicker(){
 picking=true;opened=true;shadow.querySelector('#outline').hidden=true;shadow.querySelector('#selection-label').hidden=true;render();shadow.querySelector('#picker-tip').innerHTML='<span>'+escape(t('Посочи част от сайта. Esc отменя избора.'))+'</span><button type="button" id="cancel-picker">'+escape(t('Отмени'))+'</button>';shadow.querySelector('#cancel-picker').onclick=()=>{stopPicker();render()};shadow.querySelector('#picker-tip').hidden=false;
 document.documentElement.classList.add('site-editor-selecting');
}
function stopPicker(){picking=false;document.documentElement.classList.remove('site-editor-selecting');if(shadow){shadow.querySelector('#outline').hidden=true;shadow.querySelector('#selection-label').hidden=true;shadow.querySelector('#picker-tip').hidden=true}}
function fromWidget(event){return event.composedPath().includes(host)}
document.addEventListener('pointermove',event=>{if(!picking||fromWidget(event))return;const target=pickTarget(event);if(eligible(target))highlight(target)},true);
document.addEventListener('click',event=>{
 if(!picking||fromWidget(event))return;event.preventDefault();event.stopImmediatePropagation();
 const element=pickTarget(event);if(!eligible(element))return;stopPicker();capture(element);
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
  const html2canvas=await loadCapture();await document.fonts?.ready;
  await Promise.allSettled([...element.querySelectorAll('img'),...(element.matches('img')?[element]:[])].map(img=>img.decode()));
  if(!element.isConnected)throw Error();const selector=selectorFor(element),rect=element.getBoundingClientRect();
  if(!rect.width||!rect.height||document.querySelectorAll(selector).length!==1||document.querySelector(selector)!==element)throw Error();
  const frozen=[];for(let node=element;node&&node!==document.documentElement;node=node.parentElement){const style=getComputedStyle(node);frozen.push({selector:selectorFor(node),opacity:style.opacity,transform:style.transform,filter:style.filter})}
  const clone=element.cloneNode(true);
  for(const node of [clone,...clone.querySelectorAll('*')]){
   if(node.matches('script')){node.remove();continue}
   for(const attribute of [...node.attributes])if(/^on/i.test(attribute.name)||/^(value|srcdoc)$/i.test(attribute.name))node.removeAttribute(attribute.name);
   if(node.matches('input,textarea,select')){node.textContent='';node.removeAttribute('value')}
  }
  const captureScroll={x:scrollX,y:scrollY};
  const captureOptions={x:rect.left+captureScroll.x,y:rect.top+captureScroll.y,width:rect.width,height:rect.height,scrollX:captureScroll.x,scrollY:captureScroll.y,windowWidth:innerWidth,windowHeight:innerHeight,scale:Math.min(1,1600/rect.width,1600/rect.height),backgroundColor:'#fffdf8',logging:false,useCORS:true,imageTimeout:10000,onclone:doc=>{
   doc.querySelector('#site-editor-widget')?.remove();
   doc.querySelectorAll('*').forEach(node=>{node.style.animationPlayState='paused';node.style.transition='none'});
   for(const item of frozen){const node=doc.querySelector(item.selector);if(node)for(const key of ['opacity','transform','filter'])node.style.setProperty(key,item[key],'important')}
   doc.querySelectorAll('input,textarea,select').forEach(field=>{field.value='';field.checked=false;field.removeAttribute('value');if(field.matches('textarea'))field.textContent=''});
   // The clone can reflow (fonts, lazy images or animation state). html2canvas
   // reads x/y after onclone, so crop against the actual cloned target bounds.
   const target=doc.querySelector(selector);if(!target)throw Error('Selected target missing from clone');const cloned=target.getBoundingClientRect();
   if(!cloned.width||!cloned.height||Math.abs(cloned.width-rect.width)>Math.max(4,rect.width*.05)||Math.abs(cloned.height-rect.height)>Math.max(4,rect.height*.05))throw Error('Selected target geometry changed in clone');
   captureOptions.x=cloned.left+captureScroll.x;captureOptions.y=cloned.top+captureScroll.y;
  }};
  const shot=await html2canvas(document.documentElement,captureOptions);
  imageData=shot.toDataURL('image/png');
  if(imageData.length>3700000)throw Error();
  const url=new URL(location.href);url.searchParams.delete('edit-target');
  selection={url:url.href,selector,text:clone.textContent.replace(/\s+/g,' ').trim().slice(0,600),html:clone.outerHTML.slice(0,10000),tag:element.localName,bounds:{width:rect.width,height:rect.height,imageWidth:shot.width,imageHeight:shot.height}};
 }catch{selection=imageData=null;showError(t('Снимката не се получи. Избери по-малък елемент.'))}
 finally{capturing=false;opened=true;render()}
}
async function refresh(){
 return sessionClient.refresh();
}
async function send(event){
 event.preventDefault();const message=shadow.querySelector('#request-message').value.trim();
 if(!selection||!imageData||!message||busy||uploading)return;
 if(!selected?.isConnected){showError(t('Елементът вече не е на страницата. Избери го отново.'));return}
 await capture(selected);if(!selection||!imageData)return;
 const payload={requestId:crypto.randomUUID(),message,selection:structuredClone(selection),screenshot:imageData,attachments:uploads.map(({name,original,preview})=>({name,original,preview}))};
 await transmit(payload);
}
async function transmit(payload){
 if(sending||!auth)return;pendingPayload=payload;sending=true;busy=true;followChat=true;
 jobs=jobs.filter(job=>job.id!==payload.requestId);jobs.push({id:payload.requestId,message:payload.message,status:'sending',createdAt:new Date().toISOString(),events:[{phase:'sending',at:new Date().toISOString()}],selection:payload.selection});render();
 try{
  const result=await api('jobs',{method:'POST',body:JSON.stringify(payload)});
  if(shadow?.querySelector('#request-message')?.value===payload.message){shadow.querySelector('#request-message').value='';draft=''}errorText='';uploads=[];pendingPayload=null;chatConnection='online';jobs=jobs.filter(job=>job.id!==result.id);jobs.push(result);
 }catch(error){const local=jobs.find(job=>job.id===payload.requestId);if(local){local.status=error.status?'error':'connection';local.answer=error.status?error.message:t('Връзката е прекъсната. Заявката може да продължава на сървъра.');local.events=[];if(error.status)local.finishedAt=new Date().toISOString()}if(error.status){pendingPayload=null;busy=false}else chatConnection='offline'}
 finally{sending=false;if(pendingPayload)busy=true;else busy=jobs.some(job=>['queued','running','applying'].includes(job.status));render();clearTimeout(poll);if(busy)schedulePoll()}
}
function schedulePoll(){poll=setTimeout(async()=>{poll=null;try{await refresh()}catch{chatConnection='offline';render()}if(busy&&auth)schedulePoll()},chatConnection==='offline'?3000:1000)}
addEventListener('site-language-change',render);
function receiveSession(state){
 if(auth&&state.connection==='offline'){chatConnection='offline';render();return}
 const wasAdmin=auth,local=pendingPayload&&jobs.find(job=>job.id===pendingPayload.requestId);auth=state.authenticated===true&&state.role==='admin';csrf=state.csrf||'';chatConnection=state.connection||'online';jobs=state.jobs||[];if(local&&!jobs.some(job=>job.id===local.id))jobs.push(local);else if(pendingPayload&&jobs.some(job=>job.id===pendingPayload.requestId))pendingPayload=null;busy=!!state.busy||sending||!!pendingPayload;
 if(!auth){stopPicker();clearTimeout(poll);poll=null;pendingPayload=null;sending=false;host?.remove();host=shadow=null;opened=false;selected=selection=imageData=null;uploads=[];if(wasAdmin){draft='';errorText=''}return}
 initHost();render();if(busy&&!poll)schedulePoll();
}
function updateElapsed(){if(!shadow)return;for(const element of shadow.querySelectorAll('[data-elapsed]')){const seconds=Math.max(0,Math.floor(((element.dataset.finished?Date.parse(element.dataset.finished):Date.now())-Date.parse(element.dataset.elapsed))/1000));element.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')}}
setInterval(updateElapsed,1000);
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
