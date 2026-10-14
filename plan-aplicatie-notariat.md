# Plan de Construcție: Aplicație Web Locală pentru Notariat Românesc

**Versiune:** 1.4  
**Data:** Octombrie 2026  
**Scop:** Aplicație web (SPA/PWA) care rulează în browser, procesează exclusiv local pe hard-disk-ul utilizatorului (notarului). Cunoaște teoria notariatului românesc și toate modelele de contracte. Are două opțiuni principale (creare de la zero și verificare/corectare), plus modul dedicat de succesiune cu calcule automate.

**Cerințe cheie integrate:**
- Interfață **user-friendly**, plăcută vizual și ușor de folosit.
- Multilingvă: **română, engleză și maghiară**.
- Calitate maximă: corectare ortografie, punctuație, structură (capitole, subcapitole, aliniere), exprimări juridice corecte conform standardelor UNNPR și celor mai înalte standarde de redactare a actelor notariale din România.
- Generare acte de la zero + reverificare înainte de output.
- Modul **Succesiune**: generare certificat/partaj, calcule matematice automate ale cotelor, reverificare finală a calculelor conform Codului Civil și legilor notarilor publici.
- Orice alt calcul matematic necesar pentru acte și contracte notariale.

**Principiu fundamental:** Niciun document sau dată a utilizatorului nu este stocat online. Totul rămâne local pe dispozitivul notarului.

**Instrumente gratuite obligatorii (fără licențe plătite):**  
Pentru procesarea documentelor (PDF, DOCX etc.) se folosesc **exclusiv aplicațiile gratuite și open-source de pe [getartcraft.com](https://getartcraft.com)** (Crafting Apps). Acestea elimină necesitatea oricăror licențe plătite (Adobe Acrobat, Microsoft Word etc.).

**Cod sursă open-source (GitHub):**  
Toate aplicațiile sunt open-source. Organizația oficială GitHub: **[https://github.com/storytold](https://github.com/storytold)**.  
Se poate folosi direct de aici (clone, build, WebAssembly builds, librării etc.) dacă este nevoie de integrare mai profundă sau customizare.

Aplicații recomandate:
- **PdfCraft** (Early alpha) – PDF workbench: citire, organizare, combinare, split, securizare PDF. Disponibil pe Web, macOS, Windows, Linux. Ideal pentru contracte în format PDF.  
  Repo: [https://github.com/storytold/pdfcraft](https://github.com/storytold/pdfcraft)
- **WordCraft** (In development) – Word processing open-source. Disponibil pe Web. Pentru documente de tip DOCX.  
  Repo: [https://github.com/storytold/wordcraft](https://github.com/storytold/wordcraft)
- Alte Craft apps (PhotoCraft, VectorCraft etc.) pot fi folosite opțional pentru elemente vizuale sau layout, dacă este nevoie.

Toate sunt **gratuite, open-source (Rust, licențe MIT/Apache-2.0), fără cont obligatoriu pentru utilizare de bază, fără telemetrie, procesare locală**. Web versions (WebAssembly) se integrează ușor în aplicația noastră web. Se pot folosi direct din GitHub.

---

## 1. Fezabilitate

**Da, se poate realiza** cu următoarele condiții și limitări:

- **Procesare 100% client-side**: Folosim File System Access API (Chrome, Edge, Opera) pentru citire/scriere directă pe disc. Fallback pe `<input type="file">` + download pentru Firefox/Safari/mobile.
- **Bază de cunoștințe**: Pre-încărcată în aplicație (JSON/Markdown) + actualizări prin fetch de pe surse oficiale (cu limitări CORS) sau update manual al aplicației.
- **Verificare legi**: Comparare cu forme consolidate de pe [legislatie.just.ro](https://legislatie.just.ro). Fetch-ul direct poate fi blocat de CORS → soluții: snapshot local periodic, proxy static controlat (fără stocare date user) sau instrucțiuni pentru utilizator să descarce actele relevante.
- **Parsare și regenerare contracte**: Combinare de template-uri, reguli, extragere text (DOCX/PDF) și, opțional, AI local sau cu avertisment de confidențialitate.
- **Responsive**: Design mobile-first, PWA instalabil pe telefon/tabletă/desktop.
- **Limitări importante**:
  - Nu înlocuiește judecata profesională a notarului.
  - Legile se schimbă; aplicația trebuie actualizată.
  - Documentele notariale conțin date personale sensibile (GDPR) → nu trimite niciodată textul integral către API-uri externe fără anonimizare explicită și consimțământ.
  - File System Access API nu este disponibil pe toate browserele/mobile (în special iOS Safari limitat).

**Surse oficiale de referință:**
- Portal legislativ: https://legislatie.just.ro
- Ministerul Justiției: https://www.just.ro
- Uniunea Națională a Notarilor Publici din România (UNNPR): https://www.uniuneanotarilor.ro
- Legi cheie: Legea nr. 36/1995 (notarilor publici), Codul Civil (Legea 287/2009), Codul de Procedură Civilă etc.

---

## 2.1. Interfață Utilizator (UI/UX)

- **User-friendly** și plăcută vizual: design clar, butoane mari, fluxuri simple, feedback imediat.
- Ușor de folosit pe desktop, tabletă și telefon.
- Elemente vizuale (iconițe, ilustrații, animații subtile, fonturi) generate sau îmbunătățite, dacă este nevoie, cu instrumentele gratuite de pe **getartcraft.com** / GitHub storytold (PhotoCraft, VectorCraft, ArtCraft studio etc.).
- Tema clară/întunecată.
- PWA instalabil.

## 2.2. Multilingvism

Aplicația se generează și funcționează în **trei limbi**:
- Română (principală, pentru acte notariale)
- Engleză
- Maghiară

Interfața, mesajele, formularele și documentele generate (unde este relevant) suportă comutare de limbă. Actele notariale propriu-zise rămân în limba română, cu exprimări juridice corecte.

## 2.3. Standarde de Calitate și Corectitudine

- Toate actele generate sau corectate respectă standardele **UNNPR** (Uniunea Națională a Notarilor Publici din România) și cele mai înalte standarde de redactare a actelor notariale din România.
- Înainte de generarea finală se face **reverificare automată**:
  - Ortografie și punctuație
  - Aliniere, capitole, subcapitole, numerotare
  - Structură conform modelelor și practicilor notariale
  - Exprimări juridice corecte (terminologie, formulări standard)
- Datele din „cărțile notariale” / modele sunt folosite pentru verificare și completare.
- Legile sunt la zi (forme consolidate de pe legislatie.just.ro).

## 2.4. Modul Succesiune (Dezbatere Succesorală)

Aplicația știe să genereze o succesiune completă:
- Introducere date: defunct, moștenitori (clase, grade, soț supraviețuitor, descendenți etc.), masa succesorală (bunuri proprii / comune), testament (dacă există), data decesului etc.
- **Calcule matematice automate** conform Codului Civil și legilor notarilor publici:
  - Determinare clasă de moștenitori
  - Calcul cote succesorale legale (ex.: soț 1/4 + copii 3/4 împărțit egal; alte combinații)
  - Tratare bunuri comune vs. proprii
  - Rezerve succesorale, reducțiuni (unde e cazul)
  - Partaj și alocări
- **Reverificare finală obligatorie** a calculelor:
  - Verificare corectitudine matematică (sume cote = 1)
  - Verificare conformitate cu regulile legale pentru moștenitorii introduși
  - Raport de verificare înainte de generarea certificatului de moștenitor / încheierii
- Generare documente: certificat de moștenitor, încheiere de dezbatere, partaj etc., cu calculele afișate clar.

## 2.5. Calcule Matematice Generale

Aplicația efectuează orice alt calcul matematic necesar pentru acte și contracte notariale, de exemplu:
- Onorarii notariale (conform normelor UNNPR / tarife minimale)
- Impozite (ex. 1% după 2 ani)
- Cote-părți, fracții, procentaje
- Valori, prețuri, dobânzi, penalități
- Orice calcul specific introdus de notar

Toate calculele sunt transparente, afișate și pot fi reverificate.

---

## 3. Arhitectură Recomandată

```
[Browser pe dispozitivul notarului]
        ↓
[Aplicație Web Statică (SPA/PWA) – Multilingvă (RO/EN/HU)]
        ├── UI User-Friendly (cu elemente vizuale ArtCraft dacă e nevoie)
        ├── Opțiuni Principale
        │     ├── Creare Act Nou (formular + generare + reverificare)
        │     ├── Verificare & Corectare Act Existent
        │     └── Succesiune (date + calcule automate + reverificare)
        ├── Knowledge Base + Modele (standarde UNNPR)
        ├── Motor de Calcule Matematice (cote, onorarii, impozite etc.)
        ├── Corrector Calitate (ortografie, structură, exprimări juridice)
        ├── Law Checker (legi la zi)
        └── File Manager (salvare locală)
        ↓
[Hard-disk local al utilizatorului]
```

**Stack tehnologic sugerat (simplu și modern, 100% gratuit):**
- **Frontend**: React + Vite + TypeScript (sau Vue/Svelte, sau chiar vanilla JS pentru maximă simplitate)
- **Styling**: Tailwind CSS (responsive excelent)
- **State & Storage local**: Zustand/Pinia + IndexedDB (via Dexie.js) + File System Access API
- **Parsare și procesare documente** (folosind instrumente gratuite open-source de pe getartcraft.com / GitHub storytold):
  - **PdfCraft** ([github.com/storytold/pdfcraft](https://github.com/storytold/pdfcraft)) – WebAssembly / integrare pentru PDF: citire, extragere text, organizare, combinare
  - **WordCraft** ([github.com/storytold/wordcraft](https://github.com/storytold/wordcraft)) – WebAssembly / integrare pentru documente word-processing / DOCX
  - Fallback browser-native: pdf.js, mammoth.js (dacă Web versions nu sunt încă complete)
- **Export**: Generare DOCX/PDF folosind librării open-source sau prin WordCraft/PdfCraft + salvare locală
- **PWA**: Vite PWA plugin + manifest.json + Service Worker (doar pentru assets, nu pentru date user)
- **Hosting**: Static (GitHub Pages, Netlify, Vercel, sau server propriu) – zero backend de stocare

**Nu se folosesc aplicații care necesită licențe plătite.** Toată procesarea documentelor se bazează pe free tools open-source de pe https://getartcraft.com și https://github.com/storytold (PdfCraft, WordCraft etc.). Se pot folosi direct din GitHub.

**Alternative mai avansate:**
- WebLLM / transformers.js pentru AI local (limitat pe mobile)
- Integrare opțională cu un LLM extern (doar text anonimizat, cu checkbox de consimțământ)

---

## 3. Module Principale

### 3.1. Bază de Cunoștințe (Knowledge Base)
- Teoria notariatului (competență, acte notariale, autentificare, legalizare, dare de dată certă, succesiuni etc.)
- Structură pe capitole din Legea 36/1995, Codul Civil și standardele UNNPR
- Articole relevante extrase și indexate
- Modele și exprimări juridice corecte, verificate
- Actualizare: script de update care descarcă forme consolidate și le stochează local în IndexedDB
- Căutare semantică simplă (sau full-text) în baza locală

### 3.2. Bibliotecă de Modele de Contracte
- Toate tipurile comune de acte notariale (bază de cunoștințe pe care aplicația „le învață” și le cunoaște):
  - Contracte: vânzare-cumpărare (imobile/mobile), donație, schimb, întreținere, rentă viageră, împrumut, ipotecă, comodat, locațiune, antecontract
  - Succesoral: certificat de moștenitor, partaj, testament, declarații de acceptare/renunțare
  - Procuri (generale, speciale)
  - Acte constitutive societăți, acte adiționale
  - Altele: convenții matrimoniale, recunoașteri etc.
- Fiecare model: structură de clauze obligatorii/opționale, câmpuri variabile, referințe legale, note de completare, reguli de validare, formulări standard corecte
- Salvate ca JSON sau Markdown cu placeholders
- Aplicația folosește aceste modele ca sursă de adevăr pentru generare, corectare și verificarea calității (ortografie, structură, exprimări)
- Utilizatorul poate adăuga/edita propriile modele și le salvează local

### 3.3. Două Opțiuni Principale ale Aplicației

#### Opțiunea 1: Creare Contract / Act Notarial Nou (Generare Automată)
- Notarul selectează tipul de contract dorit din bibliotecă
- Completează un formular cu date și cerințe specifice
- Aplicația:
  - Aplică modelul corect învățat
  - Completează automat toate clauzele obligatorii conform legii actuale și standardelor UNNPR
  - Integrează datele introduse
  - **Reverificare automată** înainte de generare: ortografie, punctuație, structură (capitole/subcapitole), aliniere, exprimări juridice corecte
  - Generează documentul final (DOCX)
  - Salvează automat pe hard-disk-ul notarului

#### Opțiunea 2: Verificare și Corectare Contract Existent
- Câmp de introducere: upload fișier sau paste text
- Aplicația parsează, compară cu modelele, verifică legile, corectează conform standardelor, face reverificare de calitate și generează versiunea corectată + raport

#### Opțiunea 3: Succesiune (Modul Dedicat)
- Formular special pentru date succesorale
- Calcule automate + reverificare matematică și legală
- Generare certificat de moștenitor / documente aferente

### 3.4. Modul Upload & Parsare
- Selectare fișier(e) de pe disc (File System Access sau input) sau paste text
- Suport: .docx, .pdf, .txt
- Procesare folosind **instrumente gratuite de pe getartcraft.com**:
  - **PdfCraft** pentru PDF (extragere text, pagini, organizare)
  - **WordCraft** pentru documente word
  - Fallback: librării browser open-source (pdf.js, mammoth.js) dacă este nevoie
- Extragere text + identificarea tipului de act (reguli + clasificare pe baza modelelor cunoscute)
- Identificare părți, obiect, clauze cheie
- Procesare exclusiv în memorie / local

### 3.5. Modul Verificare Legală (Law Fact-Check)
- Pentru fiecare act: listă de articole/legi implicate
- La momentul parsării / generării: 
  - Verificare în cache local (cu dată ultimei actualizări)
  - Fetch de pe legislatie.just.ro (sau deschidere tab cu link direct pentru utilizator)
  - Comparare text consolidat vs. referințe din contract
  - Flag-uri: articol modificat, abrogat, neconform, lipsă
- Afișare sursă oficială + dată ultimei actualizări

### 3.6. Modul Regenerare / Corectare / Generare Contract
- Pentru Opțiunea 1: generare de la zero pe baza tipului + date introduse + model învățat
- Pentru Opțiunea 2: corectare pe baza comparației cu modelele cunoscute + legi actuale
- Aplicare template corect pentru tipul identificat
- Completare automată a câmpurilor extrase sau introduse
- Inserare / corectare clauze obligatorii conform legii actuale
- Generare document final (DOCX preferabil)
- Salvare automată pe disc (în folder ales de utilizator)

### 3.7. Manager Fișiere Local
- Acces la folder de lucru ales de notar (ex: `Documente/Notariat/Proiecte`)
- Auto-save la fiecare pas important (generare sau corectare)
- Istoric versiuni local (opțional, prin copie fișiere)
- Nimic nu pleacă online

### 3.8. Interfață Utilizator Responsive
- Ecran principal cu **două butoane/opțiuni clare**:
  - „Creează contract nou”
  - „Verifică și corectează contract existent”
- Desktop: layout cu sidebar + editor principal
- Tabletă: adaptat
- Telefon: navigare simplă, butoane mari, formulare optimizate
- Tema clară/întunecată
- PWA instalabil (icon pe home screen)

---

## 4. Pași de Construcție (Roadmap)

### Faza 0: Pregătire (1-2 săptămâni)
1. Colectare surse legale (forme consolidate de pe legislatie.just.ro)
2. Definire tipuri de acte prioritare (începe cu vânzare-cumpărare imobil, donație, procură, succesiune)
3. Design wireframes (Figma sau pe hârtie)
4. Setup proiect (Vite + React + Tailwind + TypeScript)
5. Configurare PWA de bază

### Faza 1: Fundație Locală (2-3 săptămâni)
1. Implementare File Manager (open/save cu File System Access API + fallback)
2. IndexedDB pentru knowledge base și preferințe
3. Import/export modele JSON
4. UI de bază responsive

### Faza 2: Knowledge Base & Templates (3-4 săptămâni)
1. Populare bază cu teoria + articole cheie
2. Creare 10-15 modele de contracte de bază (sursa de adevăr pentru generare și corectare)
3. Sistem de căutare în bază
4. Editor de template-uri

### Faza 3: Cele Două Opțiuni Principale (5-7 săptămâni)
1. **Opțiunea 1 – Creare Contract Nou**:
   - Formulare dinamice pe tip de contract
   - Engine de generare pe baza modelelor învățate + date introduse
2. **Opțiunea 2 – Verificare & Corectare**:
   - Integrare parsere (mammoth, pdf.js)
   - Logică de comparare cu modelele cunoscute
   - Corectare automată și generare contract corectat
3. Generare DOCX de ieșire pentru ambele opțiuni
4. Testare pe documente reale anonimizate

### Faza 4: Verificare Legală (2-3 săptămâni)
1. Cache local de acte normative relevante (legi la zi)
2. Mecanism de update/fetch (cu fallback manual)
3. Detectare articole abrogate/modificate
4. Afișare referințe oficiale cu data în raportul de corectare

### Faza 5: Polish, Testare, Documentație (2 săptămâni)
1. Optimizare mobile
2. Testare cross-browser
3. Disclaimer legal vizibil
4. Manual de utilizare
5. Deploy static

**Total estimat:** 3-6 luni pentru o versiune solidă (în funcție de echipă: 1 dezvoltator full-time sau 2-3 part-time).

---

## 5. Considerații Legale și de Confidențialitate

- **Disclaimer obligatoriu**: „Aplicație de asistență. Nu înlocuiește verificarea profesională a notarului. Verificați întotdeauna forma consolidată oficială a legii.”
- Datele personale din acte: procesare locală = cel mai sigur mod (minimizare date, fără transfer).
- Dacă se folosește AI extern: anonimizare obligatorie (înlocuire nume, CNP, adrese cu placeholders) + consimțământ explicit.
- Actualizare legislație: responsabilitatea utilizatorului de a verifica sursa oficială.
- Licență: codul poate fi open-source, dar conținutul legal este public (cu atribuire).

---

## 6. Structură de Fișiere Propusă (Proiect)

```
notariat-app/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── assets/
│   │   ├── knowledge/          # JSON cu articole, teorie
│   │   └── templates/          # Modele contracte
│   ├── components/
│   ├── modules/
│   │   ├── fileManager.ts
│   │   ├── parser.ts
│   │   ├── lawChecker.ts
│   │   ├── regenerator.ts
│   │   └── knowledgeBase.ts
│   ├── pages/
│   └── App.tsx
├── index.html
├── vite.config.ts
└── package.json
```

---

## 7. Următorii Pași Imediați

1. Confirmă stack-ul (React recomandat).
2. Începe cu un prototip minim al celor două opțiuni:
   - Opțiunea 1: selectare tip contract + formular simplu → generare text/DOCX → salvare locală
   - Opțiunea 2: upload text/DOCX → identificare tip + comparare cu un model → generare versiune corectată → salvare locală
3. Adaugă 1-2 modele de contract complete (ex. vânzare-cumpărare imobil).
4. Integrează un mecanism simplu de afișare a articolelor relevante din Codul Civil.
5. Testează pe telefon și desktop.

---

## 8. Resurse Utile

- File System Access API: https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
- browser-fs-access (fallback): https://github.com/GoogleChromeLabs/browser-fs-access
- Portal legislativ: https://legislatie.just.ro
- Parser existent (Python, poate inspira): https://github.com/pyl1b/legislatie-just-ro-parser
- **Instrumente gratuite recomandate (fără licențe, open-source):**
  - Site oficial: https://getartcraft.com
  - Organizație GitHub (cod sursă): **https://github.com/storytold**
  - PdfCraft: https://github.com/storytold/pdfcraft | https://getartcraft.com/apps/pdfcraft
  - WordCraft: https://github.com/storytold/wordcraft | https://getartcraft.com/apps
  - Apps directory: https://getartcraft.com/apps
  - Craft Launcher: https://github.com/storytold/craft-launcher

Se pot folosi direct din GitHub (clone, build from source, WebAssembly) dacă este nevoie de integrare custom.

---

**Notă finală:** Această aplicație este un instrument puternic de asistență pentru notar, nu un înlocuitor. Începe mic, validează cu utilizatori reali (notari), apoi extinde baza de cunoștințe și tipurile de acte.

Document creat pentru a servi ca ghid complet de construcție. Poate fi actualizat pe măsură ce proiectul avansează.
