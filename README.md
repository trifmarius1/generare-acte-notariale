# Acte notariale — asistență locală

Aplicație pentru biroul notarial: proiecte de acte, verificare de structură și dezbaterea succesiunii legale. Totul rulează în browser. Actele, numele și numerele personale rămân pe calculatorul notarului. Nu există cont, server sau trimitere a textului către un serviciu extern.

**Instrument de asistență. Nu înlocuiește notarul.** Cotele, impozitul și onorariile urmează textele verificate la **14 octombrie 2026** și se confruntă cu forma consolidată din ziua actului, pe [legislatie.just.ro](https://legislatie.just.ro). Proiectele poartă mențiunea „PROIECT DE LUCRU — NU ESTE ÎNSCRIS AUTENTIC”.

Interfața este în română, engleză și maghiară. Actul generat rămâne în limba română.

## Pornire

În PowerShell, `npm` poate fi blocat de politica de execuție. Folosiți `npm.cmd`.

```powershell
npm.cmd install
npm.cmd run dev
```

Verificări:

```powershell
npm.cmd test
npm.cmd run build
```

Aplicația se deschide la adresa afișată de Vite, de regulă `http://localhost:5173`. Poate fi instalată ca aplicație (PWA). Setările biroului (nume, cameră, sediu, plătitor de TVA) se păstrează în browser. Proiectele stau în IndexedDB, pe același dispozitiv.

## Ce face

- **Act nou.** Modele pentru vânzarea de imobil, donație, procură, antecontract, întreținere, convenție matrimonială, testament autentic, acceptarea și renunțarea la moștenire. Export DOCX, copiere și salvare locală. Se pot păstra și modele proprii, cu câmpuri `{{nume}}`.
- **Verifică.** Citește un fișier `.txt`, `.docx` sau `.pdf` în browser, recunoaște tipul după structură și semnalează diacritice, CNP și citate prezente în baza locală.
- **Succesiune.** Cotele legale pe clase, soț, reprezentare, linii la frați, comunitate, rezervă, sultă, impozitul de 1% după doi ani și onorariul minimal al procedurii. Exemplul „soț și un copil” este marcat ca exemplu.
- **Calcule.** Impozit pe transfer (3% până la 3 ani inclusiv, 1% după), onorarii minimale pentru imobile și succesiune, sume fixe din anexa nr. 1. TVA 21% numai dacă este bifată. Impozitul special de 80% din Legea nr. 17/2014 se calculează numai când este cerut.
- **Legi.** Fișe scurte, cu trimiteri către portal, Ordinul nr. 177/C/2024 și consolidarea UNNPR a Legii nr. 36/1995.

## Ce nu face

- Nu autentifică, nu dă dată certă și nu ține loc de certificat de moștenitor.
- Nu inventează onorariul de partaj (anexa nr. 2 pct. III), grila bunurilor mobile sau suma de la anexa nr. 2 pct. XIV.
- Nu face raportul donațiilor și nici imputația completă a legatelor. Semnalează doar depășirea cotității disponibile.
- Nu este corector ortografic. Controlează câteva mărci de structură, diacritice evidente și cifra de control a CNP.
- Nu descarcă legea la fiecare deschidere. Data verificării este 14 octombrie 2026.
