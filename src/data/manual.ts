import type { ActDocument, LegalCitation, OfficeProfile } from '@/domain/types';
import { LAW_CHECKED_ON, PORTAL, UNNPR } from '@/domain/types';
import { buildDocument } from '@/modules/document';

const FEES = 'https://legislatie.just.ro/public/DetaliiDocument/278490';
const FEES_2864 = 'https://legislatie.just.ro/public/DetaliiDocument/293479';
const LAW36 = 'https://www.uniuneanotarilor.ro/files/legi/Lege_36_1995(0425).pdf';

export interface ManualChapter {
  id: string;
  kicker: string;
  title: string;
  paragraphs: string[];
  citations: LegalCitation[];
}

export const manualCheckedOn = LAW_CHECKED_ON;

export const manualChapters: ManualChapter[] = [
  {
    id: 'cum-se-citeste',
    kicker: 'Capitolul 1',
    title: 'Cum se citește acest manual',
    paragraphs: [
      'Manualul este un ghid de lucru pentru birou, scris în limba română, limba actelor. El urmărește modelele din aplicație: vânzare, donație, procură, antecontract, întreținere, convenție matrimonială, testament, acceptare, renunțare și dezbaterea succesiunii.',
      'Textele au fost confruntate la 14 octombrie 2026 cu forma publică a Codului civil, a Codului fiscal, a Legii nr. 36/1995 și a normelor de onorarii. În ziua autentificării, notarul deschide forma consolidată de pe legislatie.just.ro. Un articol citat aici nu se copiază orb dacă portalul arată o modificare ulterioară.',
      'Fișierele produse de aplicație poartă mențiunea de proiect de lucru. Ele nu sunt înscris autentic, nu au număr de autentificare și nu țin loc de semnătura părților. Datele din modele sunt exemple. Numele, CNP-ul, cartea funciară și sumele se înlocuiesc din dosarul real.',
    ],
    citations: [
      { label: 'Portalul Legislativ', url: PORTAL, note: 'Forma consolidată se citește în ziua actului.' },
      { label: 'Uniunea Națională a Notarilor Publici', url: UNNPR, note: 'Camerele și îndrumările de practică.' },
    ],
  },
  {
    id: 'notarul',
    kicker: 'Capitolul 2',
    title: 'Notarul public și competența',
    paragraphs: [
      'Notarul public îndeplinește un serviciu de interes public, în formă liberală, autonomă și imparțială. El identifică părțile, le explică efectele actului, verifică capacitatea și consimțământul și refuză întocmirea când obiectul este prohibit sau când lipsește o condiție cerută de lege.',
      'Pentru cele mai multe acte competența este generală. Procedura succesorală este excepția de fiecare zi: ea aparține notarului din biroul aflat în circumscripția teritorială a tribunalului ultimului domiciliu al defunctului și se soluționează numai la sediul biroului. Declarația de renunțare poate fi dată la orice notar, dar dezbaterea rămâne la notarul competent.',
      'La moștenirile succesive, moștenitorii pot alege notarul competent pentru autorul decedat cel din urmă. Dacă ultimul domiciliu nu este în România, competența se determină după locul bunurilor, în ordinea prevăzută de lege. Conflictul de competență se soluționează de organul Uniunii prevăzut de Lege, nu de aplicație.',
    ],
    citations: [
      { label: 'Legea nr. 36/1995, republicată', url: LAW36, note: 'Statutul notarului și competența, inclusiv art. 15 pentru succesiune.' },
    ],
  },
  {
    id: 'autentic',
    kicker: 'Capitolul 3',
    title: 'Înscrisul autentic și proiectul de lucru',
    paragraphs: [
      'Sub sancțiunea nulității absolute, trebuie încheiate în formă autentică convențiile care strămută sau constituie drepturi reale ce urmează a fi înscrise în cartea funciară, donațiile, convențiile matrimoniale și mandatul pentru încheierea unui act căruia legea îi cere formă autentică.',
      'Autentificarea are loc în fața notarului, după citirea actului și după declarația părții că acela este actul ei. Aplicația poate așeza capitolele, temeiurile și câmpurile. Numărul din registru, încheierea de autentificare și semnăturile se scriu numai în original.',
      'Când o poză sau o scanare este citită automat, textul obținut este o transcriere. Literele lipite, ștampilele și tabelele pot ieși greșit. Notarul compară transcrierea cu originalul înainte de a o folosi.',
    ],
    citations: [
      { label: 'Codul civil, art. 1244', url: PORTAL, note: 'Actele pentru care forma autentică este cerută ad validitatem.' },
      { label: 'Codul civil, art. 1011', url: PORTAL, note: 'Donația se încheie în formă autentică.' },
      { label: 'Codul civil, art. 2013', url: PORTAL, note: 'Mandatul pentru un act autentic se dă în forma cerută acelui act.' },
    ],
  },
  {
    id: 'vanzare',
    kicker: 'Capitolul 4',
    title: 'Vânzarea unui imobil',
    paragraphs: [
      'Vânzarea este consensuală: proprietatea se strămută de drept la încheierea contractului, dacă părțile nu au amânat transferul. Față de terți, dreptul se intabulează. Vânzătorul garantează pentru evicțiune în condițiile art. 1695 și răspunde pentru viciile ascunse potrivit legii.',
      'În act se scrie dacă bunul este propriu, comun sau cotă-parte. La bunul comun al soților, înstrăinarea se face de ambii soți, prezenți sau reprezentați prin procură autentică. Aplicația nu alege regimul dacă textul sau câmpul nu îl spun.',
      'Identificarea se confruntă cu extrasul de carte funciară pentru autentificare. Numărul cadastral, cartea funciară, suprafața și descrierea se copiază din extras, nu din memorie. Un extras expirat nu se folosește.',
    ],
    citations: [
      { label: 'Codul civil, art. 1650 și art. 1672', url: PORTAL, note: 'Vânzarea și prețul.' },
      { label: 'Codul civil, art. 1674', url: PORTAL, note: 'Strămutarea de drept a proprietății.' },
      { label: 'Codul civil, art. 1695', url: PORTAL, note: 'Garanția contra evicțiunii.' },
    ],
  },
  {
    id: 'pret-ipoteca',
    kicker: 'Capitolul 5',
    title: 'Prețul, plata și ipoteca legală',
    paragraphs: [
      'Prețul se scrie în cifre și în litere. Dacă plata este integrală, parțială sau din credit, actul o spune răspicat. Creditul bancar și ipoteca creditorului se autentifică pe grila lor. Ele nu se confundă cu ipoteca legală a vânzătorului.',
      'Art. 2386 pct. 1 dă vânzătorului ipotecă legală asupra imobilului vândut, pentru prețul încă datorat. Când prețul nu este plătit integral, intabularea dreptului cumpărătorului se face împreună cu această ipotecă. Suma, scadența și accesoriile se copiază din act. Dacă în original suma a fost ștearsă sau nu a fost citită, proiectul nu o inventează.',
      'Părțile pot amâna transferul până la plata integrală, cu publicitatea cerută de art. 1684. Dacă nu au scris această rezervă, regula de lucru rămâne art. 1674. Aplicația nu presupune rezervarea proprietății doar pentru că a rămas un rest.',
    ],
    citations: [
      { label: 'Codul civil, art. 2386 pct. 1', url: PORTAL, note: 'Ipoteca legală a vânzătorului pentru prețul datorat.' },
      { label: 'Codul civil, art. 1684', url: PORTAL, note: 'Rezerva proprietății până la plata prețului.' },
    ],
  },
  {
    id: 'impozit',
    kicker: 'Capitolul 6',
    title: 'Impozitul pe transfer și TVA',
    paragraphs: [
      'La transferul între vii al construcțiilor și al terenurilor din patrimoniul personal, contribuabilul datorează 3% dacă a deținut imobilul până la 3 ani inclusiv și 1% dacă l-a deținut mai mult de 3 ani. Ziua care împlinește exact 3 ani este încă în prima tranșă. Baza este valoarea declarată, dar nu mai puțin decât valoarea minimă din studiul de piață al camerei. Nu se scade creditul, comisionul sau prețul de cumpărare.',
      'Scutirea veche de 450.000 lei nu mai există din 2023. Donația între soți sau între rude și afini până la gradul III inclusiv este scutită. Vânzarea între aceleași persoane nu este scutită. Pentru moștenire, impozitul de 1% asupra activului net imobiliar apare numai dacă succesiunea nu este dezbătută și finalizată în doi ani de la deces. Scutirea punctuală din Legea nr. 170/2026 a acoperit doar finalizările până la 30 septembrie 2026 inclusiv, și numai dosarele al căror termen de doi ani se împlinea între 14 iulie și 30 septembrie 2026. La 14 octombrie 2026 acea fereastră este închisă.',
      'TVA nu este impozitul de la art. 111. Cota standard este 21% din 1 august 2025, prin Legea nr. 141/2025, la art. 291 din Codul fiscal. Ea se adaugă la onorariu numai dacă biroul este înregistrat în scopuri de TVA. Nu se pune pe impozit și nu se pune pe tariful ANCPI. Livrarea unei locuințe noi de către un dezvoltator este o operațiune de TVA, distinctă de impozitul reținut la vânzarea din patrimoniul personal. Cota tranzitorie de 9% pentru anumite locuințe, prelungită prin Legea nr. 161/2026, a încetat la 30 septembrie 2026. De la 1 octombrie 2026 regula obișnuită pentru aceste livrări este cota standard, iar condițiile rămase se citesc în factura și în contractul dezvoltatorului.',
    ],
    citations: [
      { label: 'Codul fiscal, art. 111', url: PORTAL, note: '3% până la 3 ani inclusiv, 1% după. Moștenirea finalizată în 2 ani nu datorează 1%.' },
      { label: 'Legea nr. 170/2026', url: PORTAL, note: 'Scutirea punctuală s-a oprit la finalizările din 30 septembrie 2026.' },
      { label: 'Codul fiscal, art. 291, Legea nr. 141/2025', url: PORTAL, note: 'Cota standard de TVA este 21% din 1 august 2025.' },
    ],
  },
  {
    id: 'antecontract',
    kicker: 'Capitolul 7',
    title: 'Promisiunea de vânzare și terenul extravilan',
    paragraphs: [
      'Promisiunea bilaterală obligă părțile să încheie vânzarea, dar nu transmite proprietatea și nu se intabulează ca vânzare. Avansul se impută asupra prețului dacă vânzarea se încheie. Neîncheierea din culpa unei părți se judecă pe avans și pe daune, potrivit clauzelor scrise și art. 1549. Proiectul nu fixează o penalitate pe care părțile nu au scris-o.',
      'Dacă se va cere instanței o hotărâre care ține loc de contract, art. 1279 pretinde ca promisiunea să îndeplinească condițiile de fond și de formă ale contractului promis. Pentru drepturile care se înscriu în cartea funciară, forma de lucru sigură este autentificarea.',
      'Terenul agricol situat în extravilan intră sub Legea nr. 17/2014. Art. 5 cere antecontract autentic și respectarea preempțiunii înainte de o hotărâre care să țină loc de contract. Vânzarea însăși se autentifică numai după procedura de preempțiune și avize. Lipsa dosarului oprește actul. Impozitul suplimentar de 80% la revânzarea înainte de 8 ani se calculează numai când notarul confirmă că terenul chiar intră în ipoteză. Aplicația nu îl pornește singură.',
    ],
    citations: [
      { label: 'Codul civil, art. 1279 și art. 1669', url: PORTAL, note: 'Promisiunea și hotărârea care ține loc de contract.' },
      { label: 'Legea nr. 17/2014, art. 5', url: PORTAL, note: 'Antecontractul privind terenul agricol extravilan se încheie în formă autentică.' },
    ],
  },
  {
    id: 'donatie',
    kicker: 'Capitolul 8',
    title: 'Donația',
    paragraphs: [
      'Donația este liberalitate. Se încheie în formă autentică, sub sancțiunea nulității absolute, iar donatarul acceptă în același act. Dacă se constată un preț, actul nu mai este donație și se recalifică.',
      'Donația intră în masa de calcul a rezervei și poate fi redusă dacă încalcă rezerva soțului, a descendenților sau a părinților. Între descendenți poate fi supusă raportului. Aplicația semnalează rezerva, dar nu face raportul complet al donațiilor anterioare și nu impută legatele pe cotele rezervatarilor.',
      'O sarcină care epuizează liberalitatea poate schimba natura actului. Scutirea fiscală se aplică numai când părțile sunt soți sau rude ori afini până la gradul III inclusiv și încadrarea este verificată. Simpla declarație neverificată nu este temei de scutire.',
    ],
    citations: [
      { label: 'Codul civil, art. 1011 și art. 1091', url: PORTAL, note: 'Forma autentică, liberalitatea și reducțiunea.' },
      { label: 'Codul fiscal, art. 111 alin. (2)', url: PORTAL, note: 'Scutirea donației între soți și între rude sau afini până la gradul III.' },
    ],
  },
  {
    id: 'intretinere',
    kicker: 'Capitolul 9',
    title: 'Contractul de întreținere',
    paragraphs: [
      'Prin întreținere se transmite un bun în schimbul unei obligații de a întreține, de regulă pe durata vieții creditorului și intuitu personae. Contractul nu este donație și nu ia scutirea donației dintre rude. Transmiterea imobilului datorează impozitul de 3% sau 1%, după data dobândirii și după valoarea avută în vedere de norme.',
      'În act se descrie în ce constă întreținerea: hrană, îngrijire, utilități sau altă prestație pe care părțile chiar au convenit-o. Un drept de abitație sau de uzufruct se constituie numai dacă este descris. Proiectul nu îl adaugă din oficiu.',
      'Neexecutarea poate duce la rezoluțiune, în condițiile legii și ale clauzelor. Până atunci, dreptul se intabulează pe numele debitorului, iar creditorul poate cere notarea sau o garanție dacă așa s-a convenit.',
    ],
    citations: [
      { label: 'Codul civil, art. 2254', url: PORTAL, note: 'Contractul de întreținere.' },
      { label: 'Codul fiscal, art. 111', url: PORTAL, note: 'Întreținerea nu este scutită ca donația între rude.' },
    ],
  },
  {
    id: 'procura',
    kicker: 'Capitolul 10',
    title: 'Procura',
    paragraphs: [
      'Mandatul pentru vânzare, donație, ipotecă sau alt act căruia legea îi cere formă autentică se dă el însuși în formă autentică. O procură sub semnătură privată nu ajunge. Mandatarul nu trebuie să fie de față la autentificarea procurii. El nu poate depăși limitele scrise.',
      'Procura specială descrie actul determinat. Procura dată numai pentru încasarea pensiei, a ajutorului, a alocației sau a unui drept dintr-o lege de protecție este o procură îngustă, cu onorariul ei propriu. Cele două nu se amestecă în același text.',
      'Onorariul minimal pentru procura de reprezentare este 100 lei, indiferent de numărul mandanților și al mandatarilor, plus arhivarea de 20 lei. Pentru pensie, ajutor sau alocație minimul este 8 lei, plus arhivarea de 20 lei. Când prin procură se constată că mandatarul încasează prețul, onorariul poate părăsi suma fixă și se raportează la anexa nr. 2 pct. XIV, cu excepția mandatului de a contracta cu sine. Cuantumul de la pct. XIV nu este înscris în aplicație. Notarul îl ia din norma deschisă în ziua actului.',
    ],
    citations: [
      { label: 'Codul civil, art. 2009 și art. 2013', url: PORTAL, note: 'Mandatul și forma procurii pentru un act autentic.' },
      { label: 'OMJ nr. 177/C/2024, anexa nr. 1 pct. 5', url: FEES, note: '100 lei pentru reprezentare și 8 lei pentru pensie sau alocație.' },
    ],
  },
  {
    id: 'conventie',
    kicker: 'Capitolul 11',
    title: 'Convenția matrimonială',
    paragraphs: [
      'Regimul matrimonial se alege sau se schimbă numai prin convenție autentică. O învoială sub semnătură privată nu schimbă regimul. Soții pot adopta separația de bunuri, comunitatea convențională sau pot reveni la comunitatea legală. Proiectul nu alege în locul lor.',
      'Față de soți, efectele curg de la data pe care au scris-o. Față de terți, convenția trebuie să fie opozabilă: se notează în registrul prevăzut de lege și, pentru imobile, în cartea funciară. Fără aceste formalități, soții nu o pot opune dobânditorilor de bună-credință.',
      'Lichidarea regimului anterior, dacă există bunuri comune, se face prin act separat sau printr-un capitol de lichidare, cu cotele și sultele scrise în cifre. Inventarul gol nu lichidează comunitatea. Minorul care se căsătorește și persoana ocrotită au nevoie de avizele prevăzute de lege.',
    ],
    citations: [
      { label: 'Codul civil, art. 330 și art. 329', url: PORTAL, note: 'Forma autentică și separația de bunuri.' },
      { label: 'Codul civil, art. 340 și art. 366', url: PORTAL, note: 'Bunurile comune și comunitatea convențională.' },
    ],
  },
  {
    id: 'testament',
    kicker: 'Capitolul 12',
    title: 'Testamentul autentic și rezerva',
    paragraphs: [
      'Testamentul autentic se dictează notarului sau este adus scris, apoi este citit testatorului, care declară că aceea este voința lui. El poate fi revocat oricând. Un testament olograf anterior rămâne pentru dispozițiile necontrare numai dacă nu este revocat expres. Proiectul nu presupune revocarea.',
      'La testamentul autentic obișnuit legea nu impune martori. Dacă testatorul cere asistența unuia sau a doi martori, ei nu sunt legatari și nu sunt rude în gradul prohibit cu notarul sau cu legatarii. Verificarea se face la autentificare.',
      'Soțul supraviețuitor, descendenții și părinții care chiar moștenesc sunt rezervatari. Rezerva fiecăruia este jumătate din cota legală. Cotitatea disponibilă este ce rămâne după rezerve. Legatele care o depășesc se reduc. Testamentul nu poate înlătura rezerva. Aplicația păstrează avertismentul, dar nu calculează reducțiunea pe un testament concret decât în fișa de succesiune, și acolo numai ca depășire a disponibilului, nu ca imputare completă.',
    ],
    citations: [
      { label: 'Codul civil, art. 1034 și art. 1043–1044', url: PORTAL, note: 'Testamentul și formalitățile testamentului autentic.' },
      { label: 'Codul civil, art. 1086–1088', url: PORTAL, note: 'Rezerva este jumătate din cota legală a fiecărui rezervatar.' },
    ],
  },
  {
    id: 'optiune',
    kicker: 'Capitolul 13',
    title: 'Acceptarea și renunțarea',
    paragraphs: [
      'Termenul de opțiune succesorală este de un an de la deschiderea moștenirii. Acceptarea pură și simplă este indivizibilă: moștenitorul nu poate lua bunurile și lăsa datoriile. Declarația autentică de acceptare se înscrie în registrul notarial. Ea nu stabilește cotele și nu ține loc de certificat de moștenitor.',
      'Acceptarea expresă a minorului lipsit de capacitate de exercițiu este act de dispoziție. Potrivit Deciziei ÎCCJ nr. 58/2024, nu se autentifică fără încuviințarea instanței de tutelă. Proiectul se oprește la această mențiune.',
      'Renunțarea se face în formă autentică, la orice notar public, și se înscrie în registru pe cheltuiala renunțătorului. Renunțătorul este considerat că nu a fost niciodată moștenitor. Copiii lui nu îl reprezintă ca urmare a renunțării. Reprezentarea se deschide la predeces și la nedemnitate, nu la renunțare. Dacă succesibilul a acceptat deja, renunțarea nu mai este deschisă.',
    ],
    citations: [
      { label: 'Codul civil, art. 1103 și art. 1108–1109', url: PORTAL, note: 'Termenul de un an și acceptarea expresă.' },
      { label: 'ÎCCJ, Decizia nr. 58/2024', url: PORTAL, note: 'Minorul fără capacitate are nevoie de încuviințarea instanței de tutelă.' },
      { label: 'Codul civil, art. 1120, art. 1121 și art. 967', url: PORTAL, note: 'Renunțarea nu deschide reprezentarea.' },
    ],
  },
  {
    id: 'clase',
    kicker: 'Capitolul 14',
    title: 'Cine moștenește',
    paragraphs: [
      'Moștenitorii legali vin în patru clase. Clasa mai apropiată îl înlătură pe cel din clasa următoare. Soțul supraviețuitor nu face parte din clase. El vine de fiecare dată când acceptă, alături de clasa chemată, cu cota lui.',
      'Cu descendenți, soțul culege un sfert, iar descendenții trei sferturi. Cu ascendenți privilegiați și colaterali privilegiați împreună, soțul culege o treime. Cu o singură dintre aceste două subclase, soțul culege jumătate. Cu moștenitori din clasa a III-a sau a IV-a, soțul culege trei sferturi. Dacă nu există alte rude chemate, soțul culege întreaga moștenire.',
      'Când vin amândoi părinții și frați, părinții împreună iau jumătate din partea clasei a II-a, iar frații cealaltă jumătate. Un singur părinte ia un sfert din partea clasei, iar colateralii privilegiați trei sferturi. Doi copii fără soț iau câte o jumătate. Doi nepoți care reprezintă un copil predecedat împart tulpina acelui copil. Fratele bun și fratele numai după un părinte nu iau la fel: linia se declară în fișă, nu se presupune.',
    ],
    citations: [
      { label: 'Codul civil, art. 963–983', url: PORTAL, note: 'Clasele de moștenitori.' },
      { label: 'Codul civil, art. 970–974 și art. 978', url: PORTAL, note: 'Cota soțului și împărțeala între părinți și frați.' },
      { label: 'Codul civil, art. 964–969', url: PORTAL, note: 'Reprezentarea pentru predeces și nedemnitate.' },
    ],
  },
  {
    id: 'masa',
    kicker: 'Capitolul 15',
    title: 'Masa succesorală',
    paragraphs: [
      'Înainte de cote se lichidează comunitatea. Din bunul comun intră în moștenire partea defunctului, de regulă o jumătate. Cealaltă jumătate rămâne soțului supraviețuitor și nu este cotă succesorală. Bunul propriu al soțului nu intră deloc. Bunul propriu al defunctului intră întreg.',
      'Mobilierul și obiectele de uz casnic care au servit folosinței comune a soților merg la soțul supraviețuitor care acceptă, pe deasupra cotei lui, în condițiile art. 974. Ele nu se adaugă la activul care se împarte. Dreptul de abitație al soțului care nu are altă locuință corespunzătoare, art. 973, este un drept distinct. El nu mărește și nu micșorează cota de moștenire. Aplicația îl menționează când în fișă s-a declarat că soțul nu are altă locuință. Nu decide ea dacă locuința există.',
      'Datoriile se scad pentru activul net. Datoria legată de un imobil micșorează și netul imobiliar folosit la impozit. Dacă nimeni nu vine la moștenire, succesiunea poate fi vacantă, în condițiile art. 1135 și următoarele. Pe un astfel de proiect nu se eliberează certificat de moștenitor. Numărul dosarului succesoral se ia din registrul biroului. Proiectul nu îl inventează.',
    ],
    citations: [
      { label: 'Codul civil, art. 339, art. 357 și art. 974', url: PORTAL, note: 'Comunitatea, lichidarea ei și bunurile de uz casnic.' },
      { label: 'Codul civil, art. 973 și art. 1135', url: PORTAL, note: 'Dreptul de abitație al soțului și succesiunea vacantă.' },
    ],
  },
  {
    id: 'onorarii',
    kicker: 'Capitolul 16',
    title: 'Onorariile minimale',
    paragraphs: [
      'Onorariile notariale minimale sunt cele din Ordinul ministrului justiției nr. 177/C/2024, publicat în Monitorul Oficial nr. 70 din 26 ianuarie 2024, completat prin Ordinul nr. 2864/C/2024, publicat în Monitorul Oficial nr. 19 din 13 ianuarie 2025. Completarea din 2024 a adăugat scutirea pentru reconstituirea actelor distruse de o calamitate și pentru copiile lor, la art. 27 alin. (1^1) și la anexa nr. 5 pct. I^1. Grilele procentuale nu au fost schimbate de acest ordin. Sub minim nu se coboară. Părțile pot conveni un onorariu mai mare.',
      'Pentru actele translative și pentru constituirea de drepturi reale asupra imobilelor, anexa nr. 2 pct. I pornește de la 2,2%, dar nu mai puțin de 230 lei până la 20.000 lei, apoi 440 lei plus 1,9% peste 20.001 lei, și continuă pe tranșe până la 6.405 lei plus 0,6% peste 600.001 lei. La 100.000 lei minimul este 1.729,99 lei. Schimbul se calculează la valoarea cea mai mare și se majorează cu 35%. Arhivarea pentru păstrare permanentă, la aceste acte, este 45 lei.',
      'Procedura succesorală, anexa nr. 3, pornește de la 2,7%, dar nu mai puțin de 240 lei pe dosar. Peste 65.001 lei minimul este 1.205 lei plus 0,85%. La un activ brut de 200.000 lei onorariul minimal este 2.352,49 lei, plus arhivarea de 45 lei. Valoarea de lucru nu coboară sub studiul de piață când norma o cere. Reducerile din anexa nr. 5 nu se cumulează: se aplică reducerea cea mai mare. Aplicația nu calculează lista lor. Tariful ANCPI se achită aparte, după tariful din ziua cererii, și nu este onorariu.',
    ],
    citations: [
      { label: 'OMJ nr. 177/C/2024', url: FEES, note: 'Normele de onorarii minimale, anexele nr. 1, 2 și 3.' },
      { label: 'OMJ nr. 2864/C/2024', url: FEES_2864, note: 'Scutirea pentru actele distruse de o calamitate. Grilele rămân cele din 2024.' },
    ],
  },
  {
    id: 'limite',
    kicker: 'Capitolul 17',
    title: 'Ce rămâne la notar',
    paragraphs: [
      'Aplicația nu înlocuiește judecata notarului. Ea nu stabilește capacitatea, nu verifică interdicțiile, nu citește cartea funciară în timp real și nu știe dacă un CNP aparține persoanei din fața lui. Controlul de CNP verifică numai cifra și data calendaristică, nu evidența populației.',
      'Nu sunt codificate: cuantumul de la anexa nr. 2 pct. XIV, tarifele ANCPI, reducerile concrete din anexa nr. 5, raportul donațiilor și imputarea completă a legatelor pe rezerve. Grilele de imobil și de succesiune care sunt codificate sunt minimele din anexele nr. 2 pct. I și II și din anexa nr. 3, verificate la 14 octombrie 2026.',
      'Un model descărcat se modifică în programul de text sau se reia din câmpurile aplicației, apoi se salvează din nou ca DOCX, pentru editare, sau ca PDF, pentru o copie de lucru. PDF-ul nu ține loc de originalul autentificat. Înainte de semnare se recitesc sumele, datele, cotele și articolul de lege pe portal.',
    ],
    citations: [
      { label: 'legislatie.just.ro', url: PORTAL, note: 'Confruntarea din ziua actului.' },
      { label: 'OMJ nr. 177/C/2024, anexa nr. 2 pct. XIV', url: FEES, note: 'Cuantumul pentru procura prin care se încasează prețul se citește din normă, nu din aplicație.' },
    ],
  },
];

export function manualDocument(office: OfficeProfile): ActDocument {
  return buildDocument({
    title: 'MANUAL DE LUCRU PENTRU ACTELE NOTARIALE',
    kind: 'manual',
    office,
    citations: manualChapters.flatMap((chapter) => chapter.citations),
    intro: [
      `Ghid de birou verificat la ${manualCheckedOn}. Nu este comentariu oficial și nu este înscris autentic.`,
      'Capitolele urmăresc modelele din aplicație. În ziua actului, forma consolidată de pe legislatie.just.ro prevalează.',
    ],
    sections: manualChapters.map((chapter) => ({
      heading: `${chapter.kicker}. ${chapter.title}`,
      paragraphs: chapter.paragraphs,
    })),
    closing: [
      'Modelele cu date de exemplu se înlocuiesc cu datele dosarului. Sumele care nu sunt în act nu se presupun.',
    ],
  });
}
