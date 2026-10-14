import type { ActTemplate, FieldDef, LegalCitation, Localized } from '@/domain/types';
import { PORTAL } from '@/domain/types';
import { amount, buildDocument, dateClause, field, identityClause, moneyClause, on, partyBlock } from './document';

const L = (ro: string, en: string, hu: string): Localized => ({ ro, en, hu });
const civil = PORTAL;
const fees = 'https://legislatie.just.ro/public/DetaliiDocument/278490';

const saleCitations: LegalCitation[] = [
  { label: 'Codul civil, art. 1244', url: civil, note: 'Formă autentică pentru drepturile care se înscriu în cartea funciară.' },
  { label: 'Codul civil, art. 1650 și art. 1672–1674', url: civil, note: 'Vânzarea, obligațiile vânzătorului și strămutarea proprietății.' },
  { label: 'Codul civil, art. 1695', url: civil, note: 'Garanția de drept contra evicțiunii.' },
  { label: 'Codul civil, art. 339 și art. 357', url: civil, note: 'Bunurile comune și lichidarea comunității.' },
  { label: 'Codul fiscal, art. 111', url: civil, note: 'Impozit 3% până la 3 ani inclusiv, 1% după 3 ani, bază cel puțin la studiul de piață.' },
  { label: 'OMJ nr. 177/C/2024, anexa nr. 2 pct. I', url: fees, note: 'Onorariu minimal pentru actul translativ asupra imobilului.' },
];

const mortgageCitation: LegalCitation = {
  label: 'Codul civil, art. 2386 pct. 1',
  url: civil,
  note: 'Vânzătorul are ipotecă legală asupra imobilului vândut, pentru prețul datorat.',
};

const party = (prefix: string, roleRo: string, roleEn: string, roleHu: string): FieldDef[] => {
  const g = L(roleRo, roleEn, roleHu);
  return [
    { key: `${prefix}Nume`, label: L('Nume și prenume', 'Full name', 'Név'), type: 'text', required: true, group: g },
    { key: `${prefix}Cnp`, label: L('CNP', 'Personal numeric code', 'Személyi szám'), type: 'text', required: true, group: g },
    { key: `${prefix}CiSerie`, label: L('Seria actului de identitate', 'Identity document series', 'A személyazonosító okmány sorozata'), type: 'text', required: true, group: g },
    { key: `${prefix}CiNr`, label: L('Numărul actului de identitate', 'Identity document number', 'A személyazonosító okmány száma'), type: 'text', required: true, group: g },
    { key: `${prefix}Domiciliu`, label: L('Domiciliu', 'Domicile', 'Lakóhely'), type: 'text', required: true, group: g },
    { key: `${prefix}Stare`, label: L('Stare civilă', 'Civil status', 'Családi állapot'), type: 'text', required: true, group: g },
  ];
};

const placeFields = (group: Localized): FieldDef[] => [
  { key: 'dataAct', label: L('Data proiectului', 'Draft date', 'A tervezet kelte'), type: 'date', required: true, group },
  { key: 'locAct', label: L('Locul întocmirii', 'Place of drawing up', 'Keltezési hely'), type: 'text', required: true, group },
];

const propertyFields = (group: Localized, price: boolean): FieldDef[] => [
  { key: 'imobil', label: L('Descrierea imobilului', 'Description of the property', 'Az ingatlan leírása'), type: 'textarea', required: true, group },
  { key: 'uat', label: L('UAT', 'Administrative unit', 'Közigazgatási egység'), type: 'text', required: true, group },
  { key: 'judet', label: L('Județul', 'County', 'Megye'), type: 'text', required: true, group },
  { key: 'cf', label: L('Carte funciară', 'Land book number', 'Telekkönyvi szám'), type: 'text', required: true, group },
  { key: 'cadastral', label: L('Număr cadastral', 'Cadastral number', 'Kataszteri szám'), type: 'text', required: true, group },
  { key: 'suprafata', label: L('Suprafața', 'Area', 'Terület'), type: 'text', required: true, group },
  ...(price
    ? [{ key: 'pret', label: L('Preț, în lei', 'Price, in lei', 'Vételár, lejben'), type: 'text' as const, required: true, group }]
    : []),
];

function markers(list: [string, string][]) {
  return list.map(([source, label]) => ({ pattern: new RegExp(source, 'i'), label }));
}

export const templates: ActTemplate[] = [
  {
    id: 'vanzare-imobil',
    title: L('Contract de vânzare — imobil', 'Sale contract — immovable', 'Adásvételi szerződés — ingatlan'),
    summary: L(
      'Transmite proprietatea unui imobil, cu preț, garanții, impozit și consimțământ la intabulare.',
      'Transfers an immovable, with price, warranties, tax and consent to registration.',
      'Ingatlan tulajdonát ruházza át, árral, szavatossággal, adóval és bejegyzési hozzájárulással.',
    ),
    category: L('Contracte', 'Contracts', 'Szerződések'),
    citations: saleCitations,
    markers: markers([
      ['v[âa]nz[ăa]tor', 'vânzătorul'],
      ['cump[ăa]r[ăa]tor', 'cumpărătorul'],
      ['pre[țt]', 'prețul'],
      ['carte(?:a)? funciar[ăa]|\\bcf\\b', 'cartea funciară'],
      ['evic[țt]iun', 'garanția contra evicțiunii'],
      ['intabul', 'consimțământul la intabulare'],
      ['1244', 'art. 1244'],
    ]),
    fields: [
      ...placeFields(L('Actul', 'The act', 'Az okirat')),
      ...party('v', 'Vânzător', 'Seller', 'Eladó'),
      {
        key: 'vRegim',
        label: L('Regimul bunului', 'How the asset is held', 'A vagyon jellege'),
        type: 'select',
        required: true,
        group: L('Vânzător', 'Seller', 'Eladó'),
        options: [
          { value: 'propriu', label: L('Bun propriu', 'Own property', 'Különvagyon') },
          { value: 'comun', label: L('Bun comun al soților', 'Common property of the spouses', 'A házasok közös vagyona') },
          { value: 'cota', label: L('Cotă-parte', 'Undivided share', 'Eszmei hányad') },
        ],
      },
      { key: 'vCota', label: L('Cota înstrăinată, dacă nu este întregul', 'Share sold, if not the whole', 'Az átruházott hányad, ha nem az egész'), type: 'text', group: L('Vânzător', 'Seller', 'Eladó') },
      ...party('c', 'Cumpărător', 'Buyer', 'Vevő'),
      ...propertyFields(L('Imobilul', 'The property', 'Az ingatlan'), true),
      {
        key: 'plata',
        label: L('Plata prețului', 'Payment of the price', 'Az ár megfizetése'),
        type: 'select',
        required: true,
        group: L('Prețul', 'Price', 'Vételár'),
        options: [
          { value: 'integral', label: L('Integral, la semnare', 'In full, on signing', 'Egészben, aláíráskor') },
          { value: 'partial', label: L('Parțial, rest de plată', 'In part, balance outstanding', 'Részben, fennmaradó árral') },
          { value: 'credit', label: L('Din credit', 'From a loan', 'Hitelből') },
        ],
      },
      { key: 'rest', label: L('Restul de plată sau creditul', 'Balance or loan', 'Fennmaradó ár vagy hitel'), type: 'textarea', group: L('Prețul', 'Price', 'Vételár') },
      { key: 'dobandire', label: L('Data dobândirii de către vânzător', 'Date the seller acquired it', 'Az eladó szerzésének napja'), type: 'date', required: true, group: L('Date fiscale', 'Tax', 'Adó') },
      { key: 'grila', label: L('Valoarea minimă din studiu, lei', 'Minimum market-study value, lei', 'Piaci minimum, lej'), type: 'text', group: L('Date fiscale', 'Tax', 'Adó') },
      { key: 'sarcini', label: L('Sarcini și notări', 'Encumbrances and notices', 'Terhek és feljegyzések'), type: 'textarea', group: L('Imobilul', 'The property', 'Az ingatlan') },
      { key: 'ipoteca', label: L('Ipotecă legală pentru prețul datorat', 'Legal mortgage for the price still due', 'Törvényes jelzálog a fennálló vételárra'), type: 'checkbox', group: L('Prețul', 'Price', 'Vételár') },
      { key: 'extravilan', label: L('Teren agricol extravilan — Legea nr. 17/2014', 'Extra-urban agricultural land — Law 17/2014', 'Külterületi mezőgazdasági föld — 17/2014. törvény'), type: 'checkbox', group: L('Imobilul', 'The property', 'Az ingatlan') },
      { key: 'observatii', label: L('Clauze convenite în plus', 'Further agreed clauses', 'További kikötések'), type: 'textarea', group: L('Clauze', 'Clauses', 'Kikötések') },
    ],
    generate: (values, office) => {
      const price = moneyClause(values, 'pret');
      const sellers = field(values, 'vNume');
      const buyers = field(values, 'cNume');
      const severalSellers = /\sși\s/i.test(sellers);
      const severalBuyers = /\sși\s/i.test(buyers);
      const regime = values.vRegim;
      const regimeText =
        regime === 'comun'
          ? severalSellers
            ? 'Vânzătorii declară că imobilul este bun comun, deținut în devălmășie sub regimul comunității legale, și că înstrăinarea se face de ambii soți.'
            : 'Vânzătorul declară că imobilul este bun comun, dobândit în timpul comunității legale, și că înstrăinarea se face cu acordul soțului, prezent la autentificare sau reprezentat prin procură autentică.'
          : regime === 'cota'
            ? `Vânzătorul declară că înstrăinează cota de ${field(values, 'vCota')}, nu întregul imobil.`
            : regime === 'propriu'
              ? 'Vânzătorul declară că imobilul este bun propriu și că nu face parte dintr-o comunitate de bunuri.'
              : 'Regimul bunului nu rezultă din datele proiectului. În original se va scrie dacă imobilul este bun propriu, bun comun sau cotă-parte. Până atunci, proiectul nu alege un regim.';
      return buildDocument({
        title: 'CONTRACT DE VÂNZARE',
        kind: 'vanzare-imobil',
        office,
        citations: on(values, 'ipoteca') ? [...saleCitations, mortgageCitation] : saleCitations,
        intro: [
          `Astăzi, ${dateClause(values, 'dataAct')}, în ${field(values, 'locAct')}, înaintea notarului public, s-au prezentat părțile de mai jos. Ele cer redactarea și, după verificarea condițiilor legale, autentificarea prezentului înscris.`,
          partyBlock(severalSellers ? 'Vânzătorii' : 'Vânzător', sellers, field(values, 'vCnp'), identityClause(values, 'v'), field(values, 'vDomiciliu'), field(values, 'vStare')),
          partyBlock(severalBuyers ? 'Cumpărătorii' : 'Cumpărător', buyers, field(values, 'cCnp'), identityClause(values, 'c'), field(values, 'cDomiciliu'), field(values, 'cStare')),
        ],
        sections: [
          {
            heading: 'Capitolul I — Obiectul',
            paragraphs: [
              `${severalSellers ? 'Vânzătorii vând' : 'Vânzătorul vinde'} ${severalBuyers ? 'cumpărătorilor, care cumpără' : 'cumpărătorului, care cumpără'}, imobilul: ${field(values, 'imobil')}.`,
              `Imobilul este înscris în cartea funciară nr. ${field(values, 'cf')} a UAT ${field(values, 'uat')}, județul ${field(values, 'judet')}, număr cadastral ${field(values, 'cadastral')}, suprafață ${field(values, 'suprafata')}.`,
              regimeText,
              'Identificarea din act se confruntă cu extrasul de carte funciară pentru autentificare, valabil la data semnării. Un extras expirat nu se folosește.',
              on(values, 'extravilan')
                ? 'Părțile declară că obiectul cuprinde teren agricol situat în extravilan. Vânzarea se autentifică numai după procedura de preempțiune și avizele cerute de Legea nr. 17/2014. Lipsa dosarului de preempțiune oprește actul.'
                : 'Dacă imobilul este teren agricol extravilan, prezenta clauză se înlocuiește cu verificarea Legii nr. 17/2014. Proiectul nu presupune că terenul este în intravilan.',
            ],
          },
          {
            heading: 'Capitolul II — Prețul',
            paragraphs: [
              `Prețul vânzării este de ${price}.`,
              ...(values.plata === 'partial'
                ? [
                    `Prețul nu este achitat integral astăzi. Restul: ${field(values, 'rest')}.`,
                    'Până la plata integrală, părțile convin expres dacă proprietatea se strămută de îndată, potrivit art. 1674, sau rămâne rezervată vânzătorului, potrivit art. 1684, cu îndeplinirea publicității.',
                  ]
                : values.plata === 'credit'
                  ? [
                      'Prețul se achită din credit.',
                      `Condițiile finanțării și eventuala ipotecă: ${field(values, 'rest')}.`,
                      'Ipoteca în favoarea creditorului se autentifică distinct sau în același act, pe grila de garanții, și se intabulează.',
                    ]
                  : [
                      values.plata === 'integral'
                        ? 'Cumpărătorul achită prețul integral la autentificare, în forma care lasă urmă (virament sau instrument care poate fi arătat băncii și fiscului). Vânzătorul va confirma încasarea în actul definitiv, nu în acest proiect.'
                        : 'Modul de plată nu rezultă din datele proiectului. În original se va scrie dacă prețul se achită integral la autentificare, parțial sau din credit. Proiectul nu presupune încasarea.',
                    ]),
              'Prețul este serios și determinat. Părțile cunosc că un preț derizoriu sau o simulație pot atrage recalificarea actului.',
            ],
          },
          ...(on(values, 'ipoteca')
            ? [
                {
                  heading: 'Capitolul II bis — Ipoteca legală pentru prețul datorat',
                  paragraphs: [
                    'Pentru prețul care rămâne datorat, vânzătorul beneficiază de ipotecă legală asupra imobilului vândut, potrivit art. 2386 pct. 1 din Codul civil. Ipoteca garantează prețul datorat. Nu se confundă cu o ipotecă bancară, dacă părțile nu au constituit și una convențională.',
                    `Suma, scadența și accesorile: ${field(values, 'rest')}.`,
                    'Când prețul nu este plătit integral, dreptul cumpărătorului se intabulează odată cu ipoteca legală. Rangul este cel rezultat din cererea depusă la cartea funciară. Proiectul nu inventează suma care nu este scrisă în act.',
                    'Ipoteca se radiază după plata integrală, pe dovada plății, în condițiile legii și ale clauzelor din original.',
                  ],
                },
              ]
            : []),
          {
            heading: 'Capitolul III — Strămutarea, predarea și garanția',
            paragraphs: [
              'În temeiul art. 1674 din Codul civil, proprietatea se strămută de drept cumpărătorului la autentificare, dacă părțile nu au amânat-o. Față de terți, dreptul se intabulează.',
              'Predarea se face la autentificare, liberă de persoane și de lucruri, dacă nu s-a scris altfel. Riscul trece odată cu predarea, iar fructele urmează proprietatea.',
              'Vânzătorul garantează de drept contra evicțiunii care ar împiedica stăpânirea, total sau parțial, când dreptul terțului s-a născut înainte de vânzare și nu a fost adus la cunoștința cumpărătorului (art. 1695). Garantează și contra viciilor ascunse, în condițiile legii.',
              `Sarcini și notări declarate: ${field(values, 'sarcini', 'nu au fost declarate sarcini; extrasul de carte funciară se anexează și prevalează')}.`,
            ],
          },
          {
            heading: 'Capitolul IV — Fiscal și carte funciară',
            paragraphs: [
              `Vânzătorul declară că a dobândit imobilul la ${dateClause(values, 'dobandire')}. Impozitul prevăzut de art. 111 din Codul fiscal se calculează la valoarea din act, dar nu sub valoarea din studiul de piață${amount(values, 'grila') ? ` (valoare de lucru introdusă: ${moneyClause(values, 'grila')})` : ''}. Cota este 3% pentru deținerea de până la 3 ani inclusiv și 1% pentru deținerea mai mare de 3 ani. Notarul îl reține și îl virează. Impozitul nu este onorariu și nu se reduce cu creditul sau cu cheltuielile.`,
              'Cumpărătorul se obligă să declare imobilul la organul fiscal local în termenul legal.',
              'Părțile consimt la intabularea dreptului de proprietate pe numele cumpărătorului și împuternicesc biroul notarial să depună cererea la oficiul de cadastru. Tariful ANCPI se achită aparte, după tariful în vigoare în ziua cererii.',
            ],
          },
          {
            heading: 'Capitolul V — Declarații',
            paragraphs: [
              'Părțile declară că au citit actul, că îl înțeleg, că consimt liber și că nu există viciu de consimțământ pe care să-l invoce acum. Declară că nu se află în vreun caz de incapacitate și că nu există o hotărâre care să le îngrădească dreptul de a dispune.',
              'Cheltuielile autentificării se suportă potrivit înțelegerii părților și, în lipsă, potrivit uzanței: onorariul de autentificare și intabularea, de cumpărător; impozitul pe transfer și extrasul pentru autentificare, de vânzător. Onorariul nu poate coborî sub minimul din OMJ nr. 177/C/2024.',
              values.observatii?.trim()
                ? `Clauze convenite: ${values.observatii.trim()}.`
                : 'Nu au fost convenite alte clauze.',
            ],
          },
        ],
        closing: [
          'Drept pentru care s-a încheiat prezentul înscris, în numărul de exemplare cerut de lege și de oficiul de cadastru, dintre care unul se păstrează în arhiva biroului.',
          'Acest fișier este proiect. Numărul de autentificare, încheierea și semnăturile se scriu numai în original, după identificarea părților.',
        ],
      });
    },
  },
  {
    id: 'donatie-imobil',
    title: L('Contract de donație — imobil', 'Gift — immovable', 'Ajándékozás — ingatlan'),
    summary: L(
      'Liberalitate autentică, cu acceptare, rezervă succesorală și scutirea dintre rude apropiate.',
      'Authentic gift, with acceptance, forced heirship and the close-family exemption.',
      'Közokirati ajándék, elfogadással, kötelesrésszel és a közeli hozzátartozói mentességgel.',
    ),
    category: L('Contracte', 'Contracts', 'Szerződések'),
    citations: [
      { label: 'Codul civil, art. 1011', url: civil, note: 'Donația se încheie în formă autentică, sub sancțiunea nulității absolute.' },
      { label: 'Codul civil, art. 985 și urm. și art. 1091', url: civil, note: 'Donația este liberalitate și poate fi raportată sau redusă.' },
      { label: 'Codul fiscal, art. 111 alin. (2)', url: civil, note: 'Scutire la donația între soți și între rude sau afini până la gradul III inclusiv.' },
    ],
    markers: markers([
      ['donat', 'donatorul sau donatarul'],
      ['accept', 'acceptarea donației'],
      ['1011', 'art. 1011'],
      ['carte(?:a)? funciar[ăa]|\\bcf\\b', 'cartea funciară'],
    ]),
    fields: [
      ...placeFields(L('Actul', 'The act', 'Az okirat')),
      ...party('d', 'Donator', 'Donor', 'Ajándékozó'),
      ...party('b', 'Donatar', 'Donee', 'Megajándékozott'),
      {
        key: 'grad',
        label: L('Legătura dintre părți', 'Relationship', 'A felek kapcsolata'),
        type: 'select',
        required: true,
        group: L('Date fiscale', 'Tax', 'Adó'),
        options: [
          { value: 'scutit', label: L('Soți sau rude/afini până la gradul III', 'Spouses or relatives and in-laws up to the third degree', 'Házastársak, illetve legfeljebb harmadfokú rokonok és sógorok') },
          { value: 'impozabil', label: L('Altă persoană — transfer impozabil', 'Another person — taxable transfer', 'Más személy — adóköteles átruházás') },
        ],
      },
      ...propertyFields(L('Imobilul', 'The property', 'Az ingatlan'), false),
      { key: 'sarcini', label: L('Sarcina donației, dacă există', 'Charge, if any', 'Teher, ha van'), type: 'textarea', group: L('Clauze', 'Clauses', 'Kikötések') },
    ],
    generate: (values, office) =>
      buildDocument({
        title: 'CONTRACT DE DONAȚIE',
        kind: 'donatie-imobil',
        office,
        citations: citationsFor('donatie-imobil'),
        intro: [
          `Astăzi, ${dateClause(values, 'dataAct')}, în ${field(values, 'locAct')}.`,
          partyBlock('Donator', field(values, 'dNume'), field(values, 'dCnp'), identityClause(values, 'd'), field(values, 'dDomiciliu'), field(values, 'dStare')),
          partyBlock('Donatar', field(values, 'bNume'), field(values, 'bCnp'), identityClause(values, 'b'), field(values, 'bDomiciliu'), field(values, 'bStare')),
        ],
        sections: [
          {
            heading: 'Capitolul I — Liberalitatea',
            paragraphs: [
              `Donatorul dăruiește donatarului, care acceptă în același act, imobilul: ${field(values, 'imobil')}.`,
              `Imobilul este înscris în cartea funciară nr. ${field(values, 'cf')} a UAT ${field(values, 'uat')}, județul ${field(values, 'judet')}, număr cadastral ${field(values, 'cadastral')}, suprafață ${field(values, 'suprafata')}.`,
              'Donația se încheie în formă autentică, sub sancțiunea nulității absolute (art. 1011). Acceptarea este expresă și contemporană cu oferta.',
              'Actul este cu titlu gratuit. Dacă se constată un preț, actul nu mai este donație și se recalifică.',
            ],
          },
          {
            heading: 'Capitolul II — Rezervă, raport și sarcini',
            paragraphs: [
              'Donatorul este înștiințat că donația se adaugă la masa de calcul a rezervei și poate fi redusă dacă încalcă rezerva soțului, a descendenților sau a părinților (art. 1086–1091). Între descendenți poate fi și supusă raportului.',
              `Sarcina convenită: ${field(values, 'sarcini', 'donația este pură și simplă')}.`,
              'O sarcină care epuizează liberalitatea poate schimba natura actului.',
              'Donatorul declară că bunul este proprietatea lui, liber de sarcini nedenunțate, și garantează pentru evicțiune în limitele legii. Dreptul se intabulează pe numele donatarului.',
            ],
          },
          {
            heading: 'Capitolul III — Impozit',
            paragraphs: [
              values.grad === 'scutit'
                ? 'Părțile declară că sunt soți sau rude ori afini până la gradul III inclusiv. În această limită, art. 111 alin. (2) din Codul fiscal scutește dobândirea prin donație. Scutirea nu se întinde asupra unei vânzări ulterioare.'
                : values.grad === 'impozabil'
                  ? 'Părțile declară că nu sunt în cazul de scutire. Transferul poate datora impozitul de la art. 111, pe regulile deținerii și ale studiului de piață. Notarul nu aplică scutirea pe simpla declarație neverificată.'
                  : 'Legătura dintre părți nu a fost stabilită în proiect. Art. 111 alin. (2) din Codul fiscal scutește donația între soți și între rude sau afini până la gradul III inclusiv. Fără această încadrare, notarul nu aplică și nu refuză scutirea.',
            ],
          },
        ],
        closing: ['Proiect pentru autentificare. Acceptarea minorului lipsit de capacitate de exercițiu cere încuviințarea instanței de tutelă.'],
      }),
  },
  {
    id: 'procura',
    title: L('Procură autentică', 'Authentic power of attorney', 'Közokirati meghatalmazás'),
    summary: L(
      'Mandat de reprezentare. Pentru un act solemn, procura însăși este autentică.',
      'Mandate of representation. For a solemn act, the power itself is authentic.',
      'Képviseleti meghatalmazás. Ünnepélyes jogcselekményhez maga a meghatalmazás is közokirat.',
    ),
    category: L('Mandate', 'Mandates', 'Meghatalmazások'),
    citations: [
      { label: 'Codul civil, art. 2009 și art. 2013', url: civil, note: 'Mandatul pentru un act autentic se dă în forma cerută acelui act.' },
      { label: 'OMJ nr. 177/C/2024, anexa nr. 1 pct. 5', url: fees, note: 'Minimul este 100 lei pentru procura de reprezentare și 8 lei pentru pensie sau alocație.' },
    ],
    markers: markers([
      ['mandant', 'mandantul'],
      ['mandatar', 'mandatarul'],
      ['2013|procur', 'temeiul procurii'],
    ]),
    fields: [
      ...placeFields(L('Actul', 'The act', 'Az okirat')),
      ...party('m', 'Mandant', 'Principal', 'Meghatalmazó'),
      { key: 'tNume', label: L('Numele mandatarului', 'Name of the attorney', 'A meghatalmazott neve'), type: 'text', required: true, group: L('Mandatar', 'Attorney', 'Meghatalmazott') },
      { key: 'tCnp', label: L('CNP mandatar', 'Attorney personal code', 'A meghatalmazott személyi száma'), type: 'text', required: true, group: L('Mandatar', 'Attorney', 'Meghatalmazott') },
      { key: 'tDomiciliu', label: L('Domiciliul mandatarului', 'Attorney domicile', 'A meghatalmazott lakóhelye'), type: 'text', required: true, group: L('Mandatar', 'Attorney', 'Meghatalmazott') },
      {
        key: 'fel',
        label: L('Felul procurii', 'Kind of power', 'A meghatalmazás fajtája'),
        type: 'select',
        required: true,
        group: L('Obiect', 'Object', 'Tárgy'),
        options: [
          { value: 'speciala', label: L('Specială, pentru un act determinat', 'Special, for a defined act', 'Különleges, meghatározott ügyre') },
          { value: 'pensie', label: L('Numai pensie, ajutor sau alocație', 'Pension, benefit or allowance only', 'Csak nyugdíj, segély vagy pótlék') },
        ],
      },
      { key: 'obiect', label: L('Împuternicirea, cu limite', 'Authority, with limits', 'A felhatalmazás, korlátokkal'), type: 'textarea', required: true, group: L('Obiect', 'Object', 'Tárgy') },
      { key: 'durata', label: L('Durata', 'Duration', 'Időtartam'), type: 'text', group: L('Obiect', 'Object', 'Tárgy') },
      { key: 'pret', label: L('Prin procură se încasează prețul', 'The attorney collects the price', 'A meghatalmazott átveszi az árat'), type: 'checkbox', group: L('Obiect', 'Object', 'Tárgy') },
    ],
    generate: (values, office) =>
      buildDocument({
        title: 'PROCURĂ',
        kind: 'procura',
        office,
        citations: citationsFor('procura'),
        intro: [
          `Astăzi, ${dateClause(values, 'dataAct')}, în ${field(values, 'locAct')}.`,
          partyBlock('Mandant', field(values, 'mNume'), field(values, 'mCnp'), identityClause(values, 'm'), field(values, 'mDomiciliu'), field(values, 'mStare')),
          `Mandatar: ${field(values, 'tNume')}, CNP ${field(values, 'tCnp')}, domiciliat în ${field(values, 'tDomiciliu')}.`,
          'Mandatarul nu trebuie să fie de față la autentificare.',
        ],
        sections: [
          {
            heading: 'Împuternicirea',
            paragraphs: [
              `Mandantul împuternicește pe mandatar să: ${field(values, 'obiect')}.`,
              'Mandatul este cu titlu gratuit, dacă nu s-a scris un onorariu între ei. Mandatarul nu poate depăși limitele scrise aici.',
              'Pentru vânzarea, donația, ipoteca sau un alt act căruia legea îi cere formă autentică, prezenta procură se autentifică (art. 2013). O procură sub semnătură privată nu ajunge.',
              `Durata: ${field(values, 'durata', 'până la îndeplinirea actului sau până la revocare')}. Revocarea se aduce la cunoștința mandatarului și, când procura a fost folosită la o autoritate, și acelei autorități.`,
              on(values, 'pret')
                ? 'Mandantul constată că mandatarul încasează prețul. Potrivit art. 11 alin. (6) din normele de onorarii, când prin procură se constată că prețul a fost deja încasat de mandatar, onorariul minimal poate fi cel din anexa nr. 2 pct. XIV, nu suma fixă de 100 lei. Excepția este mandatul dat ca mandatarul să contracteze cu sine însuși. Notarul alege temeiul după faptele din original.'
                : values.fel === 'pensie'
                  ? 'Procura este dată numai pentru încasarea pensiei, a ajutorului social, a alocației sau a unui drept dintr-o lege de protecție. Onorariul minimal este 8 lei (anexa nr. 1 pct. 5.2), sub rezerva reducerilor din anexa nr. 5, care nu se cumulează.'
                  : 'Onorariul minimal pentru procura de reprezentare este 100 lei, indiferent de numărul mandanților și al mandatarilor (anexa nr. 1 pct. 5.1 și art. 11 alin. (5) din norme).',
            ],
          },
        ],
        closing: ['Mandantul declară că a citit împuternicirea și că limitele ei sunt cele scrise, nu cele discutate pe lângă act.'],
      }),
  },
  {
    id: 'antecontract',
    title: L('Promisiune bilaterală de vânzare', 'Bilateral promise of sale', 'Kétoldalú adásvételi előszerződés'),
    summary: L(
      'Antecontract. Pentru terenul agricol extravilan și pentru o hotărâre care ține loc de act, forma autentică este necesară.',
      'Pre-contract. Authentic form is required for extra-urban agricultural land and for a judgment that stands as the contract.',
      'Előszerződés. Külterületi földnél és a szerződést pótló ítélethez közokirati forma kell.',
    ),
    category: L('Contracte', 'Contracts', 'Szerződések'),
    citations: [
      { label: 'Codul civil, art. 1279 și art. 1669', url: civil, note: 'Promisiunea și hotărârea care ține loc de contract.' },
      { label: 'Legea nr. 17/2014, art. 5', url: civil, note: 'Antecontractul privind terenul agricol extravilan se încheie în formă autentică.' },
    ],
    markers: markers([
      ['promisiun|antecontract', 'promisiunea'],
      ['pre[țt]', 'prețul'],
      ['avans|arvun[ăa]', 'avansul'],
    ]),
    fields: [
      ...placeFields(L('Actul', 'The act', 'Az okirat')),
      ...party('p', 'Promitent-vânzător', 'Promisor-seller', 'Eladó ígérő'),
      ...party('b', 'Promitent-cumpărător', 'Promisor-buyer', 'Vevő ígérő'),
      ...propertyFields(L('Imobilul', 'The property', 'Az ingatlan'), true),
      { key: 'avans', label: L('Avans, în lei', 'Advance, in lei', 'Előleg, lejben'), type: 'text', group: L('Prețul', 'Price', 'Vételár') },
      { key: 'termen', label: L('Termenul actului final', 'Deadline for the final deed', 'A végleges okirat határideje'), type: 'date', required: true, group: L('Prețul', 'Price', 'Vételár') },
      { key: 'extravilan', label: L('Teren agricol extravilan', 'Extra-urban agricultural land', 'Külterületi mezőgazdasági föld'), type: 'checkbox', group: L('Imobilul', 'The property', 'Az ingatlan') },
    ],
    generate: (values, office) =>
      buildDocument({
        title: 'PROMISIUNE BILATERALĂ DE VÂNZARE-CUMPĂRARE',
        kind: 'antecontract',
        office,
        citations: citationsFor('antecontract'),
        intro: [
          `Astăzi, ${dateClause(values, 'dataAct')}, în ${field(values, 'locAct')}.`,
          partyBlock('Promitent-vânzător', field(values, 'pNume'), field(values, 'pCnp'), identityClause(values, 'p'), field(values, 'pDomiciliu'), field(values, 'pStare')),
          partyBlock('Promitent-cumpărător', field(values, 'bNume'), field(values, 'bCnp'), identityClause(values, 'b'), field(values, 'bDomiciliu'), field(values, 'bStare')),
        ],
        sections: [
          {
            heading: 'Promisiunea',
            paragraphs: [
              'Părțile se obligă să încheie contractul de vânzare, în formă autentică, pentru imobilul descris mai jos. Prezentul înscris nu transmite proprietatea și nu se intabulează ca vânzare.',
              `Imobil: ${field(values, 'imobil')}. CF ${field(values, 'cf')}, cadastral ${field(values, 'cadastral')}, UAT ${field(values, 'uat')}, județul ${field(values, 'judet')}, suprafață ${field(values, 'suprafata')}.`,
              `Prețul promis este ${moneyClause(values, 'pret')}. Avansul de ${moneyClause(values, 'avans')}. Avansul se impută asupra prețului dacă vânzarea se încheie.`,
              `Contractul autentic se va semna până la ${dateClause(values, 'termen')}, dacă până atunci sunt îndeplinite condițiile de publicitate, fiscale și, după caz, de preempțiune.`,
              on(values, 'extravilan')
                ? 'Obiectul este teren agricol extravilan. Art. 5 din Legea nr. 17/2014 cere antecontract autentic și respectarea preempțiunii înainte de o hotărâre care să țină loc de contract. Fără aceste condiții, cererea de intabulare se respinge.'
                : 'Dacă se va cere instanței o hotărâre care să țină loc de contract, art. 1279 pretinde ca promisiunea să îndeplinească condițiile de fond și de formă ale contractului promis. Pentru drepturile care se înscriu în cartea funciară, forma de lucru sigură este autentificarea.',
              'Promitentul-vânzător se obligă să nu înstrăineze imobilul altcuiva până la termen și să radieze sarcinile care împiedică vânzarea, dacă nu s-a convenit că ele se preiau.',
            ],
          },
        ],
        closing: ['Neîncheierea vânzării din culpa uneia dintre părți se judecă pe avans și pe daune potrivit clauzelor din original și art. 1549 și urm. din Codul civil. Proiectul nu fixează o penalitate pe care părțile nu au scris-o.'],
      }),
  },
  {
    id: 'intretinere',
    title: L('Contract de întreținere', 'Maintenance contract', 'Tartási szerződés'),
    summary: L(
      'Transmite un imobil în schimbul întreținerii. Nu este donație și nu beneficiază de scutirea donației.',
      'Transfers an immovable in exchange for maintenance. It is not a gift and does not take the gift exemption.',
      'Ingatlant ruház át tartás fejében. Nem ajándék, és nem jár rá az ajándékozási mentesség.',
    ),
    category: L('Contracte', 'Contracts', 'Szerződések'),
    citations: [
      { label: 'Codul civil, art. 2254 și urm.', url: civil, note: 'Contractul de întreținere.' },
      { label: 'Codul fiscal, art. 111', url: civil, note: 'Întreținerea nu este scutită ca donația între rude.' },
    ],
    markers: markers([
      ['[îi]ntre[țt]in', 'obligația de întreținere'],
      ['creditor|beneficiar', 'creditorul întreținerii'],
    ]),
    fields: [
      ...placeFields(L('Actul', 'The act', 'Az okirat')),
      ...party('c', 'Creditorul întreținerii', 'Maintenance creditor', 'A tartásra jogosult'),
      ...party('d', 'Debitorul întreținerii', 'Maintenance debtor', 'A tartásra kötelezett'),
      ...propertyFields(L('Imobilul', 'The property', 'Az ingatlan'), false),
      { key: 'continut', label: L('În ce constă întreținerea', 'What the maintenance consists of', 'Miből áll a tartás'), type: 'textarea', required: true, group: L('Obligația', 'The duty', 'A kötelezettség') },
      { key: 'dobandire', label: L('Data dobândirii imobilului', 'Date the property was acquired', 'Az ingatlan szerzésének napja'), type: 'date', group: L('Date fiscale', 'Tax', 'Adó') },
    ],
    generate: (values, office) =>
      buildDocument({
        title: 'CONTRACT DE ÎNTREȚINERE',
        kind: 'intretinere',
        office,
        citations: citationsFor('intretinere'),
        intro: [
          `Astăzi, ${dateClause(values, 'dataAct')}, în ${field(values, 'locAct')}.`,
          partyBlock('Creditorul întreținerii', field(values, 'cNume'), field(values, 'cCnp'), identityClause(values, 'c'), field(values, 'cDomiciliu'), field(values, 'cStare')),
          partyBlock('Debitorul întreținerii', field(values, 'dNume'), field(values, 'dCnp'), identityClause(values, 'd'), field(values, 'dDomiciliu'), field(values, 'dStare')),
        ],
        sections: [
          {
            heading: 'Schimbul dintre bun și întreținere',
            paragraphs: [
              `Creditorul transmite debitorului proprietatea asupra imobilului: ${field(values, 'imobil')}.`,
              `Imobilul este identificat cu CF ${field(values, 'cf')}, cadastral ${field(values, 'cadastral')}, UAT ${field(values, 'uat')}, județul ${field(values, 'judet')}, suprafață ${field(values, 'suprafata')}.`,
              `În schimb, debitorul se obligă să asigure întreținerea, constând în: ${field(values, 'continut')}.`,
              'Obligația este intuitu personae și se execută pe toată durata vieții creditorului, dacă nu s-a limitat altfel în original.',
              'Contractul nu este donație. Scutirea de la art. 111 alin. (2) pentru donațiile între soți și rude apropiate nu se aplică. Transmiterea imobilului datorează impozitul de 3% sau 1%, după data dobândirii ' +
                `${dateClause(values, 'dobandire')} și după valoarea avută în vedere de norme, nu după un preț inexistent.`,
              'Neexecutarea întreținerii poate duce la rezoluțiune, în condițiile legii și ale clauzelor din original. Până la rezoluțiune, dreptul se intabulează pe numele debitorului, iar creditorul poate cere notarea sau constituirea unei garanții, dacă așa se convine.',
              'Se va verifica separat dacă creditorul își păstrează un drept de abitație sau de uzufruct. Proiectul nu îl constituie dacă nu a fost descris la conținutul întreținerii.',
            ],
          },
        ],
        closing: ['Părțile declară că au înțeles diferența dintre acest contract și o donație sau o vânzare.'],
      }),
  },
  {
    id: 'conventie',
    title: L('Convenție matrimonială', 'Matrimonial agreement', 'Házassági vagyonjogi szerződés'),
    summary: L(
      'Alege sau modifică regimul matrimonial, numai în formă autentică.',
      'Chooses or changes the matrimonial property regime, in authentic form only.',
      'A házassági vagyonjogi rendszert választja vagy módosítja, csak közokiratban.',
    ),
    category: L('Familie', 'Family', 'Család'),
    citations: [
      { label: 'Codul civil, art. 312 și urm. și art. 330', url: civil, note: 'Regimurile matrimoniale și forma autentică a convenției.' },
      { label: 'Codul civil, art. 329 și art. 366', url: civil, note: 'Separația de bunuri și comunitatea convențională.' },
    ],
    markers: markers([
      ['conven[țt]ie matrimonial[ăa]|regim', 'regimul matrimonial'],
      ['330', 'art. 330'],
    ]),
    fields: [
      ...placeFields(L('Actul', 'The act', 'Az okirat')),
      ...party('a', 'Soțul', 'Spouse', 'Házastárs'),
      ...party('b', 'Soția', 'Spouse', 'Házastárs'),
      {
        key: 'regim',
        label: L('Regimul ales', 'Chosen regime', 'A választott rendszer'),
        type: 'select',
        required: true,
        group: L('Regimul', 'The regime', 'A rendszer'),
        options: [
          { value: 'separatie', label: L('Separație de bunuri', 'Separation of property', 'Vagyonelkülönítés') },
          { value: 'conventionala', label: L('Comunitate convențională', 'Contractual community', 'Szerződéses közös vagyon') },
          { value: 'legala', label: L('Revenire la comunitatea legală', 'Return to the legal community', 'Visszatérés a törvényes közös vagyonhoz') },
        ],
      },
      { key: 'efect', label: L('Când produce efecte', 'When it takes effect', 'Mikortól hat'), type: 'text', group: L('Regimul', 'The regime', 'A rendszer') },
      { key: 'inventar', label: L('Inventarul bunurilor', 'Inventory of assets', 'A vagyon leltára'), type: 'textarea', required: true, group: L('Regimul', 'The regime', 'A rendszer') },
    ],
    generate: (values, office) =>
      buildDocument({
        title: 'CONVENȚIE MATRIMONIALĂ',
        kind: 'conventie',
        office,
        citations: citationsFor('conventie'),
        intro: [
          `Astăzi, ${dateClause(values, 'dataAct')}, în ${field(values, 'locAct')}.`,
          partyBlock('Soțul', field(values, 'aNume'), field(values, 'aCnp'), identityClause(values, 'a'), field(values, 'aDomiciliu'), field(values, 'aStare')),
          partyBlock('Soția', field(values, 'bNume'), field(values, 'bCnp'), identityClause(values, 'b'), field(values, 'bDomiciliu'), field(values, 'bStare')),
        ],
        sections: [
          {
            heading: 'Regimul',
            paragraphs: [
              'Părțile încheie prezenta convenție în formă autentică, potrivit art. 330 din Codul civil. O convenție sub semnătură privată nu schimbă regimul.',
              values.regim === 'separatie'
                ? 'Părțile adoptă regimul separației de bunuri. Fiecare păstrează și administrează bunurile proprii și răspunde pentru datoriile proprii. Bunurile dobândite împreună se țin pe cote, nu în devălmășie.'
                : values.regim === 'conventionala'
                  ? 'Părțile adoptă comunitatea convențională și derogă de la comunitatea legală numai în limitele scrise mai jos. Derogarea nu poate încălca regulile imperative ale regimului primar.'
                  : values.regim === 'legala'
                    ? 'Părțile revin la comunitatea legală. Bunurile dobândite după efectul convenției sunt comune, cu excepțiile art. 340.'
                    : 'Regimul ales nu rezultă din datele proiectului. Convenția autentică trebuie să numească separația de bunuri, comunitatea convențională sau revenirea la comunitatea legală, potrivit art. 330. Proiectul nu alege în locul soților.',
              `Efecte: ${field(values, 'efect', 'de la data autentificării, față de soți, și de la îndeplinirea formalităților de opozabilitate, față de terți')}.`,
              `Inventar: ${field(values, 'inventar')}.`,
              'Convenția se notează în registrul prevăzut de lege și, pentru imobile, în cartea funciară, ca să fie opozabilă terților. Fără aceste formalități, soții nu o pot opune dobânditorilor de bună-credință.',
              'Lichidarea regimului anterior, dacă există bunuri comune, se face prin act separat sau prin capitol de lichidare, cu cotele și sultele scrise în cifre. Acest proiect nu lichidează comunitatea dacă inventarul nu o spune.',
            ],
          },
        ],
        closing: ['Minorul care se căsătorește și persoana ocrotită cer avizele prevăzute de lege. Notarul nu autentifică convenția fără ele.'],
      }),
  },
  {
    id: 'testament',
    title: L('Testament autentic', 'Authentic will', 'Közokirati végrendelet'),
    summary: L(
      'Ultima voință autentificată. Rezerva soțului, a copiilor și a părinților rămâne.',
      'Authenticated last will. The forced share of the spouse, children and parents remains.',
      'Hitelesített végakarat. A házastárs, a gyermekek és a szülők kötelesrésze megmarad.',
    ),
    category: L('Succesiuni', 'Successions', 'Hagyaték'),
    citations: [
      { label: 'Codul civil, art. 1034 și art. 1043–1044', url: civil, note: 'Noțiunea, testamentul autentic și formalitățile de citire.' },
      { label: 'Codul civil, art. 1086–1088', url: civil, note: 'Rezerva este jumătate din cota legală a fiecărui rezervatar.' },
    ],
    markers: markers([
      ['testat', 'testatorul'],
      ['1043|1044|rezerv', 'forma sau rezerva'],
    ]),
    fields: [
      ...placeFields(L('Actul', 'The act', 'Az okirat')),
      ...party('t', 'Testator', 'Testator', 'Végrendelkező'),
      { key: 'dispozitii', label: L('Dispozițiile de ultimă voință', 'Testamentary dispositions', 'A végintézkedések'), type: 'textarea', required: true, group: L('Voința', 'The will', 'Az akarat') },
      { key: 'executor', label: L('Executor testamentar, dacă este desemnat', 'Executor, if appointed', 'Végrehajtó, ha van'), type: 'text', group: L('Voința', 'The will', 'Az akarat') },
      { key: 'martori', label: L('Testatorul cere martori', 'The testator asks for witnesses', 'A végrendelkező tanúkat kér'), type: 'checkbox', group: L('Voința', 'The will', 'Az akarat') },
    ],
    generate: (values, office) =>
      buildDocument({
        title: 'TESTAMENT',
        kind: 'testament',
        office,
        citations: citationsFor('testament'),
        intro: [
          `Astăzi, ${dateClause(values, 'dataAct')}, în ${field(values, 'locAct')}, s-a prezentat testatorul, în persoană.`,
          partyBlock('Testator', field(values, 'tNume'), field(values, 'tCnp'), identityClause(values, 't'), field(values, 'tDomiciliu'), field(values, 'tStare')),
        ],
        sections: [
          {
            heading: 'Dispoziții',
            paragraphs: [
              'Testatorul declară că aceasta este voința lui pentru timpul când nu va mai fi în viață, că o poate revoca oricând și că a dictat-o ori a adus-o scrisă ca notarul să i-o citească (art. 1034 și art. 1044).',
              field(values, 'dispozitii'),
              values.executor?.trim()
                ? `Desemnează executor testamentar pe ${values.executor.trim()}. Executarea începe după deschiderea moștenirii și în limitele legii.`
                : 'Nu desemnează executor testamentar.',
              'Testatorul a fost înștiințat că soțul supraviețuitor, descendenții și părinții sunt moștenitori rezervatari și că rezerva fiecăruia este jumătate din cota legală (art. 1088). Legatele care trec de cotitatea disponibilă se reduc. Testamentul nu poate înlătura rezerva.',
              on(values, 'martori')
                ? 'Testatorul cere asistența a unul sau doi martori, permisă de art. 1043 alin. (2). Martorii nu sunt legatari și nu sunt rude în gradul prohibit de lege cu notarul sau cu legatarii, verificare făcută la autentificare.'
                : 'Testatorul nu cere martori. Legea nu îi impune la testamentul autentic obișnuit.',
              'Un testament olograf anterior rămâne valabil numai pentru dispozițiile necontrare, dacă nu este revocat expres. Revocarea totală se scrie răspicat în original: „Revoc orice testament anterior.” Proiectul nu o presupune.',
              'Testamentul autentic se înregistrează în registrele notariale prevăzute de lege. Originalul se păstrează în arhivă.',
            ],
          },
        ],
        closing: [
          'În încheierea de autentificare se va menționa că dispozițiile au fost citite testatorului și că el a declarat că acestea sunt cele dictate sau aduse de el.',
          'Proiectul nu se semnează în locul testatorului și nu se datează ca testament înainte de prezența lui.',
        ],
      }),
  },
  {
    id: 'acceptare',
    title: L('Declarație de acceptare a moștenirii', 'Declaration of acceptance', 'Nyilatkozat a hagyaték elfogadásáról'),
    summary: L(
      'Acceptare expresă. La minorul fără capacitate de exercițiu trebuie încuviințarea instanței de tutelă.',
      'Express acceptance. A minor without capacity needs the guardianship court’s approval.',
      'Kifejezett elfogadás. A cselekvőképtelen kiskorúhoz a gyámhatósági bíróság jóváhagyása kell.',
    ),
    category: L('Succesiuni', 'Successions', 'Hagyaték'),
    citations: [
      { label: 'Codul civil, art. 1103 și art. 1108–1109', url: civil, note: 'Termenul de un an și acceptarea expresă, înscrisă în registrul notarial dacă este autentică.' },
      { label: 'ÎCCJ, Decizia nr. 58/2024', url: PORTAL, note: 'Acceptarea expresă a minorului lipsit de capacitate de exercițiu cere încuviințarea instanței de tutelă.' },
    ],
    markers: markers([
      ['accept', 'acceptarea'],
      ['defunct', 'defunctul'],
    ]),
    fields: [
      ...placeFields(L('Actul', 'The act', 'Az okirat')),
      ...party('m', 'Succesibil', 'Heir', 'Örökös'),
      { key: 'defunct', label: L('Defunctul', 'The deceased', 'Az elhunyt'), type: 'text', required: true, group: L('Succesiunea', 'The succession', 'A hagyaték') },
      { key: 'deces', label: L('Data decesului', 'Date of death', 'A halál napja'), type: 'date', required: true, group: L('Succesiunea', 'The succession', 'A hagyaték') },
      { key: 'domDefunct', label: L('Ultimul domiciliu', 'Last domicile', 'Utolsó lakóhely'), type: 'text', required: true, group: L('Succesiunea', 'The succession', 'A hagyaték') },
      { key: 'minor', label: L('Succesibilul este minor fără capacitate de exercițiu', 'The heir is a minor without capacity', 'Az örökös cselekvőképtelen kiskorú'), type: 'checkbox', group: L('Succesibil', 'Heir', 'Örökös') },
    ],
    generate: (values, office) =>
      buildDocument({
        title: 'DECLARAȚIE DE ACCEPTARE A MOȘTENIRII',
        kind: 'acceptare',
        office,
        citations: citationsFor('acceptare'),
        intro: [
          `Astăzi, ${dateClause(values, 'dataAct')}, în ${field(values, 'locAct')}.`,
          partyBlock('Succesibil', field(values, 'mNume'), field(values, 'mCnp'), identityClause(values, 'm'), field(values, 'mDomiciliu'), field(values, 'mStare')),
        ],
        sections: [
          {
            heading: 'Opțiunea',
            paragraphs: [
              `Declar că accept pur și simplu moștenirea rămasă de pe urma defunctului ${field(values, 'defunct')}, decedat la ${dateClause(values, 'deces')}, cu ultimul domiciliu în ${field(values, 'domDefunct')}.`,
              'Îmi însușesc expres calitatea de moștenitor, în sensul art. 1108 alin. (2). Acceptarea este indivizibilă: nu pot lua bunurile și lăsa datoriile. Dacă am și o vocație testamentară distinctă, opțiunea asupra ei se verifică separat (art. 1102).',
              'Știu că termenul de opțiune este de un an de la deschiderea moștenirii (art. 1103) și că declarația autentică se înscrie în registrul național notarial (art. 1109).',
              on(values, 'minor')
                ? 'Succesibilul este minor lipsit de capacitate de exercițiu. Potrivit Deciziei ÎCCJ nr. 58/2024, acceptarea expresă este act de dispoziție și nu se autentifică fără încuviințarea instanței de tutelă. Proiectul se oprește aici până la încuviințare.'
                : 'Declar că am capacitate deplină de exercițiu și că nu am renunțat anterior la această moștenire.',
            ],
          },
        ],
        closing: ['Declarația nu stabilește cotele și nu ține loc de certificat de moștenitor.'],
      }),
  },
  {
    id: 'renuntare',
    title: L('Declarație de renunțare la moștenire', 'Renunciation of the inheritance', 'Nyilatkozat a hagyaték visszautasításáról'),
    summary: L(
      'Renunțare autentică, la orice notar, înscrisă în registru pe cheltuiala renunțătorului.',
      'Authentic renunciation, at any notary, entered in the register at the renouncer’s cost.',
      'Közokirati visszautasítás, bármely közjegyzőnél, a nyilvántartásba a visszautasító költségén.',
    ),
    category: L('Succesiuni', 'Successions', 'Hagyaték'),
    citations: [
      { label: 'Codul civil, art. 1120 și art. 1121', url: civil, note: 'Forma autentică și efectul: renunțătorul este considerat că nu a fost niciodată moștenitor.' },
      { label: 'Codul civil, art. 1112', url: civil, note: 'Tăcerea, după un an, a celui care a știut poate fi prezumată renunțare, până la proba contrară. Nu înlocuiește declarația.' },
    ],
    markers: markers([
      ['renun[țt]', 'renunțarea'],
      ['1120', 'art. 1120'],
    ]),
    fields: [
      ...placeFields(L('Actul', 'The act', 'Az okirat')),
      ...party('m', 'Renunțător', 'Renouncer', 'Visszautasító'),
      { key: 'defunct', label: L('Defunctul', 'The deceased', 'Az elhunyt'), type: 'text', required: true, group: L('Succesiunea', 'The succession', 'A hagyaték') },
      { key: 'deces', label: L('Data decesului', 'Date of death', 'A halál napja'), type: 'date', required: true, group: L('Succesiunea', 'The succession', 'A hagyaték') },
      { key: 'calitate', label: L('Calitatea în care renunță', 'The title under which they renounce', 'A minőség, amelyben visszautasít'), type: 'text', required: true, group: L('Succesiunea', 'The succession', 'A hagyaték') },
    ],
    generate: (values, office) =>
      buildDocument({
        title: 'DECLARAȚIE DE RENUNȚARE LA MOȘTENIRE',
        kind: 'renuntare',
        office,
        citations: citationsFor('renuntare'),
        intro: [
          `Astăzi, ${dateClause(values, 'dataAct')}, în ${field(values, 'locAct')}.`,
          partyBlock('Renunțător', field(values, 'mNume'), field(values, 'mCnp'), identityClause(values, 'm'), field(values, 'mDomiciliu'), field(values, 'mStare')),
        ],
        sections: [
          {
            heading: 'Renunțarea',
            paragraphs: [
              `Declar că renunț expres la moștenirea rămasă de pe urma defunctului ${field(values, 'defunct')}, decedat la ${dateClause(values, 'deces')}, în calitate de ${field(values, 'calitate')}.`,
              'Renunțarea se face în formă autentică, la orice notar public (art. 1120 alin. (2)). Nu se poate face prin înscris sub semnătură privată, prin mesaj sau prin neprezentare.',
              'Declar că nu am făcut acte de acceptare tacită. Știu că, dacă am acceptat deja, renunțarea nu mai este deschisă, iar dacă am săvârșit acte cu valoare de acceptare, notarul oprește declarația.',
              'Potrivit art. 1121, sunt considerat că nu am fost niciodată moștenitor. Partea mea profită moștenitorilor pe care i-aș fi înlăturat sau a căror cotă aș fi micșorat-o. Copiii mei nu mă reprezintă ca urmare a renunțării.',
              'Cer înscrierea declarației în registrul național notarial, pe cheltuiala mea (art. 1120 alin. (3)). Renunțarea privește o singură moștenire. Pentru un alt defunct se face act separat.',
              'Înăuntrul termenului de opțiune, renunțarea poate fi revocată numai dacă partea nu a fost deja acceptată de succesibilii care vin în locul meu (art. 1123).',
            ],
          },
        ],
        closing: ['Competența pentru această declarație nu este legată de circumscripția succesiunii. Procedura succesorală propriu-zisă rămâne la notarul ultimului domiciliu al defunctului.'],
      }),
  },
];

export function templateById(id: string): ActTemplate | undefined {
  return templates.find((template) => template.id === id);
}

function citationsFor(id: string): LegalCitation[] {
  return templateById(id)?.citations ?? [];
}
