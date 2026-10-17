'use strict';
const fail=message=>Object.assign(new Error(message),{status:400});
function decode(data,max,preview=false){
 if(typeof data!=='string'||data.length>max*1.38+100)throw fail('Снимката е прекалено голяма.');
 const match=data.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);if(!match)throw fail('Използвай PNG, JPG или WebP снимка.');
 const bytes=Buffer.from(match[2],'base64'),kind=match[1];
 if(!bytes.length||bytes.length>max)throw fail('Снимката е прекалено голяма.');
 let width=0,height=0;
 if(kind==='png'){
  if(bytes.length<24||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw fail('Невалидна PNG снимка.');
  width=bytes.readUInt32BE(16);height=bytes.readUInt32BE(20);
 }else if(kind==='jpeg'){
  if(bytes[0]!==255||bytes[1]!==216)throw fail('Невалидна JPG снимка.');
  let offset=2;
  while(offset+9<bytes.length){
   if(bytes[offset++]!==255)break;let marker=bytes[offset++];while(marker===255)marker=bytes[offset++];
   if(marker===217||marker===218)break;if(marker>=208&&marker<=215)continue;
   const size=bytes.readUInt16BE(offset);if(size<2||offset+size>bytes.length)break;
   if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){height=bytes.readUInt16BE(offset+3);width=bytes.readUInt16BE(offset+5);break}offset+=size;
  }
  if(!width||!height)throw fail('Невалидни размери на JPG снимката.');
 }else if(bytes.length<16||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw fail('Невалидна WebP снимка.');
 if(preview&&(kind==='webp'||!width||!height||width>1600||height>1600))throw fail('Невалиден кадър за преглед.');
 return {bytes,kind,ext:kind==='jpeg'?'jpg':kind,width,height,mime:'image/'+kind};
}
function decodeUploads(value,id){
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>3)throw fail('Можеш да прикачиш до 3 снимки.');
 let total=0;
 return value.map((item,index)=>{
  if(!item||typeof item.name!=='string')throw fail('Невалидно приложение.');
  const original=decode(item.original,4*1024*1024),preview=decode(item.preview,1500000,true);
  total+=original.bytes.length;if(total>6*1024*1024)throw fail('Общият размер на снимките е до 6 MB.');
  return {name:item.name.replace(/[/\\\x00-\x1f]/g,'_').slice(0,120),original,preview,assetPath:'platform/images/editor-upload-'+id+'-'+index+'.'+original.ext};
 });
}
module.exports={decodeUploads};
