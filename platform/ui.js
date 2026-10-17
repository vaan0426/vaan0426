import {navigationItems} from './navigation.js';
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function toast(message,error=false){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast'+(error?' error':'');el.setAttribute('role',error?'alert':'status');el.textContent=message;document.body.append(el);setTimeout(()=>el.remove(),6500)}
let actionBusy=false;
export async function act(fn,after){if(actionBusy)return;actionBusy=true;const button=document.activeElement?.closest('button');if(button)button.disabled=true;try{await fn();await after?.()}catch(e){toast(e.message,true)}finally{actionBusy=false;if(button?.isConnected)button.disabled=false}}
export const banner='';
export function field(label,name,value='',type='text',extra=''){return '<label>'+esc(label)+'<input name="'+esc(name)+'" type="'+type+'" value="'+esc(value)+'" '+extra+'></label>'}
export function nav(current){return '<nav class="nav water-nav" aria-label="Основна навигация"><a class="brand brand-with-emblem" href="/"><img class="site-emblem" src="/platform/images/ts-tree-logo.png" alt="Емблема TS — дърво и семейство" width="78" height="84"><span class="brand-name">Психолог<br><span class="brand-person">Цвети Симеонова</span></span></a>'+navigationItems(current)+'</nav>'}
