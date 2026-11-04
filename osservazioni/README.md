# Osservazioni Scienze Motorie

Questa cartella contiene la PWA per le osservazioni rapide in palestra.

## Versione iniziale
- Attività: Palla prigioniera standard
- 3 giocatori osservati per round
- 6 codici: PP01–PP06
- Conteggio eventi con un tocco
- Annulla ultimo evento
- Salvataggio locale sul dispositivo
- Esportazione CSV
- Codici pseudonimi: nessun nome reale richiesto
- Cache offline tramite service worker

## Struttura
- `index.html` — interfaccia e logica principale
- `manifest.webmanifest` — configurazione PWA
- `service-worker.js` — funzionamento/cache offline
- `icon.svg` — icona della PWA

## URL previsto
`https://andreabig-ui.github.io/osservazioni/`

Il progetto esistente dei giochi nella radice del repository non viene modificato.


## Ukemi · tre fasi e raccolta dei colleghi

Aprire `ukemi.html` oppure una fase direttamente:
- `ukemi.html?fase=1`: avviamento motorio, 3 criteri
- `ukemi.html?fase=2`: sbilanciamento e rullaggio indietro, 5 criteri
- `ukemi.html?fase=3`: mae ukemi, 8 criteri

Scala comune 0/1/2, N/O distinto da zero e vuoto. Anno scolastico, classe, numero di registro, docente, data e rilevazione collegano le tre fasi. Salvataggio locale, copie JSON, esportazione CSV, importazione delle copie dei colleghi e statistiche con deduplicazione.

Per la raccolta in un unico archivio riservato, aprire `ukemi-attivazione.html`. Il registro Apps Script e le istruzioni sono in `ukemi-backend/`. L'attivazione Google è necessaria per la sincronizzazione fra dispositivi: GitHub Pages da solo non riceve le risposte dei colleghi. I risultati non vanno committati nel repository pubblico.

Verifiche: dalla radice `node tests/build-backend.cjs` e `node tests/ukemi.test.cjs`.
