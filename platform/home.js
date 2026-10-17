import {read} from './core.js';
function refresh(){const p=read().pages.find(p=>p.slug==='home'&&p.published);if(!p)return;document.querySelector('#header h1').textContent=p.title;const paragraphs=document.querySelectorAll('#header header p');paragraphs[paragraphs.length-1].textContent=p.body;}refresh();addEventListener('storage',refresh);
