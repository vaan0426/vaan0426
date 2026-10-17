import {getLanguage} from './i18n.js';
export const money=n=>new Intl.NumberFormat(getLanguage()==='en'?'en-GB':'bg-BG',{style:'currency',currency:'EUR'}).format(n/100);
export const date=s=>new Intl.DateTimeFormat(getLanguage()==='en'?'en-GB':'bg-BG',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Sofia'}).format(new Date(s));
let state;
const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('psychology-platform-data'):null;
export async function request(route,data){const response=await fetch('/api/'+route,{cache:'no-store',credentials:'same-origin',method:data?'POST':'GET',headers:{'Content-Type':'application/json','X-Site-CSRF':state?.csrf||''},body:data?JSON.stringify(data):undefined});let value;try{value=await response.json()}catch{throw Error('Сървърът не е достъпен. Отвори сайта през неговия стартов файл.')}if(!response.ok)throw Error(value.error||'Операцията не завърши.');return value}
export async function refresh(notify=false){const next=await request('state'),changed=JSON.stringify(next)!==JSON.stringify(state);state=next;if(notify&&changed)dispatchEvent(new Event('platform-change'));return state}
export const read=()=>structuredClone(state);
export const currentUser=()=>state.currentUser;
export function announce(){channel?.postMessage('changed');try{localStorage.setItem('psychology-admin-session-changed',Date.now()+':'+Math.random())}catch{}dispatchEvent(new Event('site-auth-change'))}
async function action(name,...args){const value=await request('action',{name,args});state=value.state;channel?.postMessage('changed');dispatchEvent(new Event('platform-change'));return value.result}
export async function login(username,password){await request('auth/login',{username,password});await refresh(true);announce();return state.currentUser}
export async function register(data){await request('auth/register',data);await refresh(true);announce();return state.currentUser}
export async function logout(){await request('auth/logout',{});await refresh(true);announce()}
export const statuses={pending:'Чака одобрение',accepted:'Приета',rejected:'Отхвърлена',moved:'Преместена',cancelled:'Анулирана'};
export const available=s=>s.slots.filter(x=>x.enabled&&!x.occupied&&Date.parse(x.start)>Date.now()&&!s.bookings.some(b=>b.slotId===x.id&&!['rejected','cancelled'].includes(b.status)));
export const book=(...a)=>action('book',...a);
export const publicBookings=()=>state.bookings.filter(x=>x.userId===state.currentUser?.id);
export const changeBooking=(...a)=>action('changeBooking',...a);
export const paymentMethod=(...a)=>action('paymentMethod',...a);
export const addCart=(...a)=>action('addCart',...a);
export const removeCart=(...a)=>action('removeCart',...a);
export const checkout=()=>action('checkout');
export const markPaid=(...a)=>action('markPaid',...a);
export const cancelOrder=(...a)=>action('cancelOrder',...a);
export const updateRecord=(...a)=>action('updateRecord',...a);
export const deleteRecord=(...a)=>action('deleteRecord',...a);
export const updateSettings=data=>action('settings',data);
export const updateProfile=data=>action('profile',data);
export const changePassword=(...a)=>action('password',...a);
export const messageStatus=(...a)=>action('messageStatus',...a);
export const save=s=>updateSettings(s.settings);
export const cartItems=(s=state)=>s.cart.map(row=>{const p=(row.kind==='package'?s.packages:s.events).find(x=>x.id===row.productId);return {...row,title:p?.title||'Недостъпен продукт',price:p?.price||0,active:p?.active,credits:p?.credits}});
export async function upload(image){const value=await request('media',{image});state=value.state;channel?.postMessage('changed');return value.url}
channel?.addEventListener('message',()=>refresh(true).catch(()=>{}));
addEventListener('storage',e=>{if(e.key==='psychology-admin-session-changed')refresh(true).catch(()=>{})});
addEventListener('focus',()=>refresh(true).catch(()=>{}));
setInterval(()=>{if(!document.hidden)refresh(true).catch(()=>{})},20000);
await refresh();
