import {loadNews,image,meta,href} from './news-shared.js';
import {esc} from './ui.js';
const root=document.querySelector('#latest-news');
try{const [a]=await loadNews();if(a)root.innerHTML='<article class="news-feature"><a class="news-feature-image" href="'+href(a)+'" tabindex="-1" aria-hidden="true">'+image(a)+'</a><div class="news-feature-copy"><span class="news-kicker">ПОСЛЕДНА ПУБЛИКАЦИЯ</span>'+meta(a)+'<h3><a href="'+href(a)+'">'+esc(a.title)+'</a></h3><p>'+esc(a.summary)+'</p><div class="news-actions"><a class="button" href="'+href(a)+'">Прочети ↗</a><a class="news-read" href="news.html">Всички новини и архив →</a></div></div></article>';}
catch{root.innerHTML='<p>Публикациите временно не са достъпни. <a href="news.html">Опитай от страницата „Новини“.</a></p>';}
