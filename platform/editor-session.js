export function createAdminSession(changed){
 let state={authenticated:false,role:null,csrf:'',busy:false,jobs:[]},stamp='',timer;
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('psychology-admin-session'):null;
 async function request(route,options={}){const response=await fetch('/__editor/'+route,{cache:'no-store',credentials:'same-origin',...options,headers:{'Content-Type':'application/json','X-Editor-CSRF':state.csrf||'',...options.headers}});let data;try{data=await response.json()}catch{throw Error('Няма връзка с редактора.')}if(!response.ok){if(response.status===401)queueRefresh();throw Object.assign(new Error(data.error||'Операцията не завърши.'),{status:response.status})}return data}
 function announce(){channel?.postMessage({type:'session-changed'});try{localStorage.setItem('psychology-admin-session-changed',Date.now()+':'+Math.random())}catch{}dispatchEvent(new Event('site-auth-change'))}
 async function refresh(){const value=await request('status');if(!(value.authenticated===true&&value.role==='admin')){value.authenticated=false;value.role=null;value.csrf='';value.jobs=[];value.busy=false}state=value;const next=JSON.stringify(value);if(stamp!==next){stamp=next;changed(state)}return state}
 async function login(key){await request('login',{method:'POST',body:JSON.stringify({key})});await refresh();announce()}
 async function logout(){await request('logout',{method:'POST',body:'{}'});await refresh();announce()}
 function queueRefresh(){clearTimeout(timer);timer=setTimeout(()=>refresh().catch(()=>{state={authenticated:false,role:null,csrf:'',busy:false,jobs:[]};stamp='';changed(state)}),60)}
 channel?.addEventListener('message',queueRefresh);addEventListener('site-auth-change',queueRefresh);
 addEventListener('storage',e=>{if(e.key==='psychology-admin-session-changed')queueRefresh()});
 addEventListener('focus',queueRefresh);addEventListener('pageshow',queueRefresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueRefresh()});
 setInterval(()=>{if(!document.hidden)queueRefresh()},12000);
 async function boot(){const fragment=location.hash.match(/^#editor-login=([a-f0-9]{64})$/);if(fragment){history.replaceState(null,'',location.pathname+location.search);await login(fragment[1])}else await refresh()}
 return {request,refresh,login,logout,announce,boot};
}
