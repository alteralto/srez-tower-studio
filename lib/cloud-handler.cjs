const {validateInput,modelReply}=require('../server.cjs');
const recent=new Map();
function origins(){return new Set(['https://alteralto.github.io',...(process.env.TOWER_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean),...(process.env.VERCEL_PROJECT_PRODUCTION_URL?['https://'+process.env.VERCEL_PROJECT_PRODUCTION_URL]:[])])}
function createHandler(kind,config={}){return async function(req,res){
  const origin=req.headers.origin,allowed=origins();
  if(config.allowedOrigin)allowed.add(config.allowedOrigin);
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Vary','Origin');
  const json=(status,value)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(value))};
  if(origin&&!allowed.has(origin)){json(403,{error:'Недопустимый источник запроса'});return}
  if(origin)res.setHeader('Access-Control-Allow-Origin',origin);
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Max-Age','600');res.statusCode=204;res.end();return}
  const apiKey=config.apiKey??process.env.TOWER_API_KEY,model=config.model||process.env.TOWER_MODEL||'gpt-4.1-mini';
  if(kind==='status'&&req.method==='GET'){json(200,{ready:Boolean(apiKey),model});return}
  if(kind!=='chat'||req.method!=='POST'){json(405,{error:'Метод не поддерживается'});return}
  if(!origin||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){json(403,{error:'Откройте чат на странице студии'});return}
  if(!apiKey){json(503,{error:'На сервере пока не настроен ключ API'});return}
  if(Number(req.headers['content-length'])>65536){json(413,{error:'Сообщение слишком большое'});return}
  let body=req.body;
  try{if(body===undefined){let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>65536){json(413,{error:'Сообщение слишком большое'});return}chunks.push(chunk)}body=Buffer.concat(chunks).toString('utf8')}if(typeof body==='string'||Buffer.isBuffer(body))body=JSON.parse(body.toString());if(Buffer.byteLength(JSON.stringify(body))>65536){json(413,{error:'Сообщение слишком большое'});return}}catch{json(400,{error:'Некорректный запрос'});return}
  let data;try{data=validateInput(body)}catch{json(400,{error:'Проверьте сообщение и параметры башни'});return}
  const now=Date.now(),ip=(req.headers['x-forwarded-for']||'unknown').split(',')[0].trim(),key='ip:'+ip;
  for(const [k,entry] of recent)if(now-entry.start>60000)recent.delete(k);
  let limit=recent.get(key)||{start:now,count:0},total=recent.get('all')||{start:now,count:0};
  if(limit.count>=8||total.count>=40){json(429,{error:'Слишком много запросов. Попробуйте через минуту.'});return}
  recent.set(key,{start:limit.start,count:limit.count+1});recent.set('all',{start:total.start,count:total.count+1});
  try{json(200,await modelReply(data,{apiKey,model,...config}))}catch(e){console.warn('Chat request failed:',e.code||e.cause?.code||e.name);json(e.httpStatus||502,{error:e.httpStatus?e.message:'Не удалось получить ответ API. Попробуйте ещё раз.'})}
}}
module.exports={createHandler};
