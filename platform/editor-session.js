import {getLanguage} from './i18n.js';
const copy={
 'Администраторски вход':'Administrator sign-in','Администраторският режим е включен.':'Administrator mode is enabled.',
 'Селекторът и чатът са достъпни на всички страници в този браузър.':'The selector and chat are available on every page in this browser.',
 'Към сайта':'Open website','Изход от администраторския профил':'Sign out of administrator mode',
 'Код за администратора':'Administrator access code','Влез като администратор':'Sign in as administrator',
 'За автоматичен вход отвори „Редактор на сайта.vbs“ от папката на проекта.':'For automatic sign-in, open “Редактор на сайта.vbs” in the project folder.',
 'Демо изборът на роля не отключва редактора.':'The demo role selector does not unlock the editor.',
 'Неуспешна връзка с локалния редактор.':'Could not connect to the local editor.'
};
const t=s=>getLanguage()==='en'?(copy[s]||s):s;
export function createAdminSession(changed){
 let state={authenticated:false,role:null,csrf:'',busy:false,jobs:[]},stamp='',access,accessStamp='',timer;
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('psychology-admin-session'):null;
 async function request(route,options={}){
  const response=await fetch('/__editor/'+route,{cache:'no-store',credentials:'same-origin',...options,headers:{'Content-Type':'application/json','X-Editor-CSRF':state.csrf||'',...options.headers}});
  let data;try{data=await response.json()}catch{throw Error(t('Неуспешна връзка с локалния редактор.'))}
  if(!response.ok){if(response.status===401)queueRefresh();throw Object.assign(new Error(data.error||t('Неуспешна връзка с локалния редактор.')),{status:response.status})}
  return data;
 }
 function announce(){channel?.postMessage({type:'session-changed'});try{localStorage.setItem('psychology-admin-session-changed',Date.now()+':'+Math.random())}catch{}}
 async function refresh(){
  const value=await request('status');
  if(!(value.authenticated===true&&value.role==='admin')){value.authenticated=false;value.role=null;value.csrf='';value.jobs=[];value.busy=false}
  state=value;const next=JSON.stringify(value);if(stamp!==next){stamp=next;changed(state)}mountAccess();return state;
 }
 async function login(key){await request('login',{method:'POST',body:JSON.stringify({key})});await refresh();announce()}
 async function logout(){await request('logout',{method:'POST',body:'{}'});await refresh();announce()}
 function queueRefresh(){clearTimeout(timer);timer=setTimeout(()=>refresh().catch(()=>{state={authenticated:false,role:null,csrf:'',busy:false,jobs:[]};stamp='';changed(state);mountAccess()}),60)}
 function mountAccess(){
  if(!location.pathname.startsWith('/admin/'))return;
  const main=document.querySelector('.admin-main');if(!main)return;
  if(!access?.isConnected){access=document.createElement('section');access.id='site-editor-admin-access';access.dataset.noTranslate='';access.attachShadow({mode:'open'});main.prepend(access);accessStamp=''}
  const next=state.authenticated+':'+getLanguage();if(next===accessStamp)return;accessStamp=next;
  const oldKey=access.shadowRoot.querySelector('#admin-access-key')?.value||'';
  access.shadowRoot.innerHTML='<style>:host{display:block;margin-bottom:24px;font:14px/1.5 "Segoe UI",Arial,sans-serif;color:#28483f}.card{padding:20px;border:1px solid #c9d8c5;border-radius:14px;background:linear-gradient(135deg,#fffdf8,#edf3e8)}h2{font-size:22px;margin:0 0 10px}p{margin:10px 0}label{display:block}input{box-sizing:border-box;display:block;width:100%;max-width:460px;padding:10px;border:1px solid #b6cab3;border-radius:8px;margin:7px 0 12px;font:inherit}button,a{display:inline-block;padding:10px 15px;border:0;border-radius:8px;background:#315748;color:#fff;font:inherit;text-decoration:none;cursor:pointer;margin:5px 8px 0 0}small{display:block;color:#627464}#access-error{color:#924438}</style><div class="card"><h2>'+t(state.authenticated?'Администраторският режим е включен.':'Администраторски вход')+'</h2>'+
  (state.authenticated?'<p>'+t('Селекторът и чатът са достъпни на всички страници в този браузър.')+'</p><a href="/?lang='+getLanguage()+'">'+t('Към сайта')+'</a><button id="admin-access-logout">'+t('Изход от администраторския профил')+'</button>':
  '<form id="admin-editor-login"><p>'+t('За автоматичен вход отвори „Редактор на сайта.vbs“ от папката на проекта.')+'</p><label for="admin-access-key">'+t('Код за администратора')+'</label><input id="admin-access-key" type="password" autocomplete="off" required><button>'+t('Влез като администратор')+'</button><small>'+t('Демо изборът на роля не отключва редактора.')+'</small></form>')+'<p id="access-error" role="alert"></p></div>';
  const input=access.shadowRoot.querySelector('#admin-access-key');if(input)input.value=oldKey;
  access.shadowRoot.querySelector('#admin-editor-login')?.addEventListener('submit',async event=>{event.preventDefault();try{await login(input.value.trim())}catch(error){access.shadowRoot.querySelector('#access-error').textContent=error.message}});
  access.shadowRoot.querySelector('#admin-access-logout')?.addEventListener('click',async()=>{try{await logout()}catch(error){access.shadowRoot.querySelector('#access-error').textContent=error.message}});
 }
 channel?.addEventListener('message',queueRefresh);
 addEventListener('storage',event=>{if(event.key==='psychology-admin-session-changed')queueRefresh()});
 addEventListener('focus',queueRefresh);addEventListener('pageshow',queueRefresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueRefresh()});
 addEventListener('site-language-change',mountAccess);
 if(location.pathname.startsWith('/admin/'))new MutationObserver(mountAccess).observe(document.body,{childList:true,subtree:true});
 setInterval(()=>{if(!document.hidden)queueRefresh()},12000);
 async function boot(){
  const fragment=location.hash.match(/^#editor-login=([a-f0-9]{64})$/);
  if(fragment){history.replaceState(null,'',location.pathname+location.search);await login(fragment[1])}else await refresh();
 }
 return {request,refresh,login,logout,announce,boot};
}
