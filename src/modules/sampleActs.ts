import type { ActDocument, OfficeProfile } from '@/domain/types';
import { checkCnp } from '@/lib/cnp';
import { computeSuccession, type HeirInput, type SuccessionInput } from '@/lib/succession';
import { otherModels } from '@/modules/otherActs';
import { successionCertificate, successionClosing } from '@/modules/successionDoc';

const DATE = '2026-10-14';
const PLACE = 'municipiul Cluj-Napoca';
const KEY = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];

function cnp(sex: number, yymmdd: string, county: string, order: string): string {
  const base = `${sex}${yymmdd}${county}${order}`;
  const digits = base.split('').map(Number);
  const sum = KEY.reduce((total, weight, index) => total + weight * digits[index], 0);
  const control = sum % 11 === 10 ? 1 : sum % 11;
  return `${base}${control}`;
}

const P = {
  andrei: cnp(1, '750314', '12', '001'),
  elena: cnp(2, '780622', '12', '002'),
  mihai: cnp(1, '821105', '13', '003'),
  ana: cnp(2, '840130', '13', '004'),
  radu: cnp(1, '800909', '12', '005'),
  luca: cnp(5, '100412', '12', '006'),
  petru: cnp(1, '500101', '12', '007'),
  ioana: cnp(2, '520303', '12', '008'),
  sorin: cnp(1, '770707', '12', '009'),
  vlad: cnp(1, '760418', '12', '013'),
  dana: cnp(2, '790903', '12', '014'),
  costin: cnp(1, '680211', '12', '015'),
  vera: cnp(2, '710625', '12', '016'),
};

for (const code of Object.values(P)) {
  if (!checkCnp(code).valid) throw new Error(`CNP de exemplu invalid: ${code}`);
}

function home(street: string, nr: string): string {
  return `Cluj-Napoca, strada ${street} nr ${nr}`;
}

function person(prefix: string, name: string, code: string, idNumber: string, domicile: string, civil: string) {
  return {
    [`${prefix}Nume`]: name,
    [`${prefix}Cnp`]: code,
    [`${prefix}CiSerie`]: 'CJ',
    [`${prefix}CiNr`]: idNumber,
    [`${prefix}Domiciliu`]: domicile,
    [`${prefix}Stare`]: civil,
  };
}

const APT = 'apartament cu două camere și dependințe, strada Memorandumului nr 28, ap 12, Cluj-Napoca';
const LAND = 'teren agricol extravilan, tarla 12, parcela 4, comuna Apahida';

function property(description: string, cf: string, cadastral: string, area = '52,40 mp') {
  return { imobil: description, uat: 'Cluj-Napoca', judet: 'Cluj', cf, cadastral, suprafata: area };
}

function base() {
  return { dataAct: DATE, locAct: PLACE };
}

export interface ActModel {
  kind: 'act';
  id: string;
  templateId: string;
  title: string;
  blurb: string;
  values: Record<string, string>;
}

export interface SuccessionModel {
  kind: 'succession';
  id: string;
  title: string;
  blurb: string;
  build: (office: OfficeProfile) => ActDocument;
}

export interface ProcedureModel {
  kind: 'procedure';
  id: string;
  title: string;
  blurb: string;
  build: (office: OfficeProfile) => ActDocument;
}

export type LibraryModel = ActModel | SuccessionModel | ProcedureModel;

const seller = person('v', 'Mureșan Andrei', P.andrei, '100001', home('Memorandumului', '28'), 'căsătorit');
const buyer = person('c', 'Popescu Elena-Maria', P.elena, '100002', home('Horea', '10'), 'necăsătorită');

export const actModels: ActModel[] = [
  {
    kind: 'act',
    id: '01-vanzare-propriu',
    templateId: 'vanzare-imobil',
    title: 'Vânzare — bun propriu, preț integral',
    blurb: 'Un vânzător, preț achitat la autentificare, deținere mai mare de 3 ani.',
    values: {
      ...base(),
      ...seller,
      ...buyer,
      vRegim: 'propriu',
      ...property(APT, '123456', '12345-C1'),
      pret: '250000',
      plata: 'integral',
      dobandire: '2018-01-15',
      grila: '240000',
      sarcini: 'liber de sarcini, potrivit extrasului de carte funciară anexat',
      observatii: 'Predarea include și boxa notată în anexă',
    },
  },
  {
    kind: 'act',
    id: '02-vanzare-comun',
    templateId: 'vanzare-imobil',
    title: 'Vânzare — bun comun, rest și ipotecă legală',
    blurb: 'Doi soți vânzători. Prețul nu este achitat integral. Ipoteca este cea legală pentru preț, art. 2386 pct. 1.',
    values: {
      ...base(),
      ...person('v', 'Mureșan Andrei și Mureșan Ioana', P.andrei, '100003', home('Memorandumului', '28'), 'căsătorit'),
      ...person('c', 'Popescu Vlad și Popescu Dana', P.vlad, '100004', home('Observatorului', '6'), 'căsătorit'),
      vRegim: 'comun',
      ...property(APT, '234567', '23456-C1-U12'),
      pret: '180000',
      plata: 'partial',
      rest: '50000 lei, scadent la 14 aprilie 2027',
      ipoteca: 'da',
      dobandire: '2024-11-01',
      grila: '180000',
      sarcini: 'ipotecă legală pentru restul de preț, de înscris odată cu dreptul',
    },
  },
  {
    kind: 'act',
    id: '03-vanzare-credit',
    templateId: 'vanzare-imobil',
    title: 'Vânzare — cotă 1/2, preț din credit',
    blurb: 'Se vinde o cotă. Creditul bancar nu este ipoteca legală a vânzătorului.',
    values: {
      ...base(),
      ...seller,
      ...buyer,
      vRegim: 'cota',
      vCota: '1/2',
      ...property(APT, '345678', '34567-C2'),
      pret: '90000',
      plata: 'credit',
      rest: 'credit contractat la Banca Transilvania și garantat separat',
      dobandire: '2020-05-20',
      grila: '90000',
      sarcini: 'partea de 1/2 este liberă de sarcini declarate',
    },
  },
  {
    kind: 'act',
    id: '04-vanzare-extravilan',
    templateId: 'vanzare-imobil',
    title: 'Vânzare — teren agricol extravilan',
    blurb: 'Legea nr. 17/2014 oprește actul până la preempțiune și avize.',
    values: {
      ...base(),
      ...person('v', 'Costin Mureșan', P.costin, '100005', home('Fabricii', '2'), 'divorțat'),
      ...person('c', 'Ana Pop', P.ana, '100006', home('Traian', '15'), 'necăsătorită'),
      vRegim: 'propriu',
      ...property(LAND, '456789', '45678', '5000 mp'),
      pret: '120000',
      plata: 'integral',
      dobandire: '2010-04-01',
      grila: '120000',
      extravilan: 'da',
      sarcini: 'liber de sarcini, sub condiția avizelor de preempțiune',
    },
  },
  {
    kind: 'act',
    id: '05-donatie-scutit',
    templateId: 'donatie-imobil',
    title: 'Donație — părinte către fiu, scutită',
    blurb: 'Art. 1011 pentru formă. Scutirea de la art. 111 alin. (2) numai între soți și rude sau afini până la gradul III.',
    values: {
      ...base(),
      ...person('d', 'Petre Mureșan', P.petru, '100007', home('Moților', '9'), 'văduv'),
      ...person('b', 'Sorin Mureșan', P.sorin, '100008', home('Barițiu', '4'), 'necăsătorit'),
      grad: 'scutit',
      ...property(APT, '567890', '56789-C3'),
      sarcini: 'donație pură și simplă, fără sarcină',
    },
  },
  {
    kind: 'act',
    id: '06-donatie-impozabil',
    templateId: 'donatie-imobil',
    title: 'Donație — către o persoană din afara gradului scutit',
    blurb: 'Părțile declară că nu sunt în cazul de scutire. Notarul nu aplică scutirea neverificată.',
    values: {
      ...base(),
      ...person('d', 'Vera Mureșan', P.vera, '100009', home('Barițiu', '4'), 'căsătorită'),
      ...person('b', 'Radu Ionescu', P.radu, '100010', home('Napoca', '1'), 'necăsătorit'),
      grad: 'impozabil',
      ...property(APT, '678901', '67890-C4'),
      sarcini: 'donație pură și simplă, fără sarcină',
    },
  },
  {
    kind: 'act',
    id: '07-procura-speciala',
    templateId: 'procura',
    title: 'Procură specială',
    blurb: 'Onorariul minimal de reprezentare este 100 lei, anexa nr. 1 pct. 5.1.',
    values: {
      ...base(),
      ...person('m', 'Mihai Pop', P.mihai, '100011', home('Clinicilor', '8'), 'căsătorit'),
      tNume: 'Radu Ionescu',
      tCnp: P.radu,
      tDomiciliu: home('Napoca', '1'),
      fel: 'speciala',
      obiect: 'depună la primărie cererea de racordare și să ridice certificatul de atestare fiscală',
      durata: 'un an de la data autentificării',
    },
  },
  {
    kind: 'act',
    id: '08-procura-pensie',
    templateId: 'procura',
    title: 'Procură numai pentru pensie',
    blurb: 'Onorariul minimal este 8 lei, anexa nr. 1 pct. 5.2.',
    values: {
      ...base(),
      ...person('m', 'Petre Mureșan', P.petru, '100012', home('Moților', '9'), 'văduv'),
      tNume: 'Ioana Mureșan',
      tCnp: P.ioana,
      tDomiciliu: home('Moților', '9'),
      fel: 'pensie',
      obiect: 'încaseze pensia pentru limită de vârstă și să semneze borderourile casei de pensii',
      durata: 'până la revocarea expresă',
    },
  },
  {
    kind: 'act',
    id: '09-procura-pret',
    templateId: 'procura',
    title: 'Procură prin care se încasează prețul',
    blurb: 'Art. 11 alin. (6) din norme. Suma de la anexa nr. 2 pct. XIV nu este codificată și o stabilește notarul.',
    values: {
      ...base(),
      ...person('m', 'Andrei Mureșan', P.andrei, '100013', home('Memorandumului', '28'), 'căsătorit'),
      tNume: 'Radu Ionescu',
      tCnp: P.radu,
      tDomiciliu: home('Napoca', '1'),
      fel: 'speciala',
      obiect: 'semneze actul autentic de înstrăinare a apartamentului din Cluj-Napoca',
      durata: 'până la semnarea actului sau până la revocare',
      pret: 'da',
    },
  },
  {
    kind: 'act',
    id: '10-antecontract',
    templateId: 'antecontract',
    title: 'Promisiune bilaterală de vânzare',
    blurb: 'Nu transmite proprietatea și nu se intabulează ca vânzare. Art. 1669 și art. 1279.',
    values: {
      ...base(),
      ...person('p', 'Mihai Pop', P.mihai, '100014', home('Clinicilor', '8'), 'căsătorit'),
      ...person('b', 'Elena Popescu', P.elena, '100015', home('Horea', '10'), 'necăsătorită'),
      ...property(APT, '789012', '78901-C5'),
      pret: '250000',
      avans: '50000',
      termen: '2027-03-15',
    },
  },
  {
    kind: 'act',
    id: '11-antecontract-extravilan',
    templateId: 'antecontract',
    title: 'Antecontract — teren agricol extravilan',
    blurb: 'Art. 5 din Legea nr. 17/2014 cere antecontract autentic.',
    values: {
      ...base(),
      ...person('p', 'Costin Mureșan', P.costin, '100016', home('Fabricii', '2'), 'divorțat'),
      ...person('b', 'Dana Popescu', P.dana, '100017', home('Observatorului', '6'), 'căsătorită'),
      ...property(LAND, '890123', '89012', '5000 mp'),
      pret: '120000',
      avans: '20000',
      termen: '2027-06-01',
      extravilan: 'da',
    },
  },
  {
    kind: 'act',
    id: '12-intretinere',
    templateId: 'intretinere',
    title: 'Contract de întreținere',
    blurb: 'Nu este donație și nu ia scutirea donației. Art. 2254.',
    values: {
      ...base(),
      ...person('c', 'Vera Mureșan', P.vera, '100018', home('Barițiu', '4'), 'căsătorită'),
      ...person('d', 'Sorin Mureșan', P.sorin, '100019', home('Barițiu', '4'), 'necăsătorit'),
      ...property(APT, '901234', '90123-C6'),
      continut: 'hrană zilnică, îngrijire medicală și plata utilităților locuinței',
      dobandire: '2016-09-01',
    },
  },
  {
    kind: 'act',
    id: '13-conventie-separatie',
    templateId: 'conventie',
    title: 'Convenție — separația de bunuri',
    blurb: 'Formă autentică, art. 330. Efectele față de terți cer opozabilitatea.',
    values: {
      ...base(),
      ...person('a', 'Andrei Mureșan', P.andrei, '100020', home('Memorandumului', '28'), 'căsătorit'),
      ...person('b', 'Ioana Mureșan', P.ioana, '100021', home('Memorandumului', '28'), 'căsătorită'),
      regim: 'separatie',
      efect: 'de la data căsătoriei, față de soți, și de la notarea în cartea funciară, față de terți',
      inventar: 'apartament în Cluj-Napoca, CF 123456, deținut pe cote după separație, și autoturism bun propriu al soțului',
    },
  },
  {
    kind: 'act',
    id: '14-conventie-conventionala',
    templateId: 'conventie',
    title: 'Convenție — comunitate convențională',
    blurb: 'Derogă de la comunitatea legală numai în limitele scrise.',
    values: {
      ...base(),
      ...person('a', 'Vlad Popescu', P.vlad, '100022', home('Observatorului', '6'), 'căsătorit'),
      ...person('b', 'Dana Popescu', P.dana, '100023', home('Observatorului', '6'), 'căsătorită'),
      regim: 'conventionala',
      efect: 'de la autentificare, pentru bunurile dobândite după această dată',
      inventar: 'apartament comun, CF 234567, inclus în comunitatea convențională, și cont bancar propriu al soției',
    },
  },
  {
    kind: 'act',
    id: '15-conventie-legala',
    templateId: 'conventie',
    title: 'Convenție — revenire la comunitatea legală',
    blurb: 'Art. 340 rămâne limita bunurilor comune.',
    values: {
      ...base(),
      ...person('a', 'Mihai Pop', P.mihai, '100024', home('Clinicilor', '8'), 'căsătorit'),
      ...person('b', 'Elena Pop', P.elena, '100025', home('Clinicilor', '8'), 'căsătorită'),
      regim: 'legala',
      efect: 'de la data autentificării, cu lichidarea separată a regimului anterior',
      inventar: 'apartament în Cluj-Napoca, CF 345678, care redevine bun comun după revenirea la comunitatea legală',
    },
  },
  {
    kind: 'act',
    id: '16-testament-martori',
    templateId: 'testament',
    title: 'Testament autentic — executor și martori',
    blurb: 'Art. 1044 și rezerva de la art. 1088. Martorii sunt ceruți de testator, nu impuși la forma obișnuită.',
    values: {
      ...base(),
      ...person('t', 'Petre Mureșan', P.petru, '100026', home('Moților', '9'), 'văduv'),
      dispozitii: 'Las moștenire nepoatei Pop Maria cotitatea disponibilă din apartamentul din Cluj-Napoca, cu respectarea rezervei descendenților',
      executor: 'Radu Ionescu',
      martori: 'da',
    },
  },
  {
    kind: 'act',
    id: '17-testament-simplu',
    templateId: 'testament',
    title: 'Testament autentic — fără martori și fără executor',
    blurb: 'Proiectul nu inventează un executor și nu cere martori dacă testatorul nu i-a cerut.',
    values: {
      ...base(),
      ...person('t', 'Vera Mureșan', P.vera, '100027', home('Barițiu', '4'), 'căsătorită'),
      dispozitii: 'Las moștenire fiului Sorin Mureșan întreaga cotitate disponibilă, rezerva soțului și a descendenților rămânând neatinsă',
    },
  },
  {
    kind: 'act',
    id: '18-acceptare',
    templateId: 'acceptare',
    title: 'Acceptarea moștenirii — major',
    blurb: 'Art. 1108 și termenul de un an de la art. 1103. Nu stabilește cotele.',
    values: {
      ...base(),
      ...person('m', 'Sorin Mureșan', P.sorin, '100028', home('Moților', '9'), 'necăsătorit'),
      defunct: 'Petre Mureșan',
      deces: '2024-03-01',
      domDefunct: 'Cluj-Napoca, strada Horea nr 10',
    },
  },
  {
    kind: 'act',
    id: '19-acceptare-minor',
    templateId: 'acceptare',
    title: 'Acceptarea moștenirii — minor fără capacitate',
    blurb: 'Decizia ÎCCJ nr. 58/2024: actul nu se autentifică fără încuviințarea instanței de tutelă.',
    values: {
      ...base(),
      ...person('m', 'Luca Mureșan', P.luca, '100029', home('Moților', '9'), 'necăsătorit'),
      defunct: 'Petre Mureșan',
      deces: '2025-06-15',
      domDefunct: 'Cluj-Napoca, strada Horea nr 10',
      minor: 'da',
    },
  },
  {
    kind: 'act',
    id: '20-renuntare',
    templateId: 'renuntare',
    title: 'Renunțare la moștenire',
    blurb: 'Art. 1120 și art. 1121. Renunțătorul nu este reprezentat de copiii lui.',
    values: {
      ...base(),
      ...person('m', 'Sorin Mureșan', P.sorin, '100030', home('Unirii', '3'), 'necăsătorit'),
      defunct: 'Petre Mureșan',
      deces: '2024-03-01',
      calitate: 'fiu al defunctului',
    },
  },
];

function heir(partial: HeirInput): HeirInput {
  return partial;
}

function succession(partial: Partial<SuccessionInput> & Pick<SuccessionInput, 'heirs' | 'assets'>): SuccessionInput {
  return {
    deceasedName: 'Petre Mureșan',
    deathOn: '2024-03-01',
    finalizedOn: '2026-02-01',
    lastDomicile: 'Cluj-Napoca, strada Horea nr 10',
    debts: [],
    legacies: [],
    spouseHasAnotherHome: true,
    ...partial,
  };
}

const successionCases: { id: string; title: string; blurb: string; input: SuccessionInput }[] = [
  {
    id: 's01-sot-copil',
    title: 'Succesiune — soț și un copil',
    blurb: 'Soțul 1/4, copilul 3/4. Apartamentul comun intră în masă numai cu jumătatea defunctului.',
    input: succession({
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'c', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
      ],
      assets: [
        { id: 'a', label: 'Apartament Cluj-Napoca', category: 'imobil', regime: 'comun', value: 400000 },
        { id: 'm', label: 'Autoturism propriu al soției', category: 'mobil', regime: 'propriu-sot', value: 8000 },
      ],
    }),
  },
  {
    id: 's02-doi-copii',
    title: 'Succesiune — doi copii, fără soț',
    blurb: 'Fiecare copil culege 1/2.',
    input: succession({
      heirs: [
        heir({ id: 'c1', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Ana Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 300000 }],
    }),
  },
  {
    id: 's03-parinti-frate',
    title: 'Succesiune — soț, părinți și frate bun',
    blurb: 'Art. 972 și art. 978: soțul 1/3, fiecare părinte 1/6, fratele 1/3.',
    input: succession({
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 't', name: 'Vasile Mureșan', kind: 'parent', status: 'accepts', degree: 1 }),
        heir({ id: 'm', name: 'Maria Mureșan', kind: 'parent', status: 'accepts', degree: 1 }),
        heir({ id: 'f', name: 'Radu Mureșan', kind: 'privileged-collateral', status: 'accepts', degree: 2, line: 'both' }),
      ],
      assets: [{ id: 'a', label: 'Casă proprie', category: 'imobil', regime: 'propriu-defunct', value: 300000 }],
    }),
  },
  {
    id: 's04-unchi',
    title: 'Succesiune — soț și un unchi',
    blurb: 'Cu o rudă din clasa a IV-a, soțul culege 3/4.',
    input: succession({
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'u', name: 'Gheorghe Mureșan', kind: 'ordinary-collateral', status: 'accepts', degree: 3 }),
      ],
      assets: [{ id: 'a', label: 'Teren propriu', category: 'imobil', regime: 'propriu-defunct', value: 200000 }],
    }),
  },
  {
    id: 's05-reprezentare',
    title: 'Succesiune — reprezentarea copilului predecedat',
    blurb: 'Copilul în viață 1/2. Cei doi nepoți împart tulpina și iau câte 1/4.',
    input: succession({
      heirs: [
        heir({ id: 'c1', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Ana Mureșan', kind: 'descendant', status: 'predeceased', degree: 1 }),
        heir({ id: 'g1', name: 'Luca Mureșan', kind: 'descendant', status: 'accepts', degree: 2, representsId: 'c2' }),
        heir({ id: 'g2', name: 'Maria Mureșan', kind: 'descendant', status: 'accepts', degree: 2, representsId: 'c2' }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 240000 }],
    }),
  },
  {
    id: 's06-renuntare',
    title: 'Succesiune — renunțarea nu deschide reprezentarea',
    blurb: 'Partea copilului care renunță profită fratelui acceptant. Nepotul nu vine în loc.',
    input: succession({
      heirs: [
        heir({ id: 'c1', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Ana Mureșan', kind: 'descendant', status: 'renounces', degree: 1 }),
        heir({ id: 'g', name: 'Luca Mureșan', kind: 'descendant', status: 'accepts', degree: 2, representsId: 'c2' }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 240000 }],
    }),
  },
  {
    id: 's07-vacanta',
    title: 'Succesiune vacantă',
    blurb: 'Nimeni nu vine la moștenire. Nu se eliberează certificat pe acest proiect.',
    input: succession({
      heirs: [heir({ id: 'c', name: 'Sorin Mureșan', kind: 'descendant', status: 'renounces', degree: 1 })],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 100000 }],
    }),
  },
  {
    id: 's08-legat',
    title: 'Succesiune — datorie, uz casnic și legat peste disponibil',
    blurb: 'Disponibilul soțului și al copilului este 1/2. Legatul de 3/4 îl depășește. Raportul integral nu este automat.',
    input: succession({
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'c', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
      ],
      assets: [
        { id: 'a', label: 'Apartament comun', category: 'imobil', regime: 'comun', value: 400000 },
        { id: 'u', label: 'Mobilier de uz casnic', category: 'mobil', regime: 'uz-casnic', value: 15000 },
        { id: 'b', label: 'Cont propriu al defunctului', category: 'mobil', regime: 'propriu-defunct', value: 10000 },
      ],
      debts: [{ id: 'd', label: 'Credit ipotecar', amount: 20000, immovable: true }],
      legacies: [{ id: 'l', beneficiary: 'Pop Maria', numerator: 3, denominator: 4, reservedHeir: false }],
    }),
  },
  {
    id: 's09-impozit',
    title: 'Succesiune finalizată după doi ani',
    blurb: 'Deces la 15 ianuarie 2023, finalizare la 14 octombrie 2026. Impozit 1% pe netul imobiliar.',
    input: succession({
      deathOn: '2023-01-15',
      finalizedOn: '2026-10-14',
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'c', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 180000 }],
    }),
  },
  {
    id: 's10-fara-scutire-170',
    title: 'Succesiune — Legea nr. 170/2026 nu mai acoperă',
    blurb: 'Termenul de doi ani cădea în vara lui 2026, dar finalizarea este la 14 octombrie 2026. Impozitul de 1% se datorează.',
    input: succession({
      deathOn: '2024-08-01',
      finalizedOn: '2026-10-14',
      heirs: [heir({ id: 'c', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 })],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 100000 }],
    }),
  },
  {
    id: 's11-sot-parinte',
    title: 'Succesiune — soț și un părinte',
    blurb: 'Nu sunt descendenți și nu sunt frați. Soțul și părintele iau câte 1/2.',
    input: succession({
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 't', name: 'Vasile Mureșan', kind: 'parent', status: 'accepts', degree: 1 }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 200000 }],
    }),
  },
  {
    id: 's12-numai-sotul',
    title: 'Succesiune — numai soțul',
    blurb: 'Nu vine nicio rudă din cele patru clase. Soțul culege întreaga moștenire.',
    input: succession({
      heirs: [heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 })],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 150000 }],
    }),
  },
  {
    id: 's13-nedemn',
    title: 'Succesiune — nedemnitatea deschide reprezentarea',
    blurb: 'Copilul nedemn este reprezentat de fiul său. Renunțarea nu ar fi deschis aceeași reprezentare.',
    input: succession({
      heirs: [
        heir({ id: 'c1', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Ana Mureșan', kind: 'descendant', status: 'unworthy', degree: 1 }),
        heir({ id: 'g', name: 'Luca Mureșan', kind: 'descendant', status: 'accepts', degree: 2, representsId: 'c2' }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 240000 }],
    }),
  },
  {
    id: 's14-locuinta',
    title: 'Succesiune — soț fără altă locuință',
    blurb: 'Art. 973 recunoaște dreptul de abitație. Cotele rămân 1/4 pentru soț și 3/4 pentru copil.',
    input: succession({
      spouseHasAnotherHome: false,
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'c', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
      ],
      assets: [{ id: 'a', label: 'Casa în care a locuit', category: 'imobil', regime: 'propriu-defunct', value: 200000 }],
    }),
  },
  {
    id: 's15-sot-doi-copii',
    title: 'Succesiune — soț și doi copii',
    blurb: 'Soțul ia 1/4. Cei doi copii împart restul, câte 3/8.',
    input: succession({
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'c1', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Ana Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 400000 }],
    }),
  },
];

function successionDocument(input: SuccessionInput, part: 'certificat' | 'incheiere', office: OfficeProfile): ActDocument {
  const result = computeSuccession(input);
  return part === 'certificat' ? successionCertificate(input, result, office) : successionClosing(input, result, office);
}

export const successionModels: SuccessionModel[] = successionCases.flatMap((item) => [
  {
    kind: 'succession' as const,
    id: `${item.id}-certificat`,
    title: `${item.title} — certificat`,
    blurb: item.blurb,
    build: (office: OfficeProfile) => successionDocument(item.input, 'certificat', office),
  },
  {
    kind: 'succession' as const,
    id: `${item.id}-incheiere`,
    title: `${item.title} — încheiere`,
    blurb: item.blurb,
    build: (office: OfficeProfile) => successionDocument(item.input, 'incheiere', office),
  },
]);

export const libraryModels: LibraryModel[] = [...actModels, ...successionModels, ...otherModels];
