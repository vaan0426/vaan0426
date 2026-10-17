'use strict';
const http=require('node:http'),fs=require('node:fs/promises'),{createReadStream}=require('node:fs'),{pipeline}=require('node:stream/promises'),path=require('node:path');
const root=__dirname,port=Number(process.env.PORT||4173);
let platform;
const editor=require('./editor/bridge.cjs').createEditor(root,{validateSession:value=>platform?.validateSession(value)===true,cmsContext:()=>platform.cmsContext(),applyCms:(...args)=>platform.applyCms(...args)});
platform=require('./backend/platform.cjs').createPlatform(root,editor);
const types={'.json':'application/json; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.eot':'application/vnd.ms-fontobject'};
const pages=new Set(['news.html','index.html','index.jane.html','booking.html','events.html','packages.html','cart.html','account.html','page.html','login.html','admin/index.html','tessellate-custom.css','tessellate-custom.js']);
http.createServer(async(req,res)=>{
 try{
  if(!['localhost:'+port,'127.0.0.1:'+port].includes(req.headers.host)){res.writeHead(403);res.end();return}
  if(req.headers.host==='127.0.0.1:'+port&&['GET','HEAD'].includes(req.method)&&!req.url.startsWith('/__editor/')&&!req.url.startsWith('/api/')){res.writeHead(308,{Location:'http://localhost:'+port+req.url});res.end();return}
  res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');
  const url=new URL(req.url,'http://localhost:'+port);
  if(await platform.handle(req,res,url))return;
  if(await editor.handle(req,res,url))return;
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
  let name=decodeURIComponent(url.pathname).replace(/^\/+/,'');if(!name||name.endsWith('/'))name+='index.html';
  const full=path.resolve(root,name),allowed=pages.has(name)||name.startsWith('platform/')||name.startsWith('html5up-tessellate/');
  if(!allowed||name.includes('\\')||name.split('/').some(p=>p==='..'||p==='.')||!full.startsWith(root+path.sep)||!types[path.extname(full)]){res.writeHead(404);res.end('Not found');return}
  const actual=await fs.realpath(full);if(actual.toLowerCase()!==full.toLowerCase()||!actual.startsWith(root+path.sep)){res.writeHead(404);res.end();return}
  const stat=await fs.stat(actual),etag='"'+stat.size.toString(16)+'-'+Math.trunc(stat.mtimeMs).toString(16)+'"';
  const headers={'Content-Type':types[path.extname(full)],'Cache-Control':/-optimized\.(?:jpg|png|webp)$/i.test(name)?'public, max-age=604800':'no-cache','ETag':etag,'Last-Modified':stat.mtime.toUTCString(),'X-Content-Type-Options':'nosniff'};
  if(req.headers['if-none-match']===etag){res.writeHead(304,headers);res.end();return}
  headers['Content-Length']=stat.size;res.writeHead(200,headers);if(req.method==='HEAD'){res.end();return}
  await pipeline(createReadStream(actual,{highWaterMark:32768}),res);
 }catch{if(res.headersSent){res.destroy();return}res.writeHead(404);res.end('Not found')}
}).listen(port,'127.0.0.1',()=>console.log('Local site and editor: http://localhost:'+port));
