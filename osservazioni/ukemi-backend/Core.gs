var UkemiCore = (function(){
'use strict';
const VERSION='ukemi-1.0';
const PHASES=[
{id:'avviamento',title:'Avviamento motorio',short:'1 · Avviamento',criteria:[
['AV01','Respiro e braccia','Coordina il movimento delle braccia con una respirazione regolare, senza trattenere l’aria.'],
['AV02','Mobilità controllata','Esegue la sequenza di mobilità con appoggi stabili, gradualità e ampiezza personale controllata.'],
['AV03','Orecchio e spalla','Mantiene il riferimento del telefono fra orecchio e spalla, distinguendo l’orecchio dalla guancia.']
]},
{id:'indietro',title:'Sbilanciamento e rullaggio indietro',short:'2 · Indietro',criteria:[
['IN01','Palmo intero','Accompagna la discesa poggiando l’intero palmo, senza affidarsi alle sole dita.'],
['IN02','Mano visibile','Mantiene lo sguardo sulla mano di appoggio durante il rullaggio.'],
['IN03','Rullaggio laterale','Rulla sulla parte laterale della schiena, con discesa continua e senza urti sul sacro o sulla linea vertebrale.'],
['IN04','Telefono stabile','Conserva la posizione orecchio–spalla durante il rullaggio, senza caricare testa o collo.'],
['IN05','Piede opposto','Nella fase conclusiva cerca il terreno dietro la testa con il piede opposto alla spalla del telefono, entro l’ampiezza controllabile.']
]},
{id:'avanti',title:'Mae ukemi · preparazione e rotolamento',short:'3 · Mae ukemi',criteria:[
['MA01','Quadrato iniziale','Dispone mani e ginocchia in un quadrato regolare e stabile.'],
['MA02','Mano rovesciata','Rovescia una mano dal lato del pollice e ne fa scivolare il dorso verso l’esterno, accompagnando l’intrarotazione della spalla.'],
['MA03','Spalla in discesa','Appoggia gradualmente la spalla dello stesso lato della mano rovesciata, senza urti.'],
['MA04','Telefono opposto','Mantiene il telefono tra orecchio e spalla opposta a quella in discesa. Evita la sostituzione con la guancia e il carico sul collo.'],
['MA05','Finestra visiva','Orienta lo sguardo verso la finestra tra le gambe, conservando la posizione della testa.'],
['MA06','Equilibrio due piedi','Mantiene la posizione con entrambi i piedi e la spalla di appoggio. L’orecchio è un riferimento di posizione, non un sostegno del peso.'],
['MA07','Equilibrio un piede','Mantiene la posizione con un solo piede, con la gamba libera distesa e alta quanto il controllo consente.'],
['MA08','Rotolamento controllato','Supera gradualmente la base d’appoggio e accompagna il rotolamento senza precipitarsi o ricevere spinte.']
]}
];
const VALUES=[null,'NO',0,1,2];
const LABELS={'0':'Da acquisire','1':'Con richiamo','2':'Autonomo','NO':'Non osservato'};
const ALL_IDS=PHASES.flatMap(p=>p.criteria.map(c=>c[0]));
function assert(v,m){if(!v)throw new Error(m);}
function validateRecord(r){
assert(r&&typeof r==='object','Osservazione mancante.');
assert(r.rubricVersion===VERSION,'Versione dei criteri non compatibile.');
for(const k of ['id','sessionId'])assert(typeof r[k]==='string'&&/^[a-zA-Z0-9_-]{8,100}$/.test(r[k]),'Identificativo non valido.');
assert(/^\d{4}-\d{2}$/.test(r.schoolYear),'Anno scolastico non valido.');
const yy=Number(r.schoolYear.slice(0,4));assert(r.schoolYear.slice(5)===String((yy+1)%100).padStart(2,'0'),'Anno scolastico incoerente.');
assert(/^1[A-Z]$/.test(r.classCode),'Indicare una classe prima, per esempio 1A.');
assert(/^\d{4}-\d{2}-\d{2}$/.test(r.lessonDate)&&!isNaN(Date.parse(r.lessonDate))&&new Date(r.lessonDate+'T12:00:00Z').toISOString().slice(0,10)===r.lessonDate,'Data non valida.');
assert(Number.isInteger(r.attempt)&&r.attempt>=1&&r.attempt<=100,'Rilevazione non valida.');
assert(Number.isInteger(r.classSize)&&r.classSize>=1&&r.classSize<=40,'Numero alunni non valido.');
assert(Number.isInteger(r.student)&&r.student>=1&&r.student<=r.classSize,'Numero di registro non valido.');
assert(/^[A-Z0-9_-]{2,20}$/.test(r.observer),'Usare un codice docente di 2–20 caratteri.');
assert(['presente','assente','non_partecipa'].includes(r.participation),'Partecipazione non valida.');
const p=PHASES.find(p=>p.id===r.phase);assert(p,'Fase non valida.');
assert(r.values&&typeof r.values==='object'&&!Array.isArray(r.values),'Valori mancanti.');
const keys=Object.keys(r.values);assert(keys.length===p.criteria.length&&keys.every(k=>p.criteria.some(c=>c[0]===k)),'Criteri incoerenti con la fase.');
assert(keys.every(k=>VALUES.includes(r.values[k])),'Livello non valido.');
assert(r.participation==='presente'||keys.every(k=>r.values[k]===null),'Assenza e non partecipazione non possono avere punteggi.');
assert(typeof r.modifiedAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(r.modifiedAt)&&!isNaN(Date.parse(r.modifiedAt))&&new Date(r.modifiedAt).toISOString()===r.modifiedAt,'Data della modifica non valida.');
// Whitelist: niente campi liberi, nomi, note o chiavi di accesso nei dati salvati.
return Object.fromEntries(['id','sessionId','rubricVersion','schoolYear','classCode','lessonDate','attempt','classSize','student','observer','participation','phase','values','modifiedAt'].map(k=>[k,k==='values'?Object.fromEntries(keys.map(id=>[id,r.values[id]])):r[k]]));
}
function mergeRecords(...groups){const map=new Map();for(const r0 of groups.flat()){const r=validateRecord(r0);const old=map.get(r.id);if(!old||Date.parse(r.modifiedAt)>Date.parse(old.modifiedAt))map.set(r.id,r);}return [...map.values()];}
function latestRecords(records,filter={}){
const map=new Map();for(const r of mergeRecords(records)){
if(filter.schoolYear&&r.schoolYear!==filter.schoolYear||filter.classCode&&r.classCode!==filter.classCode||filter.phase&&r.phase!==filter.phase)continue;
const key=[r.schoolYear,r.classCode,r.student,r.phase].join('|');const old=map.get(key);
const order=x=>[x.lessonDate,String(x.attempt).padStart(3,'0'),x.modifiedAt,x.id].join('|');
if(!old||order(r)>order(old))map.set(key,r);
}return [...map.values()];}
function statistics(records,filter={}){
const valid=mergeRecords(records);const latest=latestRecords(valid,filter);const pupils=new Set();const withScores=new Set();const classes=new Map();
for(const r of latest){const key=[r.schoolYear,r.classCode,r.student].join('|');pupils.add(key);classes.set(r.schoolYear+'|'+r.classCode,Math.max(classes.get(r.schoolYear+'|'+r.classCode)||0,r.classSize));if(r.participation==='presente'&&Object.values(r.values).some(v=>typeof v==='number'))withScores.add(key);}
const roster=latestRecords(valid,{schoolYear:filter.schoolYear,classCode:filter.classCode});classes.clear();const rosterLatest=new Map();for(const r of roster){const k=r.schoolYear+'|'+r.classCode;const old=rosterLatest.get(k);if(!old||r.lessonDate+'|'+String(r.attempt).padStart(3,'0')+'|'+r.modifiedAt>old.lessonDate+'|'+String(old.attempt).padStart(3,'0')+'|'+old.modifiedAt)rosterLatest.set(k,r);}for(const [k,r] of rosterLatest)classes.set(k,r.classSize);
const criteria=PHASES.filter(p=>!filter.phase||p.id===filter.phase).flatMap(p=>p.criteria.map(c=>{
const a=latest.filter(r=>r.phase===p.id&&r.participation==='presente');const counts=[0,0,0];let no=0,blank=0;for(const r of a){const v=r.values[c[0]];if(typeof v==='number')counts[v]++;else if(v==='NO')no++;else blank++;}
const assessed=counts.reduce((s,v)=>s+v,0);return {phase:p.id,id:c[0],label:c[1],counts,no,blank,assessed,autonomous:assessed?counts[2]/assessed:null};}));
return {latest,pupils:pupils.size,withScores:withScores.size,classCount:classes.size,expected:[...classes.values()].reduce((s,v)=>s+v,0),criteria};
}
function csv(rows){const q=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';return '\ufeff'+rows.map(r=>r.map(q).join(';')).join('\r\n');}
function recordsCSV(records){return csv([['anno_scolastico','classe','registro','data','rilevazione','docente','fase','partecipazione','criterio','livello','descrizione','id_osservazione'],...mergeRecords(records).flatMap(r=>Object.entries(r.values).map(([id,v])=>[r.schoolYear,r.classCode,r.student,r.lessonDate,r.attempt,r.observer,r.phase,r.participation,id,v===null?'':v,v===null?'Non compilato':LABELS[v],r.id]))]);}
return {VERSION,PHASES,ALL_IDS,VALUES,LABELS,validateRecord,mergeRecords,latestRecords,statistics,csv,recordsCSV};

})();
