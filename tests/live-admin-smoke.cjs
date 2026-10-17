'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const prefix=fs.readFileSync(path.join(__dirname,'browser-audit.cjs'),'utf8').split('const routes=')[0];
const body=String.raw`
async function until(expression,label){for(let i=0;i<200;i++){if(await evaluate(expression))return;await delay(100)}throw Error(label)}
await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await go('admin/index.html?lang=bg');assert.ok(await evaluate('!!document.querySelector("#admin-login")'));
await evaluate('(()=>{const f=document.querySelector("#admin-login");f.elements.username.value="admin";f.elements.password.value='+JSON.stringify(process.env.SITE_REAL_ADMIN_PASS)+';f.requestSubmit();return true})()');
await until('!!document.querySelector(".sidebar")','Actual administrator password accepted');
await until('!!document.querySelector("#site-editor-widget")','Actual editor visible');
const state=await evaluate('(async()=>await(await fetch("/api/state")).json())()');assert.equal(state.admin,true);assert.equal(state.bookings.length,0);assert.equal(state.orders.length,0);
await shot('working-admin-dashboard');await go('?lang=bg');
const widget='document.querySelector("#site-editor-widget").shadowRoot';await until('!!document.querySelector("#site-editor-widget")','Homepage editor');
await evaluate(widget+'.querySelector("#selector-launcher").click()');await evaluate('document.querySelector("#header h1").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));true');
await until('!!'+widget+'.querySelector("#selection-card img")','Actual component capture');
if(process.env.EDITOR_REAL_PROBE==='1'){
 await evaluate(widget+'.querySelector("#request-message").value="Проверка след реален паролен вход: потвърди, че виждаш избрания компонент и CMS контекста на началната страница. Не променяй нищо; върни edits: [] и cmsEdits: []. Отговори с едно изречение на български.";'+widget+'.querySelector("#editor-request").requestSubmit();true');
 let final;for(let i=0;i<480;i++){const value=await evaluate('(async()=>await(await fetch("/__editor/status")).json())()');final=value.jobs.at(-1);if(final&&!value.busy)break;if(i%20===0)console.log('Real editor connection running');await delay(1000)}
 assert.equal(final.status,'answered',final.answer);assert.deepEqual(final.changed,[]);console.log(JSON.stringify({realCodex:true,status:final.status,answer:final.answer,changed:final.changed}));await delay(1200);
}
await shot('working-admin-editor');await go('admin/index.html?lang=bg');await evaluate('document.querySelector("#admin-logout").click();true');await until('!!document.querySelector("#admin-login")','Actual logout');
assert.equal(report.errors.length,0);console.log(JSON.stringify({passed:true,actualPasswordLogin:true,editorUnlocked:true,noTestCustomers:true,logout:true,errors:report.errors,screenshots:report.screenshots,temp},null,2));
}catch(e){console.error(e.stack);console.log(JSON.stringify({errors:report.errors,temp},null,2));process.exitCode=1}finally{try{await require(path.join(process.cwd(),'tests/close-browser.cjs'))(globalThis.testBrowserPort)}catch{}if(ws)ws.close();chrome.kill()}})();
`;
if(!process.env.SITE_REAL_ADMIN_PASS)throw Error('Set SITE_REAL_ADMIN_PASS for the actual owner smoke test.');
const file=path.join(os.tmpdir(),'psychology-real-admin-'+process.pid+'.cjs');fs.writeFileSync(file,prefix+body);const result=spawnSync(process.execPath,[file],{cwd:process.cwd(),stdio:'inherit',windowsHide:true});process.exitCode=result.status??1;
