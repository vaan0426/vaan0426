const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const prefix=fs.readFileSync(path.join(__dirname,'browser-audit.cjs'),'utf8').split('const routes=')[0];
const body=String.raw`
await go('admin/index.html?lang=bg#superdoc');
const original=await evaluate('(async()=>(JSON.stringify((await import("/platform/core.js")).read().bookings)))()');
assert.equal(await evaluate('document.querySelector("#superdoc-connect").disabled'),true);
assert.equal(await evaluate('!!document.querySelector("input[type=password]")'),false);
await evaluate('document.querySelector("[name=calendarId]").value="calendar-123";document.querySelector("#superdoc-form").requestSubmit()');
assert.equal(await evaluate('(async()=>((await import("/platform/core.js")).read().settings.superdocDraft.calendarId))()'),'calendar-123');
await go('admin/index.html?lang=bg#superdoc');
assert.equal(await evaluate('document.querySelector("[name=calendarId]").value'),'calendar-123');
await evaluate('document.querySelector("[name=profileUrl]").value="https://superpdp.tech/lekar/test";document.querySelector("#superdoc-form").requestSubmit()');
assert.equal(await evaluate('(async()=>((await import("/platform/core.js")).read().settings.superdocDraft.profileUrl))()'),'https://superdoc.bg/lekar/cvetomila-simeonova');
assert.ok(await evaluate('document.querySelector(".toast.error").textContent.includes("superdoc.bg")'));
await evaluate('document.querySelector("[name=profileUrl]").value="https://superdoc.bg/lekar/cvetomila-simeonova?token=secret";document.querySelector("#superdoc-form").requestSubmit()');
assert.ok(await evaluate('document.querySelector(".toast.error")!==null'));
await evaluate('document.querySelector("[name=profileUrl]").value="https://superdoc.bg/lekar/cvetomila-simeonova";document.querySelector("[name=calendarId]").value="Bearer secret!";document.querySelector("#superdoc-form").requestSubmit()');
assert.equal(await evaluate('(async()=>((await import("/platform/core.js")).read().settings.superdocDraft.calendarId))()'),'calendar-123');
await evaluate('document.querySelector("[name=calendarId]").value="calendar-456";document.querySelector("[data-language=en]").click()');
assert.equal(await evaluate('document.querySelector("[name=calendarId]").value'),'calendar-456');
await evaluate('document.querySelector("#superdoc-form").requestSubmit()');
assert.ok(await evaluate('document.querySelector(".toast").textContent.includes("remains inactive")'));
for(const language of ['bg','en']){
 for(const width of [1440,390,320]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  await go('admin/index.html?lang='+language+'#superdoc');
  assert.ok((await dimensions()).width<=width,'Integration fits '+language+' '+width);
  if(language==='en'){
   const leftovers=await evaluate('(()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),out=[];let n;while(n=w.nextNode())if(!n.parentElement.closest("script,style,textarea,[data-no-translate]")&&/[А-Яа-я]/.test(n.nodeValue))out.push(n.nodeValue.trim());return out})()');
   assert.deepEqual(leftovers,[],'All integration text translated');
  }
  await shot('superdoc-'+language+'-'+width);
 }
}
const downloads=path.join(temp,'downloads');fs.mkdirSync(downloads);
await cdp('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
await evaluate('document.querySelector("#superdoc-request").click()');
const downloaded=path.join(downloads,'superdoc-api-request-en.txt');
for(let i=0;i<50&&!fs.existsSync(downloaded);i++)await delay(100);
assert.ok(fs.existsSync(downloaded),'API request downloads');
const request=fs.readFileSync(downloaded,'utf8');
assert.ok(request.includes('calendar-456')&&request.includes('atomic reservation/locking'));
assert.ok(!request.includes('Bearer secret'));
await evaluate('document.querySelector("#superdoc-clear").click()');
assert.equal(await evaluate('(async()=>((await import("/platform/core.js")).read().settings.superdocDraft))()'),undefined);
assert.equal(await evaluate('(async()=>(JSON.stringify((await import("/platform/core.js")).read().bookings)))()'),original);
await evaluate('document.querySelector("#demo-role").value="editor";document.querySelector("#demo-role").dispatchEvent(new Event("change"))');
assert.equal(await evaluate('!!document.querySelector("#superdoc-form")'),false);
assert.equal(await evaluate('!!document.querySelector(".sidebar a[href=\\"#superdoc\\"]")'),false);
assert.equal(report.errors.length,0);
console.log(JSON.stringify({passed:true,viewports:6,validation:true,draftPersistence:true,bookingsUnchanged:true,englishDownload:true,roleRestriction:true,errors:report.errors,screenshots:report.screenshots},null,2));
}catch(e){console.error(e.stack);process.exitCode=1}finally{try{await require(path.join(process.cwd(),'tests/close-browser.cjs'))(globalThis.testBrowserPort)}catch{}if(ws)ws.close();chrome.kill()}})();
`;
const file=path.join(os.tmpdir(),'psychology-superdoc-'+process.pid+'.cjs');
fs.writeFileSync(file,prefix+body,'utf8');
const result=spawnSync(process.execPath,[file],{stdio:'inherit',cwd:path.join(__dirname,'..'),windowsHide:true});
process.exitCode=result.status??1;
