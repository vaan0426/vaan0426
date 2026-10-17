import './site-editor.js';
import {addTranslations} from './i18n.js';
addTranslations(Object.entries({
 'Меню':'Menu',
 'Отвори или затвори менюто':'Open or close navigation',
 'Подменю За мен':'About me submenu',
 'Подменю Пакети':'Packages submenu'
}));
const chevron='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const burger='<svg viewBox="0 0 22 18" width="22" height="18" aria-hidden="true" fill="none"><path d="M2 3h18M2 9h18M2 15h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
export function navigationItems(current='',home=false){
 const root=home?'':'/';
 const link=(href,label,key)=>'<a class="water-nav-link'+(current===key?' active':'')+'" href="'+href+'"'+(current===key?' aria-current="page"':'')+'>'+label+'</a>';
 const group=(key,label,href,childHref,childLabel,childKey)=>'<li class="nav-group'+(current===key||current===childKey?' has-current':'')+'" data-nav-group>'+link(href,label,key)+'<button type="button" class="nav-disclosure" aria-expanded="false" aria-controls="nav-'+key+'" aria-label="Подменю '+label+'">'+chevron+'</button><ul class="nav-submenu" id="nav-'+key+'" hidden><li>'+link(childHref,childLabel,childKey)+'</li></ul></li>';
 return '<button class="nav-menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Отвори или затвори менюто">'+burger+'<span>Меню</span></button><ul class="water-nav-list" id="site-menu"><li>'+link(root+'#second','Услуги','services')+'</li>'+group('about','За мен',root+'#third',root+'#fourth','Контакт','contact')+'<li>'+link('/booking.html','Запази час','booking')+'</li><li>'+link('/news.html','Новини','news')+'</li>'+group('packages','Пакети','/packages.html','/events.html','Събития','events')+'<li>'+link('/account.html','Моят профил','account')+'</li></ul>';
}
function setGroup(group,open){
 group.querySelector('.nav-disclosure').setAttribute('aria-expanded',String(open));
 group.querySelector('.nav-submenu').hidden=!open;
}
function closeGroups(nav,except){nav.querySelectorAll('[data-nav-group]').forEach(group=>{if(group!==except)setGroup(group,false)})}
function closeNav(nav){closeGroups(nav);nav.classList.remove('is-menu-open');nav.querySelector('.nav-menu-toggle')?.setAttribute('aria-expanded','false')}
document.addEventListener('click',event=>{
 const nav=event.target.closest('.water-nav');
 document.querySelectorAll('.water-nav').forEach(other=>{if(other!==nav)closeNav(other)});
 if(!nav)return;
 const toggle=event.target.closest('.nav-menu-toggle');
 if(toggle){const open=!nav.classList.contains('is-menu-open');closeGroups(nav);nav.classList.toggle('is-menu-open',open);toggle.setAttribute('aria-expanded',String(open));return}
 const disclosure=event.target.closest('.nav-disclosure');
 if(disclosure){const group=disclosure.closest('[data-nav-group]'),open=disclosure.getAttribute('aria-expanded')!=='true';closeGroups(nav,group);setGroup(group,open);return}
 if(event.target.closest('.water-nav-list a'))closeNav(nav);
});
document.addEventListener('keydown',event=>{
 const nav=event.target.closest('.water-nav');if(!nav)return;
 if(event.key==='Escape'){
  const open=nav.querySelector('.nav-disclosure[aria-expanded=true]');
  if(open){setGroup(open.closest('[data-nav-group]'),false);open.focus()}
  else if(nav.classList.contains('is-menu-open')){closeNav(nav);nav.querySelector('.nav-menu-toggle').focus()}
  else return;
  event.preventDefault();
 }
 if(event.key==='ArrowDown'&&event.target.matches('.nav-disclosure')){
  const group=event.target.closest('[data-nav-group]');closeGroups(nav,group);setGroup(group,true);group.querySelector('.nav-submenu a').focus();event.preventDefault();
 }
});
document.addEventListener('focusout',event=>{
 const nav=event.target.closest('.water-nav');if(!nav)return;
 const group=event.target.closest('[data-nav-group]');
 if(group&&!group.contains(event.relatedTarget))setGroup(group,false);
 if(event.relatedTarget&&!nav.contains(event.relatedTarget))closeNav(nav);
});
document.addEventListener('pointerdown',event=>{
 const target=event.target.closest('.water-nav-link,.nav-disclosure,.nav-menu-toggle');
 if(!target||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const box=target.getBoundingClientRect(),ripple=document.createElement('span');
 ripple.className='water-ripple';ripple.setAttribute('aria-hidden','true');
 ripple.style.left=(event.clientX-box.left)+'px';ripple.style.top=(event.clientY-box.top)+'px';
 target.append(ripple);setTimeout(()=>ripple.remove(),800);
});
matchMedia('(max-width: 1180px)').addEventListener('change',()=>document.querySelectorAll('.water-nav').forEach(closeNav));
