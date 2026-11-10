const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../osservazioni/ukemi-core.js');
const base={id:'record000001',sessionId:'session00001',rubricVersion:C.VERSION,schoolYear:'2026-27',classCode:'1A',lessonDate:'2026-11-04',attempt:1,classSize:25,student:1,observer:'D01',participation:'presente',phase:'avviamento',values:{AV01:0,AV02:'NO',AV03:null},modifiedAt:'2026-11-04T09:00:00.000Z'};
const r=(change={})=>({...base,...change});
assert.equal(C.PHASES.length,3);assert.equal(new Set(C.ALL_IDS).size,16);
assert.throws(()=>C.validateRecord(r({values:{AV01:3,AV02:1,AV03:2}})));
assert.throws(()=>C.validateRecord(r({classCode:'2A'})));
assert.throws(()=>C.validateRecord(r({participation:'assente'})));
assert.throws(()=>C.validateRecord(r({schoolYear:'2026-29'})));
assert.throws(()=>C.validateRecord(r({lessonDate:'2026-02-31'})));
assert.equal(C.validateRecord(r({name:'Non salvare questo campo'})).name,undefined);
let stat=C.statistics([base]);assert.equal(stat.criteria[0].counts[0],1);assert.equal(stat.criteria[0].assessed,1);assert.equal(stat.criteria[1].assessed,0);assert.equal(stat.criteria[1].no,1);assert.equal(stat.criteria[2].blank,1);assert.equal(stat.criteria[1].autonomous,null);
const changed=r({values:{AV01:2,AV02:'NO',AV03:null},modifiedAt:'2026-11-04T09:01:00.000Z'});
assert.equal(C.mergeRecords([base],[changed,changed]).length,1);
stat=C.statistics([base,changed,changed]);assert.equal(stat.withScores,1);assert.equal(stat.criteria[0].counts[0],0);assert.equal(stat.criteria[0].counts[2],1);
const later=r({id:'record000002',observer:'D02',lessonDate:'2026-11-05',values:{AV01:1,AV02:2,AV03:2}});
stat=C.statistics([base,later]);assert.equal(stat.withScores,1);assert.equal(stat.criteria[0].counts[1],1);
const absent=r({id:'record000003',student:2,participation:'assente',values:{AV01:null,AV02:null,AV03:null}});
stat=C.statistics([base,absent]);assert.equal(stat.pupils,2);assert.equal(stat.withScores,1);assert.equal(stat.criteria[0].assessed,1);
const otherPhase=r({id:'record000004',classCode:'1B',phase:'indietro',classSize:20,values:{IN01:2,IN02:2,IN03:2,IN04:2,IN05:'NO'}});
stat=C.statistics([base,otherPhase],{phase:'avviamento'});assert.equal(stat.expected,45);assert.equal(stat.classCount,2);assert.equal(stat.withScores,1);
const previousBackward={...otherPhase,id:'record000006',rubricVersion:'ukemi-1.0',values:{...otherPhase.values,IN03:0}};
stat=C.statistics([previousBackward,otherPhase],{phase:'indietro'});
assert.equal(stat.withScores,1);
assert.deepEqual(stat.criteria.filter(c=>c.id==='IN03').map(c=>[c.label,c.counts]),[
  ['Seduta senza rumore',[0,0,1]],
  ['Rullaggio laterale (griglia precedente)',[1,0,0]]
]);
assert.match(C.recordsCSV([previousBackward,otherPhase]),/"record000006";"ukemi-1.0"/);
const noLater=r({id:'record000005',lessonDate:'2026-11-06',values:{AV01:'NO',AV02:'NO',AV03:'NO'}});
assert.equal(C.statistics([base,noLater]).withScores,0);
assert.match(C.recordsCSV([base]),/"0";"Da acquisire"/);assert.match(C.recordsCSV([base]),/"NO";"Non osservato"/);assert.match(C.csv([['=cmd']]),/'=cmd/);
// Backend: autenticazione, scrittura atomica, ritento idempotente e consultazione riservata.
const rows=[['id_invio','ricevuto_il','docente_autenticato','schede_json']];let acquired=0,released=0,flushes=0;
const digest=(kind,text)=>[...require('node:crypto').createHash('sha256').update(text).digest()].map(x=>x>127?x-256:x);
const props={UKEMI_SHEET_ID:'fakeSheet',UKEMI_CREDENTIALS:JSON.stringify([{id:'D01',role:'teacher',hash:require('node:crypto').createHash('sha256').update('teacher-test-key').digest('hex')},{id:'COORD01',role:'admin',hash:require('node:crypto').createHash('sha256').update('admin-test-key').digest('hex')}])};
const sheet={getLastRow:()=>rows.length,getRange:(row,col,count,width)=>({getValues:()=>rows.slice(row-1,row-1+count).map(r=>r.slice(col-1,col-1+width)),setValues:values=>{values.forEach((v,i)=>{rows[row-1+i]=v;});}})};
const context={console,Set,Map,Date,JSON,Error,Utilities:{computeDigest:digest,DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush:()=>flushes++},LockService:{getScriptLock:()=>({waitLock:()=>acquired++,releaseLock:()=>released++})}};
vm.createContext(context);vm.runInContext(fs.readFileSync('osservazioni/ukemi-backend/Core.gs','utf8')+'\n'+fs.readFileSync('osservazioni/ukemi-backend/Code.gs','utf8'),context);
assert.throws(()=>context.apiLogin({token:'wrong'}));assert.equal(context.apiLogin({token:'teacher-test-key'}).id,'D01');
const batch={submissionId:'submission00001',rubricVersion:C.VERSION,records:[base]};
context.apiSave({token:'teacher-test-key',batch});context.apiSave({token:'teacher-test-key',batch});assert.equal(rows.length,2);assert.equal(flushes,1);assert.equal(acquired,released);
assert.throws(()=>context.apiSave({token:'teacher-test-key',batch:{...batch,records:[r({observer:'D02'})]}}));
assert.throws(()=>context.apiSave({token:'teacher-test-key',batch:{...batch,records:[changed]}}));assert.equal(rows.length,2);
assert.throws(()=>context.apiRead({token:'teacher-test-key'}));assert.equal(context.apiRead({token:'admin-test-key'}).records.length,1);
context.apiSave({token:'teacher-test-key',batch:{...batch,submissionId:'submission00002',records:[changed]}});assert.equal(rows.length,3);assert.equal(context.apiRead({token:'admin-test-key'}).records.length,1);assert.equal(context.apiRead({token:'admin-test-key'}).records[0].values.AV01,2);
console.log('PASS: criteri, valori mancanti, deduplicazione, statistiche, autenticazione, invii e lettura riservata.');
// Anche il pacchetto da incollare nell'editor deve conservare i caratteri JS letterali.
const generated=fs.readFileSync('osservazioni/ukemi-backend/Ukemi.html','utf8');
for(const match of generated.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
assert.ok(generated.includes(fs.readFileSync('osservazioni/ukemi-core.js','utf8')));
new vm.Script(fs.readFileSync('osservazioni/ukemi-backend/UkemiRegistro.gs','utf8'));
console.log('PASS: interfaccia condivisa incorporata e file unico installabile.');
