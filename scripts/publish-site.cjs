const fs=require('node:fs'),path=require('node:path'),{build}=require('./build.cjs');
const root=path.resolve(__dirname,'..'),docs=path.join(root,'docs');fs.mkdirSync(docs,{recursive:true});let html=build();
// Pages is a static viewer. A private API credential belongs on a backend.
fs.writeFileSync(path.join(docs,'index.html'),html);fs.writeFileSync(path.join(docs,'.nojekyll'),'');fs.copyFileSync(path.join(root,'site-config.json'),path.join(docs,'chat-config.json'));fs.cpSync(path.join(root,'examples'),path.join(docs,'examples'),{recursive:true});console.log('Prepared docs/ for GitHub Pages');
