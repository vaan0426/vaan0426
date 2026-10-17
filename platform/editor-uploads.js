export async function readImages(files,existing=[]){
 const values=[...files];if(values.length+existing.length>3)throw Error('Можеш да прикачиш до 3 снимки.');
 if(values.some(file=>!['image/png','image/jpeg','image/webp'].includes(file.type)))throw Error('Използвай PNG, JPG или WebP снимка.');
 if(values.some(file=>file.size>4*1024*1024))throw Error('Всяка снимка трябва да е до 4 MB.');
 if(values.reduce((n,file)=>n+file.size,0)+existing.reduce((n,file)=>n+file.size,0)>6*1024*1024)throw Error('Общият размер на снимките е до 6 MB.');
 const result=[];
 for(const file of values){
  const original=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});
  const bitmap=await createImageBitmap(file);
  if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>60000000){bitmap.close();throw Error('Снимката е с прекалено големи размери.')}
  const scale=Math.min(1,1280/bitmap.width,1280/bitmap.height),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  const preview=canvas.toDataURL('image/jpeg',.84);if(preview.length>1900000)throw Error('Избери по-малка снимка.');
  result.push({name:file.name,size:file.size,original,preview});
 }
 return [...existing,...result];
}
