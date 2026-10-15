import type { ActDocument, OfficeProfile } from '@/domain/types';
import { checkCnp } from '@/lib/cnp';
import { FIXED_FEES, withVat } from '@/lib/fees';
import { formatLei } from '@/lib/money';
import { buildDocument } from '@/modules/document';
import type { ProcedureModel } from '@/modules/sampleActs';

const DATE = '14 octombrie 2026';
const PLACE = 'municipiul Cluj-Napoca';
const PORTAL = 'https://legislatie.just.ro';
const LAW36 = 'https://www.uniuneanotarilor.ro';
const KEY = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];

function cnp(sex: number, yymmdd: string, county: string, order: string): string {
  const base = `${sex}${yymmdd}${county}${order}`;
  const digits = base.split('').map(Number);
  const sum = KEY.reduce((total, weight, index) => total + weight * digits[index], 0);
  const control = sum % 11 === 10 ? 1 : sum % 11;
  const value = `${base}${control}`;
  if (!checkCnp(value).valid) throw new Error(`CNP de exemplu invalid: ${value}`);
  return value;
}

const andrei = cnp(1, '750314', '12', '021');
const elena = cnp(2, '780622', '12', '022');
const radu = cnp(1, '800909', '12', '023');
const ioana = cnp(2, '520303', '12', '024');

function line(role: string, name: string, code: string, nr: string, domicile: string, civil: string): string {
  return `${role}: ${name}, CNP ${code}, C.I. seria CJ nr. ${nr}, domiciliat/domiciliată în ${domicile}, stare civilă: ${civil}.`;
}

function feeLine(id: string, office: OfficeProfile): string {
  const fee = FIXED_FEES.find((item) => item.id === id);
  if (!fee) return 'Onorariul se citește din norma în vigoare în ziua actului.';
  const vat = withVat(fee.onorariu, office.vatPayer);
  const tax = office.vatPayer
    ? ` TVA 21%: ${formatLei(vat.vat)}. Total cu TVA, fără arhivare: ${formatLei(vat.total)}.`
    : ' În fișa biroului, notarul nu este marcat plătitor de TVA.';
  return `Onorariu minimal: ${formatLei(fee.onorariu)}. Arhivare: ${formatLei(fee.arhivare)}.${tax} ${fee.sursa}`;
}

function project(
  office: OfficeProfile,
  title: string,
  kind: string,
  intro: string[],
  sections: { heading: string; paragraphs: string[] }[],
  citations: { label: string; url: string; note: string }[],
): ActDocument {
  return buildDocument({
    title,
    kind,
    office,
    intro,
    sections,
    closing: [
      'Părțile semnează numai în fața notarului, după ce actul le-a fost citit. Prezentul text este proiect de lucru. Nu are număr de încheiere și nu ține loc de semnătură.',
    ],
    citations,
  });
}

export const otherModels: ProcedureModel[] = [
  {
    kind: 'procedure',
    id: 'p01-declaratie',
    title: 'Declarație autentică — stare civilă',
    blurb: 'Fapt declarat de parte. Nu înlocuiește certificatul de stare civilă.',
    build: (office) =>
      project(
        office,
        'DECLARAȚIE',
        'declaratie',
        [`Încheiată în ${PLACE}, la ${DATE}.`],
        [
          {
            heading: 'I. Declarantul',
            paragraphs: [line('Declarant', 'Mureșan Andrei', andrei, '200001', 'Cluj-Napoca, strada Memorandumului nr. 28', 'necăsătorit')],
          },
          {
            heading: 'II. Declarația',
            paragraphs: [
              'Declar, sub sancțiunea prevăzută de lege pentru declarația neadevărată, că la data de 14 octombrie 2026 sunt necăsătorit.',
              'Nu prezint și nu mi se cere în acest proiect un certificat de stare civilă. Declarația nu ține loc de certificat și nu se opune unei mentiuni ulterioare din registrul de stare civilă.',
            ],
          },
        ],
        [
          { label: 'Legea nr. 36/1995, art. 12 lit. b)', url: LAW36, note: 'Autentificarea înscrisului cerut de parte.' },
          { label: 'Codul civil, proba stării civile', url: PORTAL, note: 'Starea civilă se dovedește cu actele de stare civilă. Declarația este doar ce spune partea.' },
        ],
      ),
  },
  {
    kind: 'procedure',
    id: 'p02-revocare-procura',
    title: 'Revocarea unei procuri',
    blurb: 'Mandantul revocă procura. Mandatarul și autoritatea la care a fost folosită trebuie înștiințați.',
    build: (office) =>
      project(
        office,
        'DECLARAȚIE DE REVOCARE A PROCURII',
        'revocare-procura',
        [`Încheiată în ${PLACE}, la ${DATE}.`],
        [
          {
            heading: 'I. Mandantul',
            paragraphs: [line('Mandant', 'Mureșan Andrei', andrei, '200001', 'Cluj-Napoca, strada Memorandumului nr. 28', 'necăsătorit')],
          },
          {
            heading: 'II. Procura revocată',
            paragraphs: [
              'Revoc în întregime procura specială autentificată la 3 martie 2026 de acest birou, prin care l-am împuternicit pe Popescu Radu, CNP ' +
                radu +
                ', să mă reprezinte la vânzarea apartamentului din Cluj-Napoca, strada Memorandumului nr. 28, ap. 12.',
              'De la autentificarea prezentei revocări, mandatarul nu mai poate face actul pentru care i-am dat procura. Revocarea i se aduce la cunoștință. Dacă procura a fost depusă la o autoritate sau la o bancă, i se aduce la cunoștință și acelei instituții.',
              'Onorariul revocării se citește din norma în vigoare în ziua actului. Proiectul nu stabilește o sumă care nu este înscrisă separat în anexa nr. 1.',
            ],
          },
        ],
        [
          { label: 'Codul civil, art. 2031', url: PORTAL, note: 'Mandatul încetează și prin revocarea mandantului.' },
          { label: 'Legea nr. 36/1995, art. 12 lit. b)', url: LAW36, note: 'Revocarea se autentifică.' },
        ],
      ),
  },
  {
    kind: 'procedure',
    id: 'p03-revocare-testament',
    title: 'Revocarea unui testament',
    blurb: 'Revocare expresă și totală. Onorariul minim este cel deja prevăzut pentru această declarație.',
    build: (office) =>
      project(
        office,
        'DECLARAȚIE DE REVOCARE A TESTAMENTULUI',
        'revocare-testament',
        [`Încheiată în ${PLACE}, la ${DATE}.`],
        [
          {
            heading: 'I. Testatorul',
            paragraphs: [line('Testator', 'Mureșan Andrei', andrei, '200001', 'Cluj-Napoca, strada Memorandumului nr. 28', 'necăsătorit')],
          },
          {
            heading: 'II. Revocarea',
            paragraphs: [
              'Revoc în întregime testamentul autentic întocmit la 12 mai 2020 la acest birou. Nu păstrez nicio dispoziție din acel testament.',
              'Un testament olograf anterior rămâne numai pentru dispozițiile pe care această revocare nu le atinge. În exemplu, revocarea este totală pentru testamentul autentic indicat. Nu declar că aș fi întocmit un testament nou.',
              feeLine('revocare-testament', office),
            ],
          },
        ],
        [
          { label: 'Codul civil, art. 1051', url: PORTAL, note: 'Revocarea expresă a testamentului se face în formă autentică sau printr-un testament ulterior.' },
          { label: 'OMJ nr. 177/C/2024, anexa nr. 1', url: PORTAL, note: 'Onorariul minimal al declarației de revocare a testamentului.' },
        ],
      ),
  },
  {
    kind: 'procedure',
    id: 'p04-partaj',
    title: 'Partaj voluntar — imobil',
    blurb: 'Doi comoștenitori ies din indiviziune. Onorariul de la anexa nr. 2 pct. III nu este calculat.',
    build: (office) =>
      project(
        office,
        'ACT DE PARTAJ VOLUNTAR',
        'partaj',
        [`Încheiat în ${PLACE}, la ${DATE}.`],
        [
          {
            heading: 'I. Copărtașii',
            paragraphs: [
              line('Copărtaș', 'Mureșan Andrei', andrei, '200001', 'Cluj-Napoca, strada Memorandumului nr. 28', 'necăsătorit'),
              line('Copărtaș', 'Ionescu Ioana', ioana, '200004', 'Cluj-Napoca, strada Horea nr. 10', 'necăsătorită'),
            ],
          },
          {
            heading: 'II. Masa și loturile',
            paragraphs: [
              'Bunul supus partajului este apartamentul cu două camere din Cluj-Napoca, strada Memorandumului nr. 28, ap. 12, înscris în cartea funciară nr. 345678 a municipiului Cluj-Napoca, număr cadastral 34567-C1, cu suprafața de 52,40 mp. Fiecare copărtaș deține cota de 1/2, dobândită prin moștenire.',
              'Lotul unic, format din întregul apartament, se atribuie lui Mureșan Andrei. Ionescu Ioana primește o sultă de 90.000 lei, convenită de părți în acest exemplu, plătibilă la autentificare prin virament.',
              'Partajul unui imobil se face în formă autentică. Înscrierea în cartea funciară se cere după autentificare. Proiectul nu inventează alți creditori și nu calculează onorariul de partaj din anexa nr. 2 pct. III. Notarul îl citește din norma deschisă în ziua actului. Impozitul datorat pentru sultă, dacă legea îl cere în acea zi, nu este calculat aici.',
            ],
          },
        ],
        [
          { label: 'Codul civil, art. 669 și art. 670', url: PORTAL, note: 'Ieșirea din indiviziune și partajul prin bună învoială.' },
          { label: 'Codul civil, art. 1244', url: PORTAL, note: 'Forma autentică pentru drepturile care se înscriu în cartea funciară.' },
        ],
      ),
  },
  {
    kind: 'procedure',
    id: 'p05-ipoteca',
    title: 'Ipotecă convențională imobiliară',
    blurb: 'Contract separat de vânzare. Rangul îl dă cartea funciară, nu proiectul.',
    build: (office) =>
      project(
        office,
        'CONTRACT DE IPOTECĂ CONVENȚIONALĂ',
        'ipoteca',
        [`Încheiat în ${PLACE}, la ${DATE}.`],
        [
          {
            heading: 'I. Părțile',
            paragraphs: [
              line('Debitor proprietar', 'Mureșan Andrei', andrei, '200001', 'Cluj-Napoca, strada Memorandumului nr. 28', 'necăsătorit'),
              line('Creditor', 'Popescu Elena-Maria', elena, '200002', 'Cluj-Napoca, strada Horea nr. 10', 'necăsătorită'),
            ],
          },
          {
            heading: 'II. Creanța și garanția',
            paragraphs: [
              'Debitorul datorează creditorului suma de 150.000 lei, primită ca împrumut fără dobândă, potrivit înțelegerii din acest exemplu, scadentă la 14 octombrie 2027.',
              'Pentru garantarea acestei sume și a cheltuielilor de recuperare prevăzute de lege, debitorul constituie ipotecă convențională de rangul pe care îl va da cartea funciară asupra apartamentului din Cluj-Napoca, strada Memorandumului nr. 28, ap. 12, carte funciară nr. 345678, număr cadastral 34567-C1.',
              'Imobilul este bun propriu al debitorului, care declară că nu este căsătorit. Ipoteca imobiliară convențională se încheie în formă autentică și se înscrie în cartea funciară. Proiectul nu alege rangul și nu îl confundă cu ipoteca legală a vânzătorului.',
              'Ipoteca se radiază după plata integrală, pe dovada plății. Onorariul nu este cel fix al procurii și nu este calculat aici pe o grilă pe care proiectul nu o reproduce.',
            ],
          },
        ],
        [
          { label: 'Codul civil, art. 2377', url: PORTAL, note: 'Ipoteca convențională imobiliară se constituie prin înscris autentic.' },
          { label: 'Codul civil, art. 2386', url: PORTAL, note: 'Ipoteca legală este altceva și nu se naște din acest contract.' },
        ],
      ),
  },
  {
    kind: 'procedure',
    id: 'p06-societate',
    title: 'Act constitutiv — societate cu răspundere limitată',
    blurb: 'Aport numai în bani, la minimul legal, fără aport în natură. Peste acest caz, onorariul nu mai este suma fixă.',
    build: (office) =>
      project(
        office,
        'ACT CONSTITUTIV AL UNEI SOCIETĂȚI CU RĂSPUNDERE LIMITATĂ',
        'societate',
        [`Încheiat în ${PLACE}, la ${DATE}.`],
        [
          {
            heading: 'I. Asociații',
            paragraphs: [
              line('Asociat', 'Mureșan Andrei', andrei, '200001', 'Cluj-Napoca, strada Memorandumului nr. 28', 'necăsătorit'),
              line('Asociat', 'Popescu Elena-Maria', elena, '200002', 'Cluj-Napoca, strada Horea nr. 10', 'necăsătorită'),
            ],
          },
          {
            heading: 'II. Societatea',
            paragraphs: [
              'Asociații constituie societatea cu răspundere limitată Exemplu Consult Cluj S.R.L., cu sediul în Cluj-Napoca, strada Memorandumului nr. 28, ap. 12.',
              'Capitalul social este în bani, la minimul legal în vigoare în ziua înregistrării, vărsat integral, fără aport în natură. Fiecare asociat deține 50% din părțile sociale. Activitatea din exemplu este consultanță pentru afaceri, cod CAEN 7022, și se confirmă în lista CAEN deschisă la registrul comerțului.',
              'Administrator este Mureșan Andrei, cu puteri depline de reprezentare, pentru un mandat de 4 ani. Durata societății este nedeterminată.',
              'Societatea există față de terți după înmatricularea la registrul comerțului. ' + feeLine('societate-numerar-minim', office) + ' Dacă apare aport în natură sau capitalul trece de minimul legal, suma fixă nu se aplică, iar grila valorică nu este calculată în acest proiect.',
            ],
          },
        ],
        [
          { label: 'Legea nr. 31/1990, societatea cu răspundere limitată', url: PORTAL, note: 'Actul constitutiv și înmatricularea.' },
          { label: 'OMJ nr. 177/C/2024, anexa nr. 1 pct. 2.1', url: PORTAL, note: 'Onorariul fix numai pentru aport în bani la minimul legal, fără natură.' },
        ],
      ),
  },
  {
    kind: 'procedure',
    id: 'p07-cesiune',
    title: 'Cesiune de părți sociale',
    blurb: 'Forma autentică este cerută de părți. Față de societate și de terți, cesiunea se înregistrează la registrul comerțului.',
    build: (office) =>
      project(
        office,
        'CONTRACT DE CESIUNE DE PĂRȚI SOCIALE',
        'cesiune',
        [`Încheiat în ${PLACE}, la ${DATE}.`],
        [
          {
            heading: 'I. Părțile',
            paragraphs: [
              line('Cedent', 'Mureșan Andrei', andrei, '200001', 'Cluj-Napoca, strada Memorandumului nr. 28', 'necăsătorit'),
              line('Cesionar', 'Popescu Elena-Maria', elena, '200002', 'Cluj-Napoca, strada Horea nr. 10', 'necăsătorită'),
            ],
          },
          {
            heading: 'II. Părțile sociale',
            paragraphs: [
              'Cedentul transmite cesionarului 50 de părți sociale din 100, adică 50% din capitalul social al societății Exemplu Consult Cluj S.R.L., J12/100/2024, CUI 49999999, la valoarea nominală înscrisă în actul constitutiv.',
              'Prețul cesiunii, convenit în exemplu, este 5.000 lei, plătit la autentificare prin virament. Cedentul declară că părțile nu sunt grevate de sarcini cunoscute lui.',
              'Părțile cer forma autentică. Cesiunea devine opozabilă societății și terților după înregistrarea la registrul comerțului, în condițiile Legii nr. 31/1990. Proiectul nu înlocuiește hotărârea asociaților și actul constitutiv actualizat, dacă legea sau actul constitutiv le cere.',
            ],
          },
        ],
        [
          { label: 'Legea nr. 31/1990, art. 202', url: PORTAL, note: 'Transmiterea părților sociale și înregistrarea.' },
          { label: 'Legea nr. 36/1995, art. 12 lit. b)', url: LAW36, note: 'Autentificarea cerută de părți.' },
        ],
      ),
  },
  {
    kind: 'procedure',
    id: 'p08-legalizare-semnatura',
    title: 'Legalizare de semnătură',
    blurb: 'Încheiere pe un înscris care nu cere formă autentică. Nu înlocuiește autentificarea.',
    build: (office) =>
      project(
        office,
        'ÎNCHEIERE DE LEGALIZARE DE SEMNĂTURĂ',
        'legalizare-semnatura',
        [`Întocmită în ${PLACE}, la ${DATE}, la sediul biroului.`],
        [
          {
            heading: 'Constatări',
            paragraphs: [
              line('Semnatar', 'Mureșan Andrei', andrei, '200001', 'Cluj-Napoca, strada Memorandumului nr. 28', 'necăsătorit'),
              'Partea a semnat în fața notarului înscrisul sub semnătură privată intitulat „Cerere către administrația fiscală”, un exemplar, neschimbat și lizibil.',
              'Legalizarea constată numai semnătura și identitatea. Nu autentifică conținutul și nu se face pe un act pentru care legea cere formă autentică spre a fi valabil.',
            ],
          },
        ],
        [{ label: 'Legea nr. 36/1995, art. 12 lit. e)', url: LAW36, note: 'Legalizarea semnăturilor, a specimenelor de semnătură și a sigiliilor.' }],
      ),
  },
  {
    kind: 'procedure',
    id: 'p09-data-certa',
    title: 'Dare de dată certă',
    blurb: 'Notarul constată prezentarea înscrisului. Nu răspunde pentru ce au scris părțile în el.',
    build: (office) =>
      project(
        office,
        'ÎNCHEIERE DE DARE DE DATĂ CERTĂ',
        'data-certa',
        [`Întocmită în ${PLACE}, la ${DATE}, ora 11:00, la sediul biroului.`],
        [
          {
            heading: 'Înscrisul prezentat',
            paragraphs: [
              'S-a prezentat un înscris sub semnătură privată, intitulat „Chitanță”, două file, nesuparificat, fără ștersături. Partea care l-a depus este Mureșan Andrei, CNP ' + andrei + '.',
              'Încheierea arată data prezentării și starea înscrisului. O copie rămâne în arhiva biroului. Notarul nu răspunde pentru cuprinsul înscrisului și verifică doar ca acesta să nu fie vădit contrar legii.',
            ],
          },
        ],
        [
          { label: 'Legea nr. 36/1995, art. 12 lit. f)', url: LAW36, note: 'Darea de dată certă înscrisurilor.' },
          { label: 'Codul civil, data certă a înscrisului sub semnătură privată', url: PORTAL, note: 'Data certă nu transformă înscrisul în act autentic.' },
        ],
      ),
  },
  {
    kind: 'procedure',
    id: 'p10-certificare-fapt',
    title: 'Certificarea prezentării unei persoane',
    blurb: 'Se certifică faptul prezentării și al identității, nu un drept.',
    build: (office) =>
      project(
        office,
        'ÎNCHEIERE DE CERTIFICARE A UNUI FAPT',
        'certificare-fapt',
        [`Întocmită în ${PLACE}, la ${DATE}, la sediul biroului.`],
        [
          {
            heading: 'Faptul certificat',
            paragraphs: [
              line('Persoana prezentată', 'Mureșan Andrei', andrei, '200001', 'Cluj-Napoca, strada Memorandumului nr. 28', 'necăsătorit'),
              'Certific faptul că această persoană s-a prezentat în persoană la sediul biroului la 14 octombrie 2026, ora 11:20, și că identitatea i-a fost constatată după cartea de identitate. Nu certific o creanță, o calitate de moștenitor sau cuprinsul unui înscris care nu mi-a fost prezentat.',
            ],
          },
        ],
        [{ label: 'Legea nr. 36/1995, art. 12 lit. d)', url: LAW36, note: 'Certificarea unor fapte, în cazurile prevăzute de lege.' }],
      ),
  },
  {
    kind: 'procedure',
    id: 'p11-copie',
    title: 'Copie legalizată',
    blurb: 'Copia este conformă cu originalul prezentat. Nu confirmă că originalul este adevărat.',
    build: (office) =>
      project(
        office,
        'ÎNCHEIERE DE LEGALIZARE A UNEI COPII',
        'copie-legalizata',
        [`Întocmită în ${PLACE}, la ${DATE}, la sediul biroului.`],
        [
          {
            heading: 'Colaționarea',
            paragraphs: [
              'S-a prezentat originalul certificatului de naștere al lui Mureșan Andrei, un file, eliberat de primăria exemplu. Copia anexată, de un file, a fost colaționată cu originalul și este conformă cu el.',
              'Legalizarea copiei nu autentifică faptul înscris în original și nu înlocuiește originalul acolo unde autoritatea îl cere.',
            ],
          },
        ],
        [{ label: 'Legea nr. 36/1995, art. 12 lit. i)', url: LAW36, note: 'Legalizarea copiilor de pe înscrisuri.' }],
      ),
  },
  {
    kind: 'procedure',
    id: 'p12-traducere',
    title: 'Legalizarea semnăturii traducătorului',
    blurb: 'Traducerea este făcută de un traducător autorizat. Notarul legalizează semnătura, nu cuprinsul actului străin.',
    build: (office) =>
      project(
        office,
        'ÎNCHEIERE DE LEGALIZARE A SEMNĂTURII TRADUCĂTORULUI',
        'traducere',
        [`Întocmită în ${PLACE}, la ${DATE}, la sediul biroului.`],
        [
          {
            heading: 'Traducerea',
            paragraphs: [
              'Traducătorul autorizat Popescu Elena-Maria, autorizația nr. 12345, a prezentat traducerea din limba engleză în limba română a unui certificat de naștere, două file, și a semnat-o în fața notarului.',
              'Se legalizează semnătura traducătorului. Notarul nu certifică prin această încheiere conținutul actului străin și nu ține loc de apostilă.',
            ],
          },
        ],
        [{ label: 'Legea nr. 36/1995, art. 12 lit. j)', url: LAW36, note: 'Efectuarea și legalizarea traducerilor.' }],
      ),
  },
  {
    kind: 'procedure',
    id: 'p13-depozit',
    title: 'Depozit de înscrisuri',
    blurb: 'Plic închis, neprevăzut la conținut. Se predă persoanei indicate de deponent.',
    build: (office) =>
      project(
        office,
        'ÎNCHEIERE DE PRIMIRE ÎN DEPOZIT',
        'depozit',
        [`Întocmită în ${PLACE}, la ${DATE}, ora 12:00, la sediul biroului.`],
        [
          {
            heading: 'Obiectul depozitului',
            paragraphs: [
              line('Deponent', 'Mureșan Andrei', andrei, '200001', 'Cluj-Napoca, strada Memorandumului nr. 28', 'necăsătorit'),
              'S-a primit un plic închis, de culoare albă, sigilat, purtând mențiunea „testament olograf”, nedesfăcut și neverificat la conținut. Plicul se păstrează în arhiva biroului și se eliberează numai lui Mureșan Andrei sau, după decesul lui, moștenitorilor care prezintă certificatul de moștenitor.',
              'Notarul primește în depozit numai ce poate păstra în siguranță la birou. Proiectul nu descrie bani sau bunuri care nu au fost predate.',
            ],
          },
        ],
        [{ label: 'Legea nr. 36/1995, art. 12 lit. g)', url: LAW36, note: 'Primirea în depozit a înscrisurilor și a documentelor.' }],
      ),
  },
  {
    kind: 'procedure',
    id: 'p14-duplicat',
    title: 'Duplicat al unui act al biroului',
    blurb: 'Numai de pe un act întocmit de același birou. Are aceeași putere ca originalul, cu mențiunea că este duplicat.',
    build: (office) =>
      project(
        office,
        'ÎNCHEIERE DE ELIBERARE A UNUI DUPLICAT',
        'duplicat',
        [`Întocmită în ${PLACE}, la ${DATE}, la sediul biroului.`],
        [
          {
            heading: 'Actul original',
            paragraphs: [
              'La cererea lui Mureșan Andrei, CNP ' +
                andrei +
                ', se eliberează duplicat de pe procura specială autentificată de acest birou la 3 martie 2026, aflată în arhiva lui.',
              'Duplicatul se eliberează numai de pe un act pe care l-a întocmit același notar. Poartă mențiunea „duplicat” și nu se eliberează de pe actul altui birou.',
            ],
          },
        ],
        [{ label: 'Legea nr. 36/1995, art. 12 lit. k)', url: LAW36, note: 'Duplicate de pe actele pe care le-a întocmit notarul.' }],
      ),
  },
  {
    kind: 'procedure',
    id: 'p15-divort',
    title: 'Divorț prin acord — fără copii minori',
    blurb: 'Art. 375 alin. (1). Certificatul nu se eliberează în ziua cererii. Soții au termen de reflecție.',
    build: (office) =>
      project(
        office,
        'CERERE ȘI CONSTATARE — DIVORȚ PRIN ACORDUL SOȚILOR',
        'divort',
        [`Proiect pentru procedura deschisă în ${PLACE}. Cererea exemplu este din ${DATE}.`],
        [
          {
            heading: 'I. Soții',
            paragraphs: [
              line('Soț', 'Ionescu Radu', radu, '200003', 'Cluj-Napoca, strada Observatorului nr. 6', 'căsătorit'),
              line('Soție', 'Ionescu Ioana', ioana, '200004', 'Cluj-Napoca, strada Observatorului nr. 6', 'căsătorită'),
              'Căsătoria a fost încheiată la 14 iunie 2014, la Serviciul de stare civilă Cluj-Napoca, actul de căsătorie nr. 900. Ultima locuință comună este în Cluj-Napoca. Competența notarului se verifică după locul căsătoriei sau după ultima locuință comună.',
            ],
          },
          {
            heading: 'II. Condițiile din exemplu',
            paragraphs: [
              'Soții cer împreună desfacerea căsătoriei prin acord. Declară că nu au copii minori, născuți din căsătorie, din afara căsătoriei sau adoptați, și că niciunul nu se află sub consiliere judiciară sau tutelă specială. Aceste declarații se confruntă cu actele de stare civilă.',
              'După divorț, soțul păstrează numele Ionescu, iar soția revine la numele dinaintea căsătoriei, Popescu. Bunurile comune nu se împart în această procedură.',
              'Notarul acordă termenul de reflecție de 30 de zile. Certificatul de divorț nu se eliberează în ziua cererii. La termen, soții se prezintă personal și arată dacă stăruie în divorț. Dacă nu mai sunt de acord, cererea nu se constată.',
              'Când există copii minori, notarul poate constata divorțul numai dacă soții se înțeleg asupra autorității părintești comune, a locuinței copiilor, a legăturilor cu părintele separat și a contribuției la cheltuieli, iar acordul nu este contrar interesului copilului. Acest proiect nu cuprinde o asemenea convenție și nu inventează o contribuție.',
            ],
          },
        ],
        [
          { label: 'Codul civil, art. 375 alin. (1)', url: PORTAL, note: 'Acordul soților și lipsa copiilor minori. Alineatul (2), pentru copiii minori, se citește în forma consolidată din ziua cererii.' },
          { label: 'Legea nr. 36/1995, procedura divorțului pe cale notarială', url: LAW36, note: 'Termenul de reflecție și certificatul de divorț.' },
        ],
      ),
  },
  {
    kind: 'procedure',
    id: 'p16-apostila',
    title: 'Cerere de apostilă către Cameră',
    blurb: 'Apostila pe actul notarial o aplică Camera Notarilor Publici, nu notarul care a instrumentat actul.',
    build: (office) =>
      project(
        office,
        'CERERE PENTRU APOSTILA UNUI ACT NOTARIAL',
        'apostila',
        [`Întocmită în ${PLACE}, la ${DATE}.`],
        [
          {
            heading: 'Ce se cere',
            paragraphs: [
              line('Solicitant', 'Mureșan Andrei', andrei, '200001', 'Cluj-Napoca, strada Memorandumului nr. 28', 'necăsătorit'),
              'Solicit ca procura specială autentificată de acest birou la 3 martie 2026 să fie înaintată Camerei Notarilor Publici în a cărei circumscripție funcționează biroul, pentru apostilă, fiind destinată folosirii în afara României.',
              'Apostila nu o emite și nu o semnează notarul instrumentator. O îndeplinește Camera, la sediul prevăzut de lege. Supralegalizarea, când este cerută în locul apostilei, urmează aceeași cale și apoi autoritatea competentă pentru treapta următoare.',
              'Un certificat de stare civilă, un act de instanță sau alt înscris care nu este act notarial nu se apostilează pe această cerere. Pentru acelea, partea se adresează autorității competente, prefectură sau instanță, după felul actului.',
            ],
          },
        ],
        [
          { label: 'Legea nr. 36/1995, procedura apostilei și supralegalizării actelor notariale', url: LAW36, note: 'Competența aparține Camerei, pentru actul notarial.' },
          { label: 'Convenția de la Haga din 5 octombrie 1961', url: 'https://www.hcch.net', note: 'Apostila înlocuiește supralegalizarea numai între statele părți și numai pentru actul pe care îl acoperă.' },
        ],
      ),
  },
];
