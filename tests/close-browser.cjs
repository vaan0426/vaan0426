module.exports=async function closeTestBrowser(port){
 if(!port)return;
 const info=await(await fetch('http://127.0.0.1:'+port+'/json/version',{signal:AbortSignal.timeout(1500)})).json();
 await new Promise(resolve=>{
  const socket=new WebSocket(info.webSocketDebuggerUrl);let timer;
  const done=()=>{clearTimeout(timer);try{socket.close()}catch{}resolve()};
  timer=setTimeout(done,2000);socket.addEventListener('open',()=>socket.send(JSON.stringify({id:1,method:'Browser.close'})),{once:true});
  socket.addEventListener('message',done,{once:true});socket.addEventListener('close',done,{once:true});socket.addEventListener('error',done,{once:true});
 });
};
