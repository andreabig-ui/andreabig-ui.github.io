# Registro condiviso Ukemi

Le tre griglie sono già utilizzabili su GitHub Pages. Su GitHub i dati restano nel browser. Per raccogliere i colleghi in un unico archivio, attivare la stessa interfaccia come app Google Apps Script collegata a un foglio riservato. Non occorre creare Google Forms separati.

## Attivazione una sola volta, nell'account scolastico

1. Aprire https://script.google.com/ e creare un nuovo progetto, chiamato **Registro Ukemi**.
2. Aprire il file [`UkemiRegistro.gs`](UkemiRegistro.gs) di questa cartella. Copiare tutto il contenuto al posto del codice iniziale di `Codice.gs`. Questo file unico comprende già interfaccia, criteri e archivio.
3. Salvare. Nell'elenco delle funzioni scegliere **setupUkemi_**, eseguirla e completare l'autorizzazione Google. Il suffisso `_` protegge la funzione dalle chiamate dei visitatori, ma consente l'esecuzione dall'editor.
4. Nel registro di esecuzione aprire il collegamento al foglio **Ukemi · Registro condiviso classi prime**. La scheda **Accessi** contiene dieci codici docente D01–D10 e le rispettive chiavi, più COORD01 per il coordinatore. Tenere il foglio riservato: consegnare a ciascun collega soltanto la sua chiave. Le chiavi non vanno mai nel repository.
5. Scegliere **Distribuisci → Nuova distribuzione → Applicazione web**. Eseguire come proprietario. Limitare l'accesso all'organizzazione scolastica, se disponibile e compatibile con gli account dei colleghi. In alternativa usare l'accesso con account Google. Ogni utente deve comunque inserire la propria chiave personale. Le policy dell'amministratore Google Workspace possono limitare queste scelte.
6. Copiare l'URL finale che termina con **/exec**. Nella griglia GitHub, **Collegamento condiviso**, incollare e memorizzare questo indirizzo. Ai colleghi distribuire direttamente l'indirizzo `/exec` del registro, che mostra la stessa grafica.
7. Fare una prova con un codice docente: aprire classe, scegliere un livello, inviare. Il messaggio deve dire **invio confermato** e deve apparire una riga nella scheda **Invii**. Se non arriva una conferma, il browser conserva l'invio e permette di riprovarlo.
8. Accedere con la chiave COORD01. In **Statistiche**, scegliere **Aggiorna dal registro** per leggere tutti i colleghi. Il foglio non richiede la pubblicazione sul web né la condivisione con i compilatori.

Per evitare dati di prova nelle statistiche, cancellare soltanto le righe di prova nella scheda Invii prima dell'uso effettivo. Non cancellare la riga di intestazione. Non distribuire agli alunni le chiavi riservate ai docenti.

## Compilazione

- Stesso anno, classe, numero di registro e numero di rilevazione per tutti i colleghi.
- Il numero di registro è quello effettivo dell'elenco di classe, senza compattare i numeri se un ragazzo è assente. N. alunni deve comprendere il numero più alto utilizzato nell'elenco.
- Ogni docente usa la sua chiave. Il coordinatore può associare privatamente i codici ai colleghi; i nomi non entrano nei dati.
- `0` da acquisire, `1` con richiamo, `2` autonomo. `N/O` significa non osservato e `—` non compilato. Non si trasformano celle vuote o assenze in zero.
- “Salva fase” conserva una copia e prepara l'invio. “Invia al registro condiviso” salva la fase corrente e invia tutte le schede in attesa del docente autenticato.
- Le tre fasi condividono classe e numero di registro. Il docente conferma i prerequisiti prima della fase seguente.
- La chiave rimane in memoria durante la sessione. Non viene inserita nelle copie esportate, nel foglio Invii o nei file pubblici.

## Recupero di compilazioni locali e unione dei colleghi

La versione GitHub e quella Apps Script hanno spazi di salvataggio distinti. Prima di cambiare dispositivo, indirizzo o account, usare **Copia di sicurezza**.

Nel registro, aprire **Statistiche → Importa copie dei colleghi**. Un docente può inviare le proprie copie. Il coordinatore può importare e inviare quelle di tutti i colleghi con **Invia copie importate**. Le copie possono anche essere unite localmente senza attivare il registro: in tal caso le statistiche dichiarano che l'origine è il dispositivo.

La copia JSON è un archivio pseudonimo con anno, classe, numero di registro e livelli: conservarla nei canali scolastici previsti, senza pubblicarla nel repository. L'importazione unisce le schede per identificativo e data di modifica. Conserva i risultati originali e i loro codici docente.

## Statistiche e denominatori

Il registro conserva gli invii, ma il riepilogo usa una sola scheda per ragazzo e fase: data più recente, poi numero di rilevazione più alto, poi modifica più recente. Le correzioni della stessa scheda prevalgono sulla copia precedente. A parità assoluta si usa l'identificativo per una scelta deterministica. Un ragazzo osservato da due docenti non pesa doppio. Le rilevazioni precedenti restano nell'archivio ma non vengono sommate nel riepilogo dell'ultima prova.

Per ogni criterio compaiono frequenze di 0/1/2, numero degli osservati, N/O e vuoti. La percentuale di autonomi è `n. valori 2 / n. valori numerici 0,1,2 × 100`. Le assenze, le non partecipazioni e i valori mancanti non entrano nel denominatore. Il totale atteso considera le numerosità più recenti delle sole classi presenti nell'archivio dell'anno selezionato, anche se manca la fase filtrata. Prima di parlare di tutte le prime, verificare che siano rappresentate tutte le classi previste.

Questi risultati descrivono le esecuzioni osservate. Non sono una scala standardizzata né consentono da soli di attribuire gli errori a disattenzione o difficoltà motoria. Prima della raccolta, i colleghi possono valutare insieme una stessa clip per concordare l'uso di 0/1/2.

## Accessi e limiti

La chiave del docente consente l'invio, quella del coordinatore anche la lettura complessiva. Il codice osservatore viene verificato sul server. Il foglio usa un blocco durante la scrittura e una ricevuta per ogni invio. Un ritento con lo stesso identificativo non crea doppioni.

In caso di smarrimento di una chiave, il proprietario può rimuovere la voce corrispondente dalla proprietà script `UKEMI_CREDENTIALS` e distribuire una nuova chiave. Le righe del foglio Accessi sono una copia per la distribuzione: modificarle da sole non aggiorna le chiavi effettive. Non rieseguire l'inizializzazione per tentare una rotazione.

Il registro dipende da connessione, disponibilità e quote Apps Script. I dati locali possono essere rimossi dal browser, soprattutto in navigazione privata: esportare copie regolarmente. La prima configurazione e la distribuzione effettiva richiedono l'account Google del coordinatore. Nessun collegamento centrale è attivo per il solo fatto che i sorgenti sono nel repository.

## Sviluppo

Sorgenti modulari: `Code.gs`, `Core.gs` (generato) e `Ukemi.html` (generato). Per modificare interfaccia o criteri:

```sh
node tests/build-backend.cjs
node tests/ukemi.test.cjs
```

Il comando aggiorna anche il file unico `UkemiRegistro.gs`. Pubblicare una nuova versione della distribuzione Apps Script dopo le modifiche. Prima di cambiare i criteri, aggiornare la versione della rubrica e definire una migrazione: non mescolare versioni incompatibili nelle statistiche.

Fonti tecniche: [Web app Apps Script](https://developers.google.com/apps-script/guides/web), [comunicazione client/server](https://developers.google.com/apps-script/guides/html/communication), [LockService](https://developers.google.com/apps-script/reference/lock/lock-service). Criteri didattici: lezione ukemi descritta dal docente e presentazione Ukemi_guida_docenti.pptx del 3 novembre 2026.
