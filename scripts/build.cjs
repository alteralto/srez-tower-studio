const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,'src',name),'utf8');
function build(){
 let html=read('template.html').replace('/*ENGINE*/',()=>read('engine.js')).replace('/*APP*/',()=>read('app.js'));
 html=html.replace('</style>',()=>read('chat.css')+'\n</style>');
 html=html.replace('<button class="btn" id="print">','<button class="btn" id="openChat">Чат о проекте</button><button class="btn" id="print">');
 html=html.replace('<section class="details">',()=>read('chat.html')+'\n<section class="details">');
 html=html.replace('</body>',()=>'<script>'+read('chat.js')+'</script></body>');
 html=html.replace(/\r\n?/g,'\n');
 const dir=path.join(root,'public');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);return html;
}
module.exports={build};if(require.main===module){build();console.log('Built public/index.html');}
