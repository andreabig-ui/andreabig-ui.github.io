const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),dir=path.join(root,'osservazioni'),backend=path.join(dir,'ukemi-backend');
const core=fs.readFileSync(path.join(dir,'ukemi-core.js'),'utf8'),app=fs.readFileSync(path.join(dir,'ukemi.js'),'utf8'),css=fs.readFileSync(path.join(dir,'ukemi.css'),'utf8');
const html=fs.readFileSync(path.join(dir,'ukemi.html'),'utf8').replace('<link rel="stylesheet" href="ukemi.css">','<style>'+css+'</style>').replace('<script src="ukemi-core.js"></script>','<script>'+core.replaceAll('</script','<\\/script')+'</script>').replace('<script src="ukemi.js"></script>','<script>'+app.replaceAll('</script','<\\/script')+'</script>');
fs.writeFileSync(path.join(backend,'Ukemi.html'),html);
fs.writeFileSync(path.join(backend,'Core.gs'), 'var UkemiCore = (function(){\n'+core.slice(core.indexOf("'use strict';"),core.lastIndexOf('});'))+'\n})();\n');
console.log('Interfaccia condivisa e criteri aggiornati.');
const server=fs.readFileSync(path.join(backend,'Code.gs'),'utf8').replace("HtmlService.createHtmlOutputFromFile('Ukemi').getContent()",'UKEMI_APP_HTML_');
const combined='// Installazione in un solo file. Generato dai sorgenti del repository.\n'+fs.readFileSync(path.join(backend,'Core.gs'),'utf8')+'\nconst UKEMI_APP_HTML_='+JSON.stringify(html)+';\n'+server;
fs.writeFileSync(path.join(backend,'UkemiRegistro.gs'),combined);
