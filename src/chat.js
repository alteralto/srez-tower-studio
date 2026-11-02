(() => {
 const input=$('chatInput'),log=$('chatLog'),send=$('chatSend'),activity=$('chatActivity'),connection=$('chatConnection');
 const offlineFile=location.protocol==='file:',pagesHost=location.hostname.endsWith('.github.io');
 const names={floors:'Этажность',width:'Ширина',depth:'Глубина',corner:'Срез углов',height:'Типовой этаж',setback:'Верхний уступ'};
 let history=[],lastDocument=null,undo=null,busy=false,controller=null,requestVersion=0,apiBase='',chatReady=false;
 function message(role,text,error=false){let box=document.createElement('div');box.className='chat-message '+(role==='user'?'user-message':'assistant-message')+(error?' chat-error':'');let author=document.createElement('b');author.textContent=role==='user'?'Вы':'Ассистент';let p=document.createElement('p');p.textContent=text;box.append(author,p);log.append(box);log.scrollTop=log.scrollHeight;}
 async function status(){if(offlineFile){connection.textContent='Для чата запустите локальную студию';return}try{if(pagesHost){let c=await fetch(new URL('chat-config.json',location.href),{cache:'no-store'});let cfg=await c.json();if(!cfg.chatApiBase){connection.textContent='Публичный чат пока не подключён';return}let u=new URL(cfg.chatApiBase);if(u.protocol!=='https:'||u.username||u.password)throw Error();apiBase=u.origin}let r=await fetch(apiBase+'/api/status');if(!r.ok)throw Error();let s=await r.json();chatReady=s.ready;connection.textContent=s.ready?'Подключён · '+s.model:'На сервере не настроен ключ'}catch{connection.textContent='Сервер чата временно недоступен'}}
 function applyDocument(doc){params=Tower.readDocument(doc);document.querySelectorAll('[data-preset]').forEach(b=>b.classList.remove('active'));refresh()}
 function receiveDocument(doc,requestParameters){
  const next=Tower.readDocument(doc),current=JSON.stringify(params),target=JSON.stringify(next);
  lastDocument=Tower.document(next);$('chatJson').textContent=JSON.stringify(lastDocument,null,2);$('chatProposal').hidden=false;
  let rows=[];for(const k of Object.keys(names))if(params[k]!==next[k]){let row=document.createElement('div');row.className='chat-diff';let label=document.createElement('span'),value=document.createElement('strong');label.textContent=names[k];value.textContent=fmt(params[k],k==='floors'?0:1)+' → '+fmt(next[k],k==='floors'?0:1);row.append(label,value);rows.push(row)}$('chatChanges').replaceChildren(...rows);
  const s=lastDocument.metrics;$('chatPreview').textContent=`${s.floors} этажей, ${s.flats} квартир, ГНС ${fmt(s.gns)} м², ОРП ${fmt(s.orp)} м², К0 ${fmt(s.k0,3)}, высота ${fmt(s.crown,2)} м.`;
  $('chatUndo').hidden=true;
  if(current!==requestParameters){$('chatResultTitle').textContent='JSON ответа сохранён';message('assistant','Модель изменилась во время ответа. JSON можно скачать, но он не применён поверх ваших изменений.');return}
  if(current===target){$('chatResultTitle').textContent='Текущий JSON модели';return}
  undo={before:{...params},after:target};applyDocument(lastDocument);$('chatUndo').hidden=false;$('chatResultTitle').textContent='Модель обновлена';setStatus('JSON из чата применён к 3D-модели');activity.textContent='Модель обновлена';
 }
 $('chatForm').addEventListener('submit',async e=>{
  e.preventDefault();const text=input.value.trim();if(!text||busy)return;
  if(!chatReady){await status();if(!chatReady){message('assistant',offlineFile?'Запустите npm start и откройте http://127.0.0.1:8765.':'Подключение чата пока недоступно. Попробуйте обновить страницу позже.',true);return}}
  busy=true;send.disabled=true;input.value='';message('user',text);activity.textContent='Обновляем вариант…';
  const request=++requestVersion,requestParameters=JSON.stringify(params),abort=new AbortController();controller=abort;const timeout=setTimeout(()=>abort.abort(),65000);
  try{let res=await fetch(apiBase+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:history.slice(-12),parameters:params}),signal:abort.signal});let data=await res.json();if(!res.ok)throw Error(data.error||'Не удалось получить ответ');if(request!==requestVersion)return;message('assistant',data.reply);history.push({role:'user',content:text},{role:'assistant',content:data.reply});history=history.slice(-12);activity.textContent='Ответ получен';if(data.model)receiveDocument(data.model,requestParameters);else if(data.changes?.length)throw Error('Сервер не вернул JSON модели. Обновите сервер студии.');}
  catch(err){if(request!==requestVersion)return;message('assistant',err.name==='AbortError'?'Время ожидания истекло. Можно повторить запрос.':err.message,true);activity.textContent='Запрос не выполнен';}
  finally{clearTimeout(timeout);if(request===requestVersion){busy=false;send.disabled=false;controller=null;input.focus()}}
 });
 $('chatUndo').onclick=()=>{if(!undo)return;if(JSON.stringify(params)!==undo.after){message('assistant','После ответа вы уже изменили модель. Отмена не перезапишет эти изменения.');$('chatUndo').hidden=true;undo=null;return}applyDocument(Tower.document(undo.before));undo=null;$('chatUndo').hidden=true;$('chatResultTitle').textContent='Изменение отменено';setStatus('Восстановлен предыдущий вариант')};
 $('chatDownloadJson').onclick=()=>{if(lastDocument)download(JSON.stringify(lastDocument,null,2),'tower-chat-model.json','application/json')};
 $('chatClear').onclick=()=>{requestVersion++;controller?.abort();controller=null;busy=false;send.disabled=false;history=[];lastDocument=null;undo=null;log.replaceChildren();$('chatProposal').hidden=true;activity.textContent='';message('assistant','Начали новый разговор. Текущая модель сохранена.')};
 document.querySelectorAll('[data-chat]').forEach(b=>b.onclick=()=>{input.value=b.dataset.chat;input.focus()});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('chatForm').requestSubmit()}});
 $('openChat').onclick=()=>{$('assistant').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});input.focus({preventScroll:true})};
 status();
})();
