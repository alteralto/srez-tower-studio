// Regenerates the submission set in examples/ from the engine defaults, plus the two comparison variants.
const fs=require('node:fs'),path=require('node:path');
global.TowerForms=require('../src/forms.js');
const Tower=require('../src/engine.js');
const out=path.resolve(__dirname,'..','examples');
const variants={tower:{},'tower-prism':{roundness:0,twist:0,helix:0,corner:1.2,width:26.4,depth:24.6},'tower-sculpture':{roundness:0,twist:75,taper:.12,helix:0,corner:1.8,width:25.2,depth:25.8}};
function csv(s){let rows=[['Этаж','Тип','Отметка м','Высота м','ГНС м2','ЛЛУ м2','МКК м2','ОРП м2','К0','Квартиры','Жители оценка']];s.levels.forEach(f=>rows.push([f.floor,f.type,f.z.toFixed(2),f.h.toFixed(2),f.area.toFixed(2),f.floor===1?'':f.llu.toFixed(2),f.floor===1?'':f.mkk.toFixed(2),f.orp.toFixed(4),f.k0.toFixed(6),f.floor===1?0:8,f.floor===1?0:17]));rows.push(['Итого','','','',s.gns.toFixed(2),'','',s.orp.toFixed(4),s.k0.toFixed(6),s.flats,s.people]);return '﻿'+rows.map(r=>r.join(';')).join('\r\n')}
fs.mkdirSync(out,{recursive:true});
for(const [name,change] of Object.entries(variants)){
 const params=Tower.readDocument({schema:'srez-tower-v1',units:'metres',parameters:{...Tower.defaults,...change}}),model=Tower.geometry(params);
 fs.writeFileSync(path.join(out,name+'.glb'),Tower.glb(model));
 const s=model.stats;console.log(name.padEnd(16),'base',s.base.toFixed(1),'gns',s.gns.toFixed(0),'orp',s.orp.toFixed(0),'k0',s.k0.toFixed(3));
 if(name!=='tower')continue;
 fs.writeFileSync(path.join(out,'tower.obj'),Tower.obj(model));fs.writeFileSync(path.join(out,'tower.mtl'),Tower.mtl(model));
 fs.writeFileSync(path.join(out,'tower-floors.csv'),csv(s));fs.writeFileSync(path.join(out,'tower-parameters.json'),JSON.stringify(Tower.document(params),null,2));
}
