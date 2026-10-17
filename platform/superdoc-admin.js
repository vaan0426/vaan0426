import * as model from './core.js';
import {esc,field,act,toast} from './ui.js';
import {addTranslations,apply,getLanguage} from './i18n.js';

const copy={
'Супердок':'Superdoc',
'Интеграция със Супердок':'Superdoc integration',
'Настройка на връзката':'Connection setup',
'Не е свързано · часовете не се синхронизират':'Not connected · appointments are not synchronised',
'Подготви профила за свързване. Автоматичното обновяване на часовете изисква активен сървър и официален API достъп от Супердок.':'Prepare the profile for connection. Automatic appointment updates require a running backend and official API access from Superdoc.',
'Профил в Супердок':'Superdoc profile',
'Идентификатор на календар (ако е предоставен)':'Calendar identifier (if provided)',
'Използвай само идентификатора, предоставен от Супердок. Това поле не е за API ключ или парола.':'Use only the identifier provided by Superdoc. This field is not for an API key or password.',
'Запази подготовката':'Save setup draft',
'Свържи със Супердок':'Connect to Superdoc',
'Свързването ще бъде достъпно след настройка на защитен сървър и официалния API.':'Connection will be available after a secure backend and the official API have been configured.',
'Записват се само адресът на профила и идентификаторът на календара в този браузър. Това не активира връзка и не променя часовете.':'Only the profile URL and calendar identifier are saved in this browser. This does not activate a connection or change appointments.',
'Отвори профила в Супердок':'Open the Superdoc profile',
'Изчисти подготовката':'Clear setup draft',
'Какво остава за свързването':'What is needed to connect',
'Официален API достъп':'Official API access',
'Очаква документация и достъп от Супердок.':'Awaiting documentation and access from Superdoc.',
'Защитен сървър и общ календар':'Secure backend and shared calendar',
'Не е стартиран. Текущият панел е локална демонстрация.':'Not running. The current panel is a local demo.',
'Автоматично обновяване':'Automatic updates',
'Не е активирано. Няма последна синхронизация.':'Not enabled. No synchronisation has taken place.',
'Нужна е двупосочна връзка: записване, преместване и отказване и от двете места. Само периодичен импорт не гарантира защита от едновременни резервации.':'A two-way connection is needed for bookings, rescheduling and cancellations from both systems. Periodic imports alone do not guarantee protection against simultaneous bookings.',
'Получаване на достъп':'Getting access',
'Изпратеният адрес superpdp.tech е за електронни фактури. За календарите използваме официалната интеграция на superdoc.bg.':'The supplied superpdp.tech URL is for electronic invoicing. Calendars require the official superdoc.bg integration.',
'Свали заявка за API достъп':'Download an API access request',
'Контакт със Супердок':'Contact Superdoc',
'Условия за интеграция':'Integration options',
'Заявката се сваля като текстов файл. Нищо не се изпраща автоматично.':'The request is downloaded as a text file. Nothing is sent automatically.',
'Подготовката е запазена. Синхронизацията остава неактивна.':'Setup draft saved. Synchronisation remains inactive.',
'Подготовката е изчистена. Резервациите са запазени.':'Setup draft cleared. Bookings are unchanged.',
'Въведи адрес на профил: https://superdoc.bg/lekar/име-на-профила, без параметри.':'Enter a profile URL: https://superdoc.bg/lekar/profile-name, without query parameters.',
'Идентификаторът може да съдържа до 80 латински букви, цифри, тире и долна черта. Не въвеждай ключ.':'The identifier may contain up to 80 Latin letters, digits, hyphens and underscores. Do not enter a key.',
'Тази настройка е достъпна само за администратор.':'This setting is available only to an administrator.'
};
addTranslations(Object.entries(copy));
const defaultProfile='https://superdoc.bg/lekar/cvetomila-simeonova';
function validate(profileUrl,calendarId){
 let url;try{url=new URL(profileUrl)}catch{}
 if(!url||url.protocol!=='https:'||url.hostname!=='superdoc.bg'||url.port||url.username||url.password||url.search||url.hash||!/^\/lekar\/[a-z0-9-]+\/?$/.test(url.pathname))throw Error('Въведи адрес на профил: https://superdoc.bg/lekar/име-на-профила, без параметри.');
 if(!/^[A-Za-z0-9_-]{0,80}$/.test(calendarId))throw Error('Идентификаторът може да съдържа до 80 латински букви, цифри, тире и долна черта. Не въвеждай ключ.');
 return {profileUrl:url.origin+url.pathname.replace(/\/$/,''),calendarId};
}
function draft(s){try{return validate(s.settings.superdocDraft?.profileUrl||defaultProfile,s.settings.superdocDraft?.calendarId||'')}catch{return {profileUrl:defaultProfile,calendarId:''}}}
export function superdocView(s,role){
 if(role!=='admin')return '<p class="notice">Тази настройка е достъпна само за администратор.</p>';
 const value=draft(s);
 return '<section class="card" aria-labelledby="superdoc-heading"><h2 id="superdoc-heading">Интеграция със Супердок</h2><p><span class="badge pending" id="superdoc-status">Не е свързано · часовете не се синхронизират</span></p><p>Подготви профила за свързване. Автоматичното обновяване на часовете изисква активен сървър и официален API достъп от Супердок.</p><h3>Настройка на връзката</h3><form id="superdoc-form">'+field('Профил в Супердок','profileUrl',value.profileUrl,'url','required maxlength="200" autocomplete="off"')+field('Идентификатор на календар (ако е предоставен)','calendarId',value.calendarId,'text','maxlength="80" autocomplete="off" aria-describedby="calendar-help"')+'<p class="muted" id="calendar-help">Използвай само идентификатора, предоставен от Супердок. Това поле не е за API ключ или парола.</p><div class="actions"><button type="submit">Запази подготовката</button><button type="button" id="superdoc-connect" disabled aria-describedby="superdoc-blocker">Свържи със Супердок</button></div><p class="notice" id="superdoc-blocker">Свързването ще бъде достъпно след настройка на защитен сървър и официалния API.</p><p class="muted">Записват се само адресът на профила и идентификаторът на календара в този браузър. Това не активира връзка и не променя часовете.</p></form><div class="actions"><a class="btn secondary" href="'+esc(value.profileUrl)+'" target="_blank" rel="noopener noreferrer">Отвори профила в Супердок</a><button class="secondary" id="superdoc-clear">Изчисти подготовката</button></div></section><section class="card"><h2>Какво остава за свързването</h2><h3>Официален API достъп</h3><p>Очаква документация и достъп от Супердок.</p><h3>Защитен сървър и общ календар</h3><p>Не е стартиран. Текущият панел е локална демонстрация.</p><h3>Автоматично обновяване</h3><p>Не е активирано. Няма последна синхронизация.</p><p class="notice">Нужна е двупосочна връзка: записване, преместване и отказване и от двете места. Само периодичен импорт не гарантира защита от едновременни резервации.</p></section><section class="card"><h2>Получаване на достъп</h2><p>Изпратеният адрес superpdp.tech е за електронни фактури. За календарите използваме официалната интеграция на superdoc.bg.</p><div class="actions"><button id="superdoc-request">Свали заявка за API достъп</button><a href="https://superdoc.bg/kontakti" target="_blank" rel="noopener noreferrer">Контакт със Супердок</a><a href="https://superdoc.bg/stanete-superdoktor" target="_blank" rel="noopener noreferrer">Условия за интеграция</a></div><p class="muted">Заявката се сваля като текстов файл. Нищо не се изпраща автоматично.</p></section>';
}
export function bindSuperdoc(role,render){
 if(role!=='admin')return;
 const form=document.querySelector('#superdoc-form');if(!form)return;
 const values=()=>validate(form.elements.profileUrl.value.trim(),form.elements.calendarId.value.trim());
 form.addEventListener('submit',event=>{event.preventDefault();act(()=>{
  const value=values(),s=model.read();s.settings.superdocDraft=value;model.save(s);
 },()=>{render();toast('Подготовката е запазена. Синхронизацията остава неактивна.');apply()})});
 document.querySelector('#superdoc-clear').addEventListener('click',()=>act(()=>{
  const s=model.read();delete s.settings.superdocDraft;model.save(s);
 },()=>{render();toast('Подготовката е изчистена. Резервациите са запазени.');apply()}));
 document.querySelector('#superdoc-request').addEventListener('click',()=>act(()=>{
  const value=values(),bg=getLanguage()==='bg';
  const text=bg?
'Заявка: двупосочна календарна интеграция със сайта на психолог Цветомила Симеонова\n\nПрофил: '+value.profileUrl+'\nКалендар: '+(value.calendarId||'да се уточни от Супердок')+'\n\nМоля, предоставете официална документация, условия и тестов достъп за интеграция на календар с външен софтуер. Нужни са:\n- получаване на заетите интервали и промените по резервациите;\n- записване, преместване и отказване от сайта в Супердок;\n- механизъм срещу едновременно записване от двете системи (атомарно резервиране/заключване);\n- идентификатори на специалист, практика, календар, резервация и събитие;\n- удостоверяване, права, тестова среда и ограничения на заявките;\n- известия при промени (webhooks), подписване, повторна доставка и подредба;\n- пълен и инкрементален прочит, странициране, изтривания и часови зони;\n- изисквания за публичен HTTPS адрес и обработване на лични данни.\n\nНе изпращайте парола за потребителския профил. Достъпът ще се конфигурира на защитен сървър.\n':
'Request: two-way calendar integration for psychologist Tsvetomila Simeonova\n\nProfile: '+value.profileUrl+'\nCalendar: '+(value.calendarId||'to be confirmed by Superdoc')+'\n\nPlease provide official documentation, commercial terms and sandbox access for external calendar integration. Required capabilities:\n- read busy intervals and booking changes;\n- create, reschedule and cancel appointments from the website;\n- prevent simultaneous bookings across both systems (atomic reservation/locking);\n- practitioner, practice, calendar, booking and event identifiers;\n- authentication, scopes, sandbox and rate limits;\n- change notifications (webhooks), signatures, retries and ordering;\n- full/incremental reads, pagination, deletions and time zones;\n- public HTTPS endpoint and personal data handling requirements.\n\nDo not send the account password. Credentials will be configured on a secure backend.\n';
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');
  link.href=url;link.download='superdoc-api-request-'+(bg?'bg':'en')+'.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }));
}
