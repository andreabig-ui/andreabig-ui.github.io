const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),C=require('../osservazioni/ukemi-core.js');
class Element{constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.value='';}append(child){this.children.push(child);}replaceChildren(){this.children=[];}setAttribute(k,v){this[k]=v;}}
const js=fs.readFileSync('osservazioni/ukemi.js','utf8');const start=js.indexOf('function buildUkemiTable('),end=js.indexOf('\nfunction renderGrid()',start);const ctx={document:{createElement:tag=>new Element(tag)}};vm.createContext(ctx);vm.runInContext(js.slice(start,end)+';this.build=buildUkemiTable;',ctx);
for(const phase of C.PHASES){const table=new Element('table'),changes=[];const n=ctx.build(table,phase.criteria,25,()=>null,()=>{},(...x)=>changes.push(x));assert.equal(n,25);const body=table.children[1];assert.equal(body.tag,'tbody');assert.equal(body.children.length,25);assert.equal(body.children[0].children.length,phase.criteria.length+2);const select=body.children[0].children[2].children[0];assert.equal(select.disabled,false);assert.equal(select.children.length,5);select.value='0';select.onchange();assert.deepEqual(changes[0],[1,phase.criteria[0][0],0]);select.value='NO';select.onchange();assert.deepEqual(changes[1],[1,phase.criteria[0][0],'NO']);}
const table=new Element('table');ctx.build(table,C.PHASES[2].criteria,40,()=>({participation:'assente',values:Object.fromEntries(C.PHASES[2].criteria.map(c=>[c[0],null]))}),()=>{},()=>{});assert.equal(table.children[1].children.length,40);assert.equal(table.children[1].children[0].children[2].children[0].disabled,true);
console.log('PASS: tre fasi con 25 righe effettive, selettori compilabili, registrazione di 0 e N/O, 40 alunni e gestione assenti.');

// Esegue la pagina diretta con i soli elementi realmente presenti nel suo HTML.
const html=fs.readFileSync('ukemi/compila.html','utf8');
const elements=new Map([...html.matchAll(/\bid="([\w-]+)"/g)].map(([,id])=>[id,new Element(id)]));
for(const element of elements.values()){
 element.classList={toggle(){},remove(){}};
 element.innerHTML='';
}
elements.get('sessionForm').reportValidity=()=>true;
const storage=new Map();
const location=new URL('https://example.test/ukemi/compila.html?fase=2');
const page={URL,URLSearchParams,location,history:{replaceState(){}},requestAnimationFrame(){},
 crypto:require('node:crypto').webcrypto,
 localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
 document:{getElementById:id=>elements.get(id)||null,createElement:tag=>Object.assign(new Element(tag),{classList:{toggle(){}}}),
 querySelectorAll:()=>elements.get('phases').children}
};
page.window=page;
vm.createContext(page);
for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(script,page);
assert.match(elements.get('phaseTitle').textContent,/ushiro ukemi/);
elements.get('observer').value='D01';
elements.get('size').value='3';
elements.get('sessionForm').onsubmit({preventDefault(){}});
const rows=elements.get('grid').children[1].children;
assert.equal(rows.length,3);
const seat=rows[0].children[4].children[0];
assert.match(seat['aria-label'],/Seduta senza rumore/);
seat.value='2';
seat.onchange();
elements.get('save').onclick();
const saved=JSON.parse(storage.get('sm_ukemi_v1'));
assert.equal(saved.pending[0].records.length,3);
assert.equal(saved.pending[0].records[0].values.IN03,2);
console.log('PASS: la pagina diretta apre la griglia Ushiro e salva un livello dal modulo.');
