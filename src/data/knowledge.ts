import type { Localized } from '@/domain/types';
import { LAW_CHECKED_ON, PORTAL, UNNPR } from '@/domain/types';

export interface KnowledgeEntry {
  id: string;
  title: Localized;
  citation: string;
  summary: Localized;
  body: string;
  url: string;
}

const civil = `${PORTAL}`;
const feesUrl = 'https://legislatie.just.ro/public/DetaliiDocument/278490';
const law36 = 'https://www.uniuneanotarilor.ro/files/legi/Lege_36_1995(0425).pdf';

export const knowledge: KnowledgeEntry[] = [
  {
    id: 'statut',
    title: {
      ro: 'Statutul notarului public',
      en: 'Status of the public notary',
      hu: 'A közjegyző jogállása',
    },
    citation: 'Legea nr. 36/1995, republicată în M. Of. nr. 237/19.03.2018',
    summary: {
      ro: 'Notarul este învestit de stat să îndeplinească un serviciu de interes public, în formă liberală, autonomă și imparțială.',
      en: 'The notary is vested by the state with a public service, exercised as a liberal, autonomous and impartial profession.',
      hu: 'A közjegyzőt az állam közszolgáltatásra hatalmazza fel, amelyet szabad, önálló és pártatlan hivatásként lát el.',
    },
    body: 'Activitatea notarială se îndeplinește de notari publici organizați în camere și în Uniunea Națională a Notarilor Publici din România. Actul autentificat de notar are forța probantă prevăzută de lege pentru înscrisul autentic. Notarul își verifică competența, identifică părțile, le explică actul și refuză întocmirea lui când lipsește consimțământul, capacitatea sau când obiectul este prohibit. Consolidarea UNNPR din 20 martie 2025 a Legii nr. 36/1995 cuprinde modificările prin Legile nr. 71/2019, 38/2020, 216/2022, 140/2022 și 301/2024. Orice act se confruntă, în ziua autentificării, cu forma de pe portalul legislativ.',
    url: law36,
  },
  {
    id: 'competenta-acte',
    title: {
      ro: 'Actele și procedurile notariale',
      en: 'Notarial acts and procedures',
      hu: 'Közjegyzői okiratok és eljárások',
    },
    citation: 'Legea nr. 36/1995, art. 12 și urm.',
    summary: {
      ro: 'Competența materială acoperă autentificarea, succesiunile, certificările, legalizările, data certă, depozitul și celelalte operațiuni date de lege.',
      en: 'Material competence covers authentication, successions, certifications, legalisations, certain date, deposit and the other operations assigned by law.',
      hu: 'Az anyagi hatáskör kiterjed a hitelesítésre, a hagyatéki eljárásra, az igazolásokra, a hitelesítési záradékokra, a keltezésre, a letétre és a törvény által adott egyéb eljárásokra.',
    },
    body: 'În numerotarea republicată, notarul redactează înscrisuri cu conținut juridic, autentifică înscrisuri, îndeplinește procedura succesorală notarială, certifică fapte, legalizează semnături, specimene de semnătură și sigilii, dă dată certă, primește înscrisuri în depozit, legalizează copii și traduceri, eliberează duplicate și îndeplinește celelalte operațiuni prevăzute de lege, între care divorțul prin acord, apostila și procedurile anume încredințate. Consultanța notarială nu înlocuiește judecata asupra propriei competențe.',
    url: law36,
  },
  {
    id: 'competenta-teritoriala',
    title: {
      ro: 'Competența teritorială',
      en: 'Territorial competence',
      hu: 'Területi illetékesség',
    },
    citation: 'Legea nr. 36/1995, art. 15',
    summary: {
      ro: 'Regula este competența generală. Succesiunea rămâne la notarul din circumscripția tribunalului ultimului domiciliu și numai la sediul biroului.',
      en: 'The rule is general competence. A succession stays with a notary in the tribunal district of the last domicile and is handled only at the office.',
      hu: 'A főszabály az általános illetékesség. A hagyaték az utolsó lakóhely törvényszéki körzetének közjegyzőjénél marad, és csak a hivatalban intézhető.',
    },
    body: 'Pentru cele mai multe acte, notarul are competență generală. Excepția practică de fiecare zi este procedura succesorală: ea aparține notarului din biroul aflat în circumscripția teritorială a tribunalului în care defunctul a avut ultimul domiciliu și se soluționează numai la sediul biroului. La moștenirile succesive, moștenitorii pot alege notarul competent pentru autorul decedat cel din urmă. Dacă ultimul domiciliu nu este în România, competența se determină după locul bunurilor, în ordinea prevăzută de lege. Conflictele de competență se soluționează de Colegiul director al Camerei, înăuntrul aceleiași curți de apel, sau de Biroul executiv al Consiliului Uniunii, între curți diferite.',
    url: law36,
  },
  {
    id: 'forma-autentica',
    title: {
      ro: 'Forma autentică cerută de lege',
      en: 'Authentic form required by law',
      hu: 'A törvény által megkövetelt közokirati forma',
    },
    citation: 'Codul civil, art. 1244, art. 1011, art. 2013, art. 330',
    summary: {
      ro: 'Drepturile care se înscriu în cartea funciară, donația, convenția matrimonială și mandatul pentru un act solemn cer formă autentică.',
      en: 'Rights to be entered in the land book, gifts, matrimonial agreements and a mandate for a solemn act require authentic form.',
      hu: 'A telekkönyvbe bejegyzendő jogok, az ajándékozás, a házassági vagyonjogi szerződés és az ünnepélyes jogcselekményre adott meghatalmazás közokirati formát igényel.',
    },
    body: 'Sub sancțiunea nulității absolute, actele juridice care strămută sau constituie drepturi reale ce trebuie înscrise în cartea funciară se încheie în formă autentică (art. 1244). Donația se încheie în formă autentică, sub aceeași sancțiune (art. 1011). Convenția matrimonială se încheie prin înscris autentic (art. 330). Mandatul dat pentru un act căruia legea îi cere formă autentică trebuie să respecte acea formă (art. 2013): procura pentru vânzarea unui imobil este autentică. Înscrierea în cartea funciară se face, între alte temeiuri, în baza înscrisului autentic notarial.',
    url: civil,
  },
  {
    id: 'vanzare',
    title: {
      ro: 'Vânzarea imobilului',
      en: 'Sale of immovable property',
      hu: 'Ingatlan adásvétele',
    },
    citation: 'Codul civil, art. 1650, art. 1672–1674, art. 1695; Codul fiscal, art. 111',
    summary: {
      ro: 'Vânzătorul transmite proprietatea, predă bunul și garantează contra evicțiunii și viciilor. La imobile, transferul față de terți trece prin cartea funciară.',
      en: 'The seller transfers ownership, delivers the asset and warrants against eviction and defects. Against third parties, immovables pass through the land book.',
      hu: 'Az eladó átruházza a tulajdont, átadja a dolgot, és szavatol a jogszavatosságért és a hibákért. Ingatlannál a harmadik személyekkel szembeni átszállás a telekkönyvön keresztül történik.',
    },
    body: 'Vânzarea este contractul prin care vânzătorul transmite sau se obligă să transmită cumpărătorului proprietatea unui bun în schimbul unui preț (art. 1650). Obligațiile principale ale vânzătorului sunt transmiterea dreptului, predarea și garanția contra evicțiunii și viciilor (art. 1672). Proprietatea se strămută de drept la încheierea contractului, dacă legea sau părțile nu amână transferul (art. 1674). Pentru imobile, opozabilitatea față de terți se realizează prin intabulare. Prețul trebuie să fie serios și determinat sau determinabil. Impozitul pe transferul din patrimoniul personal, de 3% sau 1%, se reține de notar și nu este onorariu.',
    url: civil,
  },
  {
    id: 'ipoteca-legala',
    title: {
      ro: 'Ipoteca legală a vânzătorului',
      en: 'The seller’s legal mortgage',
      hu: 'Az eladó törvényes jelzáloga',
    },
    citation: 'Codul civil, art. 2386 pct. 1',
    summary: {
      ro: 'Pentru prețul încă datorat, vânzătorul are ipotecă legală asupra imobilului vândut.',
      en: 'For the price still due, the seller has a legal mortgage over the immovable sold.',
      hu: 'A még járó vételárra az eladót törvényes jelzálog illeti az eladott ingatlanon.',
    },
    body: 'Art. 2386 pct. 1 din Codul civil dă vânzătorului ipotecă legală asupra bunului imobil vândut, pentru prețul datorat. Aceeași idee se aplică sultei la schimb sau la dare în plată. Ipoteca legală pentru preț nu este un credit bancar. Când prețul nu este plătit integral, intabularea dreptului cumpărătorului se face împreună cu ipoteca. Rangul rezultă din cererea de carte funciară. Suma și scadența se copiază din act, nu se presupun. Radierea se face după plata integrală, pe dovadă.',
    url: civil,
  },
  {
    id: 'impozit',
    title: {
      ro: 'Impozitul pe transferul imobilelor',
      en: 'Tax on immovable transfers',
      hu: 'Az ingatlanátruházás adója',
    },
    citation: 'Codul fiscal, art. 111, forma după OG nr. 16/2022',
    summary: {
      ro: '3% până la 3 ani inclusiv, 1% după 3 ani. Baza nu coboară sub studiul de piață. Succesiunea finalizată în 2 ani nu datorează 1%.',
      en: '3% up to and including 3 years, 1% after 3 years. The base is at least the market study. A succession finished within 2 years owes no 1% tax.',
      hu: '3% legfeljebb 3 évig, 1% 3 év után. Az alap nem lehet alacsonyabb a piaci tanulmánynál. A 2 éven belül lezárt hagyaték után nem jár az 1%.',
    },
    body: 'La transferul între vii al construcțiilor și al terenurilor din patrimoniul personal, contribuabilul datorează 3% dacă a deținut imobilul până la 3 ani inclusiv și 1% dacă l-a deținut mai mult de 3 ani. Ziua care împlinește exact 3 ani este încă în prima tranșă. Baza este valoarea declarată, dar nu mai puțin de valoarea minimă din studiul de piață folosit de cameră. Nu se scade creditul și nu se impozitează profitul, ci valoarea tranzacției. Scutirea veche de 450.000 lei nu mai există din 2023. Donația între soți sau între rude și afini până la gradul III inclusiv este scutită; vânzarea între aceleași persoane nu este scutită. Pentru moștenire, impozitul de 1% asupra activului net imobiliar apare numai dacă succesiunea nu este dezbătută și finalizată în 2 ani de la deces. Scutirea punctuală din Legea nr. 170/2026 s-a aplicat doar finalizărilor până la 30 septembrie 2026. De la 1 octombrie 2026 funcționează din nou termenul de 2 ani. Terenul agricol extravilan revândut înainte de 8 ani poate datora, separat, impozitul de 80% din diferența pozitivă de valoare, în condițiile Legii nr. 17/2014. Cota tranzitorie de TVA de 9% pentru anumite locuințe noi livrate de dezvoltatori, prelungită prin Legea nr. 161/2026 până la 30 septembrie 2026 inclusiv, nu este impozitul din art. 111. De la 1 octombrie 2026 aceste livrări obișnuite sunt la cota standard de 21% (Legea nr. 141/2025, art. 291).',
    url: civil,
  },
  {
    id: 'onorarii',
    title: {
      ro: 'Onorariile minimale',
      en: 'Minimum notarial fees',
      hu: 'Minimális közjegyzői díjak',
    },
    citation: 'OMJ nr. 177/C/2024, completat prin OMJ nr. 2864/C/2024',
    summary: {
      ro: 'Ministrul justiției stabilește onorariile minimale. Sub ele nu se coboară. TVA de 21% se adaugă doar dacă notarul este plătitor.',
      en: 'The Minister of Justice sets minimum fees. They are a floor. 21% VAT is added only if the notary is a VAT payer.',
      hu: 'Az igazságügy-miniszter állapítja meg a minimális díjakat. Ez alsó határ. A 21%-os áfát csak áfaalany közjegyző számítja fel.',
    },
    body: 'Normele aprobate prin Ordinul nr. 177/C/2024 sunt în vigoare din 26 ianuarie 2024. Ordinul nr. 2864/C/2024 a completat scutirile pentru actele distruse de o calamitate. Pentru imobile, anexa nr. 2 pct. I pornește de la 2,2%, dar nu mai puțin de 230 lei, și coboară procentual pe tranșe, până la 6.405 lei plus 0,6% peste 600.001 lei. Schimbul se calculează la valoarea cea mai mare și se majorează cu 35%. Succesiunea, anexa nr. 3, pornește de la 2,7%, dar nu mai puțin de 240 lei pe dosar, iar peste 65.001 lei este 1.205 lei plus 0,85%. Arhivarea din anexa nr. 2 este 25 lei pentru 10 ani și 45 lei pentru păstrare permanentă. Procurile de reprezentare din anexa nr. 1 pct. 5.1 au minimul de 100 lei, indiferent de numărul mandanților; procura pentru pensie, ajutor sau alocație are minimul de 8 lei. Dacă prin procură se constată că mandatarul a încasat prețul, onorariul poate părăsi suma fixă și se raportează la anexa nr. 2 pct. XIV, cu excepția mandatului de a contracta cu sine. Onorariile minimale nu includ TVA. Cota standard de TVA este 21% din 1 august 2025 și se aplică numai notarului înregistrat în scopuri de TVA. Impozitul și tarifele ANCPI nu sunt onorariu.',
    url: feesUrl,
  },
  {
    id: 'clase',
    title: {
      ro: 'Clasele de moștenitori și soțul',
      en: 'Classes of heirs and the spouse',
      hu: 'Az öröklési osztályok és a házastárs',
    },
    citation: 'Codul civil, art. 963–983 și art. 970–974',
    summary: {
      ro: 'Patru clase, în ordine. Soțul nu este într-o clasă: ia 1/4, 1/3, 1/2 sau 3/4, după cine vine cu el.',
      en: 'Four classes, in order. The spouse is in no class and takes 1/4, 1/3, 1/2 or 3/4 depending on who concurs.',
      hu: 'Négy osztály, sorrendben. A házastárs egyikben sincs: 1/4, 1/3, 1/2 vagy 3/4 illeti, aszerint, hogy kivel örököl együtt.',
    },
    body: 'Clasa I: descendenții. Clasa II: părinții și colateralii privilegiați, adică frații și descendenții lor până la gradul IV cu defunctul. Clasa III: ascendenții ordinari. Clasa IV: colateralii ordinari până la gradul IV. Clasa mai apropiată înlătură clasa mai îndepărtată. Soțul supraviețuitor moștenește dacă la data deschiderii nu există divorț definitiv. Cota lui este: o pătrime cu descendenții; o treime cu părinți și frați împreună; o jumătate numai cu părinți sau numai cu frați; trei pătrimi cu clasa III sau IV; întreaga moștenire dacă nu vine nicio rudă. În clasa a II-a, dacă vin și părinți și frați, un singur părinte ia un sfert din partea clasei, iar frații trei sferturi; ambii părinți iau împreună jumătate, frații cealaltă jumătate. Frații de linii diferite împart mai întâi jumătate liniei materne și jumătate liniei paterne; fratele bun culege pe ambele linii. Reprezentarea merge nelimitat în linie descendentă și la descendenții fraților, pentru predecedare și nedemnitate, nu pentru renunțare. Soțul mai are dreptul special la mobilierul de uz casnic (art. 974) și, în condițiile art. 973, un drept de abitație.',
    url: civil,
  },
  {
    id: 'rezerva',
    title: {
      ro: 'Rezerva și cotitatea disponibilă',
      en: 'Forced share and disposable portion',
      hu: 'Kötelesrész és szabad rendelkezés',
    },
    citation: 'Codul civil, art. 1086–1091',
    summary: {
      ro: 'Rezervatari sunt soțul, descendenții și părinții care vin efectiv. Rezerva fiecăruia este jumătate din cota legală.',
      en: 'Forced heirs are the spouse, descendants and parents who actually inherit. Each reserve is half of the legal share.',
      hu: 'Kötelesrészre jogosult a házastárs, a leszármazó és a szülő, ha ténylegesen örököl. A kötelesrész a törvényes hányad fele.',
    },
    body: 'Rezerva este partea la care moștenitorii rezervatari au dreptul chiar împotriva liberalităților și a dezmoștenirilor. Sunt rezervatari soțul supraviețuitor, descendenții și ascendenții privilegiați. Frații nu sunt rezervatari. Rezerva fiecăruia este jumătate din cota care i s-ar fi cuvenit ca moștenitor legal. Cotitatea disponibilă este restul. Depășirea ei duce la reducțiune. Calculul serios al reducțiunii se face pe masa de calcul, care adaugă donațiile raportabile, nu doar pe bunurile găsite la deces. Aplicația controlează aritmetic legatele introduse; nu înlocuiește raportul și imputația făcute de notar.',
    url: civil,
  },
  {
    id: 'optiune',
    title: {
      ro: 'Acceptarea, renunțarea și termenul de un an',
      en: 'Acceptance, renunciation and the one-year term',
      hu: 'Elfogadás, visszautasítás és az egyéves határidő',
    },
    citation: 'Codul civil, art. 1100–1124',
    summary: {
      ro: 'Opțiunea se exercită în un an. Renunțarea este numai autentică. După termen, cine a știut și a tăcut este prezumat renunțător.',
      en: 'The option is exercised within one year. Renunciation is authentic only. After the term, silence of a person who knew is presumed renunciation.',
      hu: 'A nyilatkozatot egy éven belül kell megtenni. A visszautasítás csak közokiratban érvényes. A határidő után azt, aki tudott róla és hallgatott, visszautasítónak vélelmezik.',
    },
    body: 'Dreptul de opțiune se exercită în termen de un an de la deschiderea moștenirii (art. 1103), cu prorogările legale. Acceptarea este expresă când succesibilul își însușește titlul prin înscris autentic sau sub semnătură privată (art. 1108). Acceptarea autentică se înscrie în registrul național notarial (art. 1109). Prin Decizia nr. 58/2024, ÎCCJ a stabilit că acceptarea expresă făcută de minorul lipsit de capacitate de exercițiu este act de dispoziție și cere încuviințarea instanței de tutelă. Renunțarea nu se presupune, în afara excepțiilor, și se face în formă autentică la orice notar public sau la oficiul consular (art. 1120). Se înscrie în registru pe cheltuiala renunțătorului. Renunțătorul este considerat că nu a fost niciodată moștenitor, iar partea lui profită celor pe care i-ar fi înlăturat (art. 1121). Este prezumat renunțător, până la proba contrară, succesibilul care a cunoscut deschiderea moștenirii și calitatea lui și nu a optat în termen (art. 1112).',
    url: civil,
  },
  {
    id: 'regim',
    title: {
      ro: 'Comunitatea și lichidarea înainte de moștenire',
      en: 'Community property and liquidation before the estate',
      hu: 'A közös vagyon és felszámolása az öröklés előtt',
    },
    citation: 'Codul civil, art. 339, art. 340 și art. 357',
    summary: {
      ro: 'Din bunul comun intră în masă numai partea defunctului. Jumătatea soțului supraviețuitor nu se moștenește, pentru că este a lui.',
      en: 'Only the deceased’s share of common property enters the estate. The survivor’s half is not inherited, because it is already theirs.',
      hu: 'A közös vagyonból csak az elhunyt része kerül a hagyatékba. A túlélő fele nem öröklés tárgya, mert az már az övé.',
    },
    body: 'Bunurile dobândite în timpul comunității legale sunt comune, în devălmășie. Bunurile proprii sunt cele de dinaintea căsătoriei, cele moștenite sau donate și cele pe care legea le califică astfel. La încetarea comunității prin deces, comunitatea se lichidează. Contribuția se prezumă egală, deci soțul supraviețuitor păstrează, de regulă, jumătate din fiecare bun comun. Numai cealaltă jumătate este masă succesorală și se împarte după cote. Peste această jumătate, soțul mai culege și cota sa de moștenitor. O contribuție inegală trebuie dovedită; aplicația o primește ca fracție introdusă de notar, nu o presupune.',
    url: civil,
  },
  {
    id: 'legea-17',
    title: {
      ro: 'Terenul agricol extravilan',
      en: 'Extra-urban agricultural land',
      hu: 'Külterületi mezőgazdasági föld',
    },
    citation: 'Legea nr. 17/2014',
    summary: {
      ro: 'Vânzarea cere procedura de preempțiune la primărie, avizele speciale și, pentru antecontractul care poate ține loc de vânzare, formă autentică.',
      en: 'A sale requires the pre-emption procedure at the town hall, special approvals and authentic form for a pre-contract that can stand as a sale.',
      hu: 'Az adásvételhez kell az elővásárlási eljárás a polgármesteri hivatalnál, a külön engedélyek, és a szerződést pótló előszerződéshez közokirati forma.',
    },
    body: 'Vânzarea terenului agricol situat în extravilan nu este liberă. Oferta se afișează la primărie, iar preemptorii au termenul prevăzut de lege, în regulă 30 de zile, ca să accepte la același preț și în aceleași condiții. Rangul preemptorilor se citește din forma consolidată a art. 4 și urm., pentru că ordinea a fost modificată de mai multe ori. Anumite terenuri din zona de frontieră, de lângă țărm sau de lângă obiective speciale cer avizul Ministerului Apărării, iar siturile arheologice cer avizul culturii. Antecontractul în baza căruia se cere o hotărâre care ține loc de contract trebuie să fie autentic și să respecte condițiile legii (art. 5). Controlul notarului poartă pe dosarul de preempțiune, pe categoria de folosință și pe eventualul impozit special de 80%.',
    url: `${PORTAL}`,
  },
  {
    id: 'carte-funciara',
    title: {
      ro: 'Cartea funciară și intabularea',
      en: 'The land book and registration',
      hu: 'A telekkönyv és a bejegyzés',
    },
    citation: 'Codul civil, art. 885 și urm.; Legea nr. 7/1996',
    summary: {
      ro: 'Între părți, actul autentic transmite. Față de terți, dreptul real imobiliar se constituie și se strămută prin înscriere, în condițiile legii.',
      en: 'Between the parties, the authentic act transfers. Against third parties, an immovable real right is created and transferred by registration, as the law provides.',
      hu: 'A felek között a közokirat ruház át. Harmadik személyekkel szemben az ingatlan dologi jog a törvény szerint bejegyzéssel keletkezik és száll át.',
    },
    body: 'Actul de înstrăinare descrie imobilul cu număr cadastral, număr de carte funciară și unitate administrativ-teritorială, după extrasul de carte funciară pentru autentificare. Notarul consemnează sarcinile, notările și discrepanțele dintre act și extras. Părțile consimt la intabulare. Tariful de publicitate imobiliară este tariful ANCPI în vigoare în ziua cererii și nu se confundă cu onorariul minimal. Extrasul pentru autentificare are termenul lui de valabilitate: un extras expirat nu se folosește.',
    url: civil,
  },
  {
    id: 'testament',
    title: {
      ro: 'Testamentul',
      en: 'Wills',
      hu: 'A végrendelet',
    },
    citation: 'Codul civil, art. 1034, art. 1040–1046',
    summary: {
      ro: 'Formele ordinare sunt olograful, scris integral de mână, și autentic, autentificat de notar. Testamentul mistic nu mai este formă ordinară.',
      en: 'The ordinary forms are the holographic will, written entirely by hand, and the authentic will. The secret will is no longer an ordinary form.',
      hu: 'A rendes formák a teljesen kézzel írt holográf végrendelet és a közjegyző által hitelesített végrendelet. A titkos végrendelet már nem rendes forma.',
    },
    body: 'Testamentul este actul unilateral, personal și revocabil prin care testatorul dispune pentru timpul când nu va mai fi în viață (art. 1034). Testamentul ordinar este olograf sau autentic (art. 1040). Olograful trebuie scris în întregime, datat și semnat de mâna testatorului, sub sancțiunea nulității absolute (art. 1041). Înainte de executare se prezintă notarului pentru deschidere și vizare spre neschimbare (art. 1042). Testamentul autentic este cel autentificat de notar sau de altă autoritate prevăzută de lege (art. 1043). Testatorul dictează dispozițiile sau aduce textul redactat; notarul îl scrie, i-l citește sau i-l dă să îl citească și menționează aceste formalități (art. 1044). Rezerva succesorală limitează liberalitățile. Revocarea expresă se poate face prin act autentic ulterior.',
    url: civil,
  },
];

export const knowledgeCheckedOn = LAW_CHECKED_ON;
export const knowledgeSources = { portal: PORTAL, unnpr: UNNPR, fees: feesUrl, law36 };
