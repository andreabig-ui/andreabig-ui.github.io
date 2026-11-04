/* Registro Ukemi. Configurazione e chiavi restano nelle proprietà dello script. */
const UKEMI_VERSION_ = 'ukemi-1.0';
const HEADERS_ = ['id_invio','ricevuto_il','docente_autenticato','schede_json'];

// Eseguire UNA VOLTA dall'editor Apps Script con l'account scolastico.
// Il suffisso _ impedisce la chiamata di questa funzione da google.script.run.
function setupUkemi_() {
  const props=PropertiesService.getScriptProperties();
  if(props.getProperty('UKEMI_SHEET_ID')) {
    console.log('Registro già configurato: https://docs.google.com/spreadsheets/d/'+props.getProperty('UKEMI_SHEET_ID'));
    return;
  }
  const book=SpreadsheetApp.create('Ukemi · Registro condiviso classi prime');
  const sheet=book.getSheets()[0];sheet.setName('Invii');sheet.appendRow(HEADERS_);sheet.setFrozenRows(1);
  const setup=book.insertSheet('Accessi');
  setup.appendRow(['Ruolo','Codice docente','Chiave personale (riservata)']);
  const credentials=[];
  for(let i=1;i<=10;i++){
    const id='D'+String(i).padStart(2,'0'),token=Utilities.getUuid()+Utilities.getUuid();
    credentials.push({id,role:'teacher',hash:hash_(token)});
    setup.appendRow(['Docente',id,token]);
  }
  const admin=Utilities.getUuid()+Utilities.getUuid();
  credentials.push({id:'COORD01',role:'admin',hash:hash_(admin)});
  setup.appendRow(['Coordinatore','COORD01',admin]);
  setup.appendRow(['Non condividere questo foglio. Consegnare a ogni docente soltanto la propria riga.','','']);
  setup.autoResizeColumns(1,3);sheet.autoResizeColumns(1,3);
  props.setProperties({UKEMI_SHEET_ID:book.getId(),UKEMI_CREDENTIALS:JSON.stringify(credentials)});
  console.log('Registro pronto: '+book.getUrl());
}
function hash_(token){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(token),Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function auth_(arg){
  if(!arg||typeof arg.token!=='string'||arg.token.length>200)throw Error('Chiave personale non valida.');
  const hash=hash_(arg.token),arr=JSON.parse(PropertiesService.getScriptProperties().getProperty('UKEMI_CREDENTIALS')||'[]');
  const match=arr.find(x=>x.hash===hash);if(!match)throw Error('Chiave personale non valida o revocata.');return match;
}
function apiLogin(arg){const who=auth_(arg);return {id:who.id,role:who.role};}
function core_(){return UkemiCore;}
function book_(){const id=PropertiesService.getScriptProperties().getProperty('UKEMI_SHEET_ID');if(!id)throw Error('Il coordinatore deve inizializzare il registro.');return SpreadsheetApp.openById(id);}
function validateBatch_(batch,who){
  if(!batch||batch.rubricVersion!==UKEMI_VERSION_||!Array.isArray(batch.records)||batch.records.length<1||batch.records.length>40)throw Error('Invio non valido (massimo 40 schede).');
  if(typeof batch.submissionId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(batch.submissionId))throw Error('Identificativo invio non valido.');
  const core=core_(),ids=new Set();
  return batch.records.map(input=>{
    const r=core.validateRecord(input);
    if(who.role!=='admin'&&r.observer!==who.id)throw Error('Il codice docente non corrisponde alla chiave personale.');
    if(Date.parse(r.modifiedAt)>Date.now()+300000)throw Error('L’orologio del dispositivo è troppo avanti. Correggerlo e riprovare.');
    if(ids.has(r.id))throw Error('Scheda ripetuta nello stesso invio.');ids.add(r.id);return r;
  });
}
function apiSave(arg){
  const who=auth_(arg),batch=arg.batch,records=validateBatch_(batch,who),encoded=JSON.stringify(records);
  if(encoded.length>45000)throw Error('Invio troppo grande.');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    const sheet=book_().getSheetByName('Invii'),last=sheet.getLastRow();
    // Ricevuta idempotente. Un timeout del browser può essere ritentato senza duplicare l'invio.
    if(last>1){const rows=sheet.getRange(2,1,last-1,4).getValues();const old=rows.find(row=>row[0]===batch.submissionId);if(old){if(old[2]!==who.id||old[3]!==encoded)throw Error('Identificativo già utilizzato per un altro contenuto.');return {ok:true,submissionId:batch.submissionId,duplicate:true};}}
    // Un invio = una riga. Un'unica scrittura conserva insieme identificativo e dati.
    sheet.getRange(last+1,1,1,4).setValues([[batch.submissionId,new Date().toISOString(),who.id,encoded]]);
    SpreadsheetApp.flush();return {ok:true,submissionId:batch.submissionId,count:records.length};
  }finally{lock.releaseLock();}
}
function apiRead(arg){
  const who=auth_(arg);if(who.role!=='admin')throw Error('La consultazione complessiva è riservata al coordinatore.');
  const sheet=book_().getSheetByName('Invii'),last=sheet.getLastRow();if(last<2)return {records:[]};
  const values=sheet.getRange(2,4,last-1,1).getValues();
  const records=[];for(const row of values){if(row[0])records.push.apply(records,JSON.parse(row[0]));}
  return {records:core_().mergeRecords(records)};
}
function doGet(e){
  const phase=Number(e&&e.parameter&&e.parameter.fase)||1;
  const html=HtmlService.createHtmlOutputFromFile('Ukemi').getContent().replace('/*HOST_CONFIG*/','window.UKEMI_INITIAL_PHASE='+([1,2,3].includes(phase)?phase:1)+';');
  return HtmlService.createHtmlOutput(html).setTitle('Ukemi · Registro condiviso').addMetaTag('viewport','width=device-width,initial-scale=1,viewport-fit=cover');
}
