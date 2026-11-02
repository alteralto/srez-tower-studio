const https=require('node:https');
function requestJson(url,options={}) {
  return new Promise((resolve,reject)=>{
    const body=options.body||'';
    const req=https.request(url,{method:options.method||'GET',family:4,headers:{...options.headers,...(body?{'Content-Length':Buffer.byteLength(body)}:{})},signal:options.signal},res=>{
      let chunks=[],size=0;
      res.on('data',chunk=>{size+=chunk.length;if(size>2*1024*1024){req.destroy(Error('API response too large'));return}chunks.push(chunk)});
      res.on('error',reject);
      res.on('end',()=>{let text=Buffer.concat(chunks).toString('utf8');resolve({ok:res.statusCode>=200&&res.statusCode<300,status:res.statusCode,json:async()=>JSON.parse(text)})});
    });
    req.on('error',reject);
    req.end(body||undefined);
  });
}
module.exports={requestJson};
