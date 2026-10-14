import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import mammoth from 'mammoth';
import type { ActTemplate, OfficeProfile } from '@/domain/types';
import { checkCnp } from './cnp';
import { documentToDocx } from './docxExport';
import { FIXED_FEES, feeImobil, feeSuccesiune, withVat } from './fees';
import { keepForField } from './fieldInput';
import { roundMoney, isAfterYears } from './money';
import { detectTemplate, matchLaws, reviewText } from './quality';
import { extractActValues } from './rebuildAct';
import { Fraction } from './fraction';
import { computeSuccession, type HeirInput, type SuccessionInput } from './succession';
import { templates } from '@/modules/templates';
import { successionCertificate, successionClosing } from '@/modules/successionDoc';
import { amount } from '@/modules/document';
import { successionTax, transferTax } from './tax';

const ROOT = path.resolve(process.cwd(), 'TestActeContracteModeleGenerate');
const OFFICE: OfficeProfile = {
  notaryName: 'Ionescu Andrei',
  chamber: 'Camera Notarilor Publici Cluj',
  address: 'Cluj-Napoca, str. Memorandumului nr. 28',
  license: '145/12.03.2019',
  circumscription: 'Circumscripția Tribunalului Cluj',
  vatPayer: false,
};
const DATE = '2026-10-14';
const PLACE = 'municipiul Cluj-Napoca';
const KEY = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];

function cnp(sex: number, yymmdd: string, county: string, order: string): string {
  const base = `${sex}${yymmdd}${county}${order}`;
  const digits = base.split('').map(Number);
  const sum = KEY.reduce((total, weight, index) => total + weight * digits[index], 0);
  const control = sum % 11 === 10 ? 1 : sum % 11;
  const value = `${base}${control}`;
  if (!checkCnp(value).valid) throw new Error(`CNP invalid generat: ${value}`);
  return value;
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
  nepot: cnp(5, '120815', '12', '010'),
  nepoata: cnp(6, '150201', '12', '011'),
  unchi: cnp(1, '480515', '12', '012'),
  vlad: cnp(1, '760418', '12', '013'),
  dana: cnp(2, '790903', '12', '014'),
  costin: cnp(1, '680211', '12', '015'),
  vera: cnp(2, '710625', '12', '016'),
};

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

function property(description: string, cf = '123456', cadastral = '12345-C1') {
  return {
    imobil: description,
    uat: 'Cluj-Napoca',
    judet: 'Cluj',
    cf,
    cadastral,
    suprafata: '52,40 mp',
  };
}

const APT = 'apartament cu doua camere si dependinte, strada Memorandumului nr 28, ap 12, Cluj-Napoca'.replace(
  'doua camere si dependinte',
  'două camere și dependințe',
);
const LAND = 'teren agricol extravilan, tarla 12, parcela 4, comuna Apahida';

function baseAct() {
  return { dataAct: DATE, locAct: PLACE };
}

interface Variant {
  file: string;
  templateId: string;
  values: Record<string, string>;
  /** Valori care trebuie să supraviețuiască extragerii din textul generat. */
  facts: Record<string, string>;
  absent?: string[];
  includes: string[];
  excludes?: string[];
}

function variants(): Variant[] {
  const seller = person('v', 'Mureșan Andrei', P.andrei, '100001', home('Memorandumului', '28'), 'căsătorit');
  const buyer = person('c', 'Popescu Elena-Maria', P.elena, '100002', home('Horea', '10'), 'necăsătorită');
  const sellers = person(
    'v',
    'Mureșan Andrei și Mureșan Ioana',
    P.andrei,
    '100003',
    home('Memorandumului', '28'),
    'căsătorit',
  );
  const buyers = person('c', 'Popescu Vlad și Popescu Dana', P.vlad, '100004', home('Observatorului', '6'), 'căsătorit');
  return [
    {
      file: '01-vanzare-propriu-integral',
      templateId: 'vanzare-imobil',
      values: {
        ...baseAct(),
        ...seller,
        ...buyer,
        vRegim: 'propriu',
        ...property(APT),
        pret: '250000',
        plata: 'integral',
        dobandire: '2018-01-15',
        grila: '240000',
        sarcini: 'liber de sarcini, potrivit extrasului de carte funciară anexat',
        observatii: 'Predarea include și boxa notată în anexă',
      },
      facts: {
        vNume: 'Mureșan Andrei',
        cNume: 'Popescu Elena-Maria',
        vCnp: P.andrei,
        cCnp: P.elena,
        vRegim: 'propriu',
        plata: 'integral',
        pret: '250000',
        grila: '240000',
        dobandire: '2018-01-15',
        dataAct: DATE,
        uat: 'Cluj-Napoca',
        judet: 'Cluj',
        cf: '123456',
        cadastral: '12345-C1',
        locAct: PLACE,
        imobil: APT,
      },
      absent: ['ipoteca', 'extravilan'],
      includes: ['CONTRACT DE VÂNZARE', 'bun propriu', 'art. 1674', 'art. 1695', 'art. 111', 'art. 1244', 'Capitolul I'],
      excludes: ['art. 2386', 'ipotecă legală', 'teren agricol situat în extravilan'],
    },
    {
      file: '02-vanzare-comun-partial-ipoteca',
      templateId: 'vanzare-imobil',
      values: {
        ...baseAct(),
        ...sellers,
        ...buyers,
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
      facts: {
        vNume: 'Mureșan Andrei și Mureșan Ioana',
        cNume: 'Popescu Vlad și Popescu Dana',
        vRegim: 'comun',
        plata: 'partial',
        ipoteca: 'da',
        pret: '180000',
        rest: '50000 lei, scadent la 14 aprilie 2027',
        cadastral: '23456-C1-U12',
      },
      absent: ['extravilan'],
      includes: ['Vânzătorii', 'Cumpărătorii', 'devălmășie', 'art. 2386 pct. 1', 'nu este achitat integral', 'Capitolul II bis'],
      excludes: ['Prețul se achită din credit'],
    },
    {
      file: '03-vanzare-cota-credit',
      templateId: 'vanzare-imobil',
      values: {
        ...baseAct(),
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
      facts: { vRegim: 'cota', vCota: '1/2', plata: 'credit', pret: '90000' },
      absent: ['ipoteca', 'extravilan'],
      includes: ['înstrăinează cota de 1/2', 'Prețul se achită din credit', 'Condițiile finanțării și eventuala ipotecă'],
      excludes: ['art. 2386', 'ipotecă legală'],
    },
    {
      file: '04-vanzare-extravilan',
      templateId: 'vanzare-imobil',
      values: {
        ...baseAct(),
        ...person('v', 'Costin Mureșan', P.costin, '100005', home('Fabricii', '2'), 'divorțat'),
        ...person('c', 'Ana Pop', P.ana, '100006', home('Traian', '15'), 'necăsătorită'),
        vRegim: 'propriu',
        ...property(LAND, '456789', '45678'),
        suprafata: '5000 mp',
        pret: '120000',
        plata: 'integral',
        dobandire: '2010-04-01',
        grila: '120000',
        extravilan: 'da',
        sarcini: 'liber de sarcini, sub condiția avizelor de preempțiune',
      },
      facts: { vRegim: 'propriu', plata: 'integral', extravilan: 'da', suprafata: '5000 mp', imobil: LAND },
      absent: ['ipoteca'],
      includes: ['Legea nr. 17/2014', 'teren agricol situat în extravilan', 'oprește actul'],
    },
    {
      file: '05-donatie-scutit',
      templateId: 'donatie-imobil',
      values: {
        ...baseAct(),
        ...person('d', 'Petre Mureșan', P.petru, '100007', home('Moților', '9'), 'văduv'),
        ...person('b', 'Sorin Mureșan', P.sorin, '100008', home('Moților', '9'), 'necăsătorit'),
        grad: 'scutit',
        ...property(APT, '567890', '56789-C3'),
        sarcini: 'donație pură și simplă, fără sarcină',
      },
      facts: { dNume: 'Petre Mureșan', bNume: 'Sorin Mureșan', grad: 'scutit', dCnp: P.petru, bCnp: P.sorin },
      includes: ['CONTRACT DE DONAȚIE', 'art. 1011', 'sunt soți sau rude', 'art. 111 alin. (2)'],
      excludes: ['nu sunt în cazul de scutire'],
    },
    {
      file: '06-donatie-impozabil',
      templateId: 'donatie-imobil',
      values: {
        ...baseAct(),
        ...person('d', 'Vera Mureșan', P.vera, '100009', home('Barițiu', '4'), 'căsătorită'),
        ...person('b', 'Radu Ionescu', P.radu, '100010', home('Napoca', '1'), 'necăsătorit'),
        grad: 'impozabil',
        ...property(APT, '678901', '67890-C4'),
        sarcini: 'donație pură și simplă, fără sarcină',
      },
      facts: { grad: 'impozabil', dNume: 'Vera Mureșan', bNume: 'Radu Ionescu' },
      includes: ['nu sunt în cazul de scutire', 'art. 1011'],
      excludes: ['declară că sunt soți sau rude'],
    },
    {
      file: '07-procura-speciala',
      templateId: 'procura',
      values: {
        ...baseAct(),
        ...person('m', 'Mihai Pop', P.mihai, '100011', home('Clinicilor', '8'), 'căsătorit'),
        tNume: 'Radu Ionescu',
        tCnp: P.radu,
        tDomiciliu: home('Napoca', '1'),
        fel: 'speciala',
        obiect: 'depună la primărie cererea de racordare și să ridice certificatul de atestare fiscală',
        durata: 'un an de la data autentificării',
      },
      facts: {
        mNume: 'Mihai Pop',
        tNume: 'Radu Ionescu',
        tCnp: P.radu,
        fel: 'speciala',
        obiect: 'depună la primărie cererea de racordare și să ridice certificatul de atestare fiscală',
        durata: 'un an de la data autentificării',
      },
      absent: ['pret'],
      includes: ['PROCURĂ', 'art. 2013', 'Onorariul minimal pentru procura de reprezentare este 100 lei', 'anexa nr. 1 pct. 5.1'],
      excludes: ['numai pentru încasarea pensiei', 'anexa nr. 2 pct. XIV'],
    },
    {
      file: '08-procura-pensie',
      templateId: 'procura',
      values: {
        ...baseAct(),
        ...person('m', 'Petre Mureșan', P.petru, '100012', home('Moților', '9'), 'văduv'),
        tNume: 'Ioana Mureșan',
        tCnp: P.ioana,
        tDomiciliu: home('Moților', '9'),
        fel: 'pensie',
        obiect: 'încaseze pensia pentru limită de vârstă și să semneze borderourile casei de pensii',
        durata: 'până la revocarea expresă',
      },
      facts: { fel: 'pensie', tNume: 'Ioana Mureșan', mCnp: P.petru },
      absent: ['pret'],
      includes: ['Procura este dată numai pentru încasarea pensiei', 'Onorariul minimal este 8 lei', 'anexa nr. 1 pct. 5.2'],
      excludes: ['anexa nr. 2 pct. XIV', 'Onorariul minimal pentru procura de reprezentare este 100 lei'],
    },
    {
      file: '09-procura-incasare-pret',
      templateId: 'procura',
      values: {
        ...baseAct(),
        ...person('m', 'Andrei Mureșan', P.andrei, '100013', home('Memorandumului', '28'), 'căsătorit'),
        tNume: 'Radu Ionescu',
        tCnp: P.radu,
        tDomiciliu: home('Napoca', '1'),
        fel: 'speciala',
        obiect: 'semneze actul autentic de înstrăinare a apartamentului din Cluj-Napoca',
        durata: 'până la semnarea actului sau până la revocare',
        pret: 'da',
      },
      facts: { fel: 'speciala', pret: 'da', tCnp: P.radu },
      includes: ['mandatarul încasează prețul', 'anexa nr. 2 pct. XIV', 'art. 11 alin. (6)'],
      excludes: ['numai pentru încasarea pensiei'],
    },
    {
      file: '10-antecontract',
      templateId: 'antecontract',
      values: {
        ...baseAct(),
        ...person('p', 'Mihai Pop', P.mihai, '100014', home('Clinicilor', '8'), 'căsătorit'),
        ...person('b', 'Elena Popescu', P.elena, '100015', home('Horea', '10'), 'necăsătorită'),
        ...property(APT, '789012', '78901-C5'),
        pret: '250000',
        avans: '50000',
        termen: '2027-03-15',
      },
      facts: {
        pNume: 'Mihai Pop',
        bNume: 'Elena Popescu',
        pret: '250000',
        avans: '50000',
        termen: '2027-03-15',
        imobil: APT,
      },
      absent: ['extravilan'],
      includes: ['PROMISIUNE BILATERALĂ', 'nu se intabulează ca vânzare', 'art. 1669', 'Avansul de'],
    },
    {
      file: '11-antecontract-extravilan',
      templateId: 'antecontract',
      values: {
        ...baseAct(),
        ...person('p', 'Costin Mureșan', P.costin, '100016', home('Fabricii', '2'), 'divorțat'),
        ...person('b', 'Dana Popescu', P.dana, '100017', home('Observatorului', '6'), 'căsătorită'),
        ...property(LAND, '890123', '89012'),
        suprafata: '5000 mp',
        pret: '120000',
        avans: '20000',
        termen: '2027-06-01',
        extravilan: 'da',
      },
      facts: { extravilan: 'da', avans: '20000', termen: '2027-06-01', pret: '120000' },
      includes: ['Obiectul este teren agricol extravilan', 'Art. 5 din Legea nr. 17/2014'],
    },
    {
      file: '12-intretinere',
      templateId: 'intretinere',
      values: {
        ...baseAct(),
        ...person('c', 'Vera Mureșan', P.vera, '100018', home('Barițiu', '4'), 'căsătorită'),
        ...person('d', 'Sorin Mureșan', P.sorin, '100019', home('Barițiu', '4'), 'necăsătorit'),
        ...property(APT, '901234', '90123-C6'),
        continut: 'hrană zilnică, îngrijire medicală și plata utilităților locuinței',
        dobandire: '2016-09-01',
      },
      facts: {
        cNume: 'Vera Mureșan',
        dNume: 'Sorin Mureșan',
        continut: 'hrană zilnică, îngrijire medicală și plata utilităților locuinței',
        dobandire: '2016-09-01',
        imobil: APT,
      },
      includes: ['CONTRACT DE ÎNTREȚINERE', 'nu este donație', 'art. 2254', 'constând în'],
    },
    {
      file: '13-conventie-separatie',
      templateId: 'conventie',
      values: {
        ...baseAct(),
        ...person('a', 'Andrei Mureșan', P.andrei, '100020', home('Memorandumului', '28'), 'căsătorit'),
        ...person('b', 'Ioana Mureșan', P.ioana, '100021', home('Memorandumului', '28'), 'căsătorită'),
        regim: 'separatie',
        efect: 'de la data căsătoriei, față de soți, și de la notarea în cartea funciară, față de terți',
        inventar: 'apartament în Cluj-Napoca, CF 123456, deținut pe cote după separație, și autoturism bun propriu al soțului',
      },
      facts: {
        regim: 'separatie',
        aNume: 'Andrei Mureșan',
        bNume: 'Ioana Mureșan',
        inventar: 'apartament în Cluj-Napoca, CF 123456, deținut pe cote după separație, și autoturism bun propriu al soțului',
      },
      includes: ['adoptă regimul separației de bunuri', 'art. 330'],
      excludes: ['adoptă comunitatea convențională', 'revin la comunitatea legală'],
    },
    {
      file: '14-conventie-conventionala',
      templateId: 'conventie',
      values: {
        ...baseAct(),
        ...person('a', 'Vlad Popescu', P.vlad, '100022', home('Observatorului', '6'), 'căsătorit'),
        ...person('b', 'Dana Popescu', P.dana, '100023', home('Observatorului', '6'), 'căsătorită'),
        regim: 'conventionala',
        efect: 'de la autentificare, pentru bunurile dobândite după această dată',
        inventar: 'apartament comun, CF 234567, inclus în comunitatea convențională, și cont bancar propriu al soției',
      },
      facts: { regim: 'conventionala' },
      includes: ['adoptă comunitatea convențională'],
      excludes: ['adoptă regimul separației de bunuri', 'revin la comunitatea legală'],
    },
    {
      file: '15-conventie-legala',
      templateId: 'conventie',
      values: {
        ...baseAct(),
        ...person('a', 'Mihai Pop', P.mihai, '100024', home('Clinicilor', '8'), 'căsătorit'),
        ...person('b', 'Elena Pop', P.elena, '100025', home('Clinicilor', '8'), 'căsătorită'),
        regim: 'legala',
        efect: 'de la data autentificării, cu lichidarea separată a regimului anterior',
        inventar: 'apartament în Cluj-Napoca, CF 345678, care redevine bun comun după revenirea la comunitatea legală',
      },
      facts: { regim: 'legala' },
      includes: ['revin la comunitatea legală', 'art. 340'],
      excludes: ['adoptă regimul separației de bunuri', 'adoptă comunitatea convențională'],
    },
    {
      file: '16-testament-executor-martori',
      templateId: 'testament',
      values: {
        ...baseAct(),
        ...person('t', 'Petre Mureșan', P.petru, '100026', home('Moților', '9'), 'văduv'),
        dispozitii: 'Las moștenire nepoatei Pop Maria cota disponibilă din apartamentul din Cluj-Napoca, cu respectarea rezervei descendenților',
        executor: 'Radu Ionescu',
        martori: 'da',
      },
      facts: {
        tNume: 'Petre Mureșan',
        tCnp: P.petru,
        dispozitii: 'Las moștenire nepoatei Pop Maria cota disponibilă din apartamentul din Cluj-Napoca, cu respectarea rezervei descendenților',
        executor: 'Radu Ionescu',
        martori: 'da',
      },
      includes: ['TESTAMENT', 'art. 1044', 'art. 1088', 'cere asistența a unul sau doi martori', 'executor testamentar pe Radu Ionescu'],
      excludes: ['nu cere martori'],
    },
    {
      file: '17-testament-fara-martori',
      templateId: 'testament',
      values: {
        ...baseAct(),
        ...person('t', 'Vera Mureșan', P.vera, '100027', home('Barițiu', '4'), 'căsătorită'),
        dispozitii: 'Las moștenire fiului Sorin Mureșan întreaga cotitate disponibilă, rezerva soțului și a descendenților rămânând neatinsă',
      },
      facts: {
        tNume: 'Vera Mureșan',
        dispozitii: 'Las moștenire fiului Sorin Mureșan întreaga cotitate disponibilă, rezerva soțului și a descendenților rămânând neatinsă',
      },
      absent: ['martori', 'executor'],
      includes: ['nu cere martori', 'Nu desemnează executor testamentar'],
      excludes: ['cere asistența a unul sau doi martori'],
    },
    {
      file: '18-acceptare-adult',
      templateId: 'acceptare',
      values: {
        ...baseAct(),
        ...person('m', 'Sorin Mureșan', P.sorin, '100028', home('Moților', '9'), 'necăsătorit'),
        defunct: 'Petre Mureșan',
        deces: '2024-03-01',
        domDefunct: 'Cluj-Napoca, strada Horea nr 10',
      },
      facts: {
        mNume: 'Sorin Mureșan',
        mCnp: P.sorin,
        defunct: 'Petre Mureșan',
        deces: '2024-03-01',
        domDefunct: 'Cluj-Napoca, strada Horea nr 10',
      },
      absent: ['minor'],
      includes: ['DECLARAȚIE DE ACCEPTARE', 'art. 1108', 'art. 1103', 'capacitate deplină', 'nu am renunțat'],
      excludes: ['Succesibilul este minor'],
    },
    {
      file: '19-acceptare-minor',
      templateId: 'acceptare',
      values: {
        ...baseAct(),
        ...person('m', 'Luca Mureșan', P.luca, '100029', home('Moților', '9'), 'necăsătorit'),
        defunct: 'Petre Mureșan',
        deces: '2025-06-15',
        domDefunct: 'Cluj-Napoca, strada Horea nr 10',
        minor: 'da',
      },
      facts: { minor: 'da', mCnp: P.luca, defunct: 'Petre Mureșan', deces: '2025-06-15' },
      includes: ['Succesibilul este minor', 'Deciziei ÎCCJ nr. 58/2024', 'instanței de tutelă'],
      excludes: ['capacitate deplină de exercițiu'],
    },
    {
      file: '20-renuntare',
      templateId: 'renuntare',
      values: {
        ...baseAct(),
        ...person('m', 'Sorin Mureșan', P.sorin, '100030', home('Unirii', '3'), 'necăsătorit'),
        defunct: 'Petre Mureșan',
        deces: '2024-03-01',
        calitate: 'fiu al defunctului',
      },
      facts: {
        mNume: 'Sorin Mureșan',
        defunct: 'Petre Mureșan',
        deces: '2024-03-01',
        calitate: 'fiu al defunctului',
      },
      includes: ['DECLARAȚIE DE RENUNȚARE', 'Declar că renunț', 'art. 1120', 'art. 1121', 'nu mă reprezintă'],
    },
  ];
}

function sameMoney(actual: string | undefined, expected: string): boolean {
  return amount({ v: actual ?? '' }, 'v') === amount({ v: expected }, 'v');
}

function buttonIssues(text: string) {
  const found = detectTemplate(text, templates);
  const structural = found
    ? found.template.markers
        .filter((marker) => !marker.pattern.test(text))
        .map((marker) =>
          /^art\./i.test(marker.label)
            ? { level: 'info' as const, message: `Textul nu citează ${marker.label}.` }
            : { level: 'error' as const, message: `Lipsește elementul de structură: ${marker.label}.` },
        )
    : [{ level: 'error' as const, message: 'Modelul nu a fost recunoscut.' }];
  return { found, issues: [...structural, ...reviewText(text)] };
}

function moneyKeys(key: string): boolean {
  return key === 'pret' || key === 'grila' || key === 'avans';
}

describe('modele generate și verificate', () => {
  it('scrie fiecare act și fiecare succesiune, apoi le verifică din nou', async () => {
    await rm(ROOT, { recursive: true, force: true });
    await mkdir(path.join(ROOT, 'acte'), { recursive: true });
    await mkdir(path.join(ROOT, 'succesiuni'), { recursive: true });
    await mkdir(path.join(ROOT, 'calcule'), { recursive: true });

    const report: string[] = [
      'RAPORT DE VERIFICARE — PROIECTE GENERATE LOCAL',
      'Data lucrării: 14 octombrie 2026. Legea folosită de motor este cea verificată la 14 octombrie 2026.',
      'Fiecare fișier este proiect de lucru, nu înscris autentic.',
      '',
    ];
    const failures: string[] = [];

    for (const variant of variants()) {
      const template = templates.find((item) => item.id === variant.templateId);
      if (!template) {
        failures.push(`${variant.file}: model lipsă`);
        continue;
      }
      const kept = sanitize(template, variant.values, failures, variant.file);
      const act = template.generate(kept, OFFICE);
      const text = act.plainText;
      await writeFile(path.join(ROOT, 'acte', `${variant.file}.txt`), text, 'utf8');
      const blob = await documentToDocx(act);
      const docx = Buffer.from(await blob.arrayBuffer());
      const docxPath = path.join(ROOT, 'acte', `${variant.file}.docx`);
      await writeFile(docxPath, docx);
      const docxText = (await mammoth.extractRawText({ buffer: docx })).value;
      if (!docxText.includes(act.title) || !docxText.includes('PROIECT DE LUCRU')) {
        failures.push(`${variant.file}: DOCX nu conține titlul sau bannerul`);
      }

      const first = buttonIssues(text);
      const extracted = first.found ? extractActValues(text, first.found.template) : {};
      const again = first.found ? first.found.template.generate(extracted, OFFICE).plainText : '';
      const second = again ? buttonIssues(again) : undefined;
      const reverif = first.found ? reviewText(again || text, first.found.template, extracted) : [];
      const problems = problemsOf(variant, template, text, first, extracted, second, reverif, docxText);
      failures.push(...problems.map((problem) => `${variant.file}: ${problem}`));
      report.push(block(variant.file, template.title.ro, first.found?.template.id ?? '—', first.issues, problems, matchLaws(text)));
    }

    const successionNotes = await writeSuccessions(failures);
    report.push(...successionNotes);
    const calcNotes = writeCalculations();
    for (const line of calcNotes) if (line.startsWith('NU:')) failures.push(line);
    await writeFile(path.join(ROOT, 'calcule', 'calcule-impozit-si-onorarii.txt'), calcNotes.join('\n'), 'utf8');
    report.push('', ...calcNotes);
    report.push('', failures.length ? `PROBLEME: ${failures.length}` : 'Nicio problemă de structură, de câmp sau de calcul pe modelele generate.');
    if (failures.length) report.push(...failures.map((failure) => `- ${failure}`));
    await writeFile(path.join(ROOT, '00-RAPORT-VERIFICARE.txt'), report.join('\n'), 'utf8');

    expect(failures, failures.slice(0, 40).join('\n')).toEqual([]);
  }, 180000);
});

function sanitize(template: ActTemplate, values: Record<string, string>, failures: string[], file: string) {
  const kept: Record<string, string> = {};
  for (const field of template.fields) {
    const raw = values[field.key];
    if (raw == null || raw === '') continue;
    if (field.required && !raw.trim()) failures.push(`${file}: câmp obligatoriu gol la sursă ${field.key}`);
    const next = keepForField(field, raw);
    if (next !== raw) failures.push(`${file}: câmpul ${field.key} respinge „${raw}” și păstrează „${next}”`);
    if (field.key.toLowerCase().includes('cnp') && !checkCnp(raw).valid) failures.push(`${file}: CNP ${field.key}`);
    kept[field.key] = next;
  }
  for (const field of template.fields) {
    if (field.required && !kept[field.key]?.trim()) failures.push(`${file}: obligatoriu lipsă ${field.key}`);
  }
  return kept;
}

function problemsOf(
  variant: Variant,
  template: ActTemplate,
  text: string,
  first: ReturnType<typeof buttonIssues>,
  extracted: Record<string, string>,
  second: ReturnType<typeof buttonIssues> | undefined,
  reverif: { level: string; message: string }[],
  docxText: string,
): string[] {
  const problems: string[] = [];
  if (!docxText.includes('PROIECT DE LUCRU')) problems.push('DOCX nu păstrează bannerul de proiect');
  if (text.includes('……') || text.includes('[●]')) problems.push('proiectul complet încă are …… sau [●]');
  if (!text.includes('PROIECT DE LUCRU — NU ESTE ÎNSCRIS AUTENTIC')) problems.push('lipsește bannerul de proiect');
  if (first.found?.template.id !== variant.templateId) {
    problems.push(`Verifică a recunoscut „${first.found?.template.id ?? 'nimic'}”, așteptat ${variant.templateId}`);
  }
  for (const issue of first.issues) {
    if (issue.level !== 'info') problems.push(`Verifică ${issue.level}: ${issue.message}`);
  }
  for (const issue of reverif) {
    if (issue.level === 'error' || issue.level === 'warn') problems.push(`Reverificare ${issue.level}: ${issue.message}`);
  }
  if (second?.found?.template.id !== variant.templateId) {
    problems.push(`după regenerare modelul este „${second?.found?.template.id ?? 'nimic'}”`);
  }
  for (const issue of second?.issues ?? []) {
    if (issue.level !== 'info') problems.push(`a doua Verificare ${issue.level}: ${issue.message}`);
  }
  for (const key of variant.absent ?? []) {
    if (extracted[key]) problems.push(`${key} nu trebuia bifat, este „${extracted[key]}”`);
  }
  for (const needle of variant.includes) {
    if (!text.includes(needle)) problems.push(`lipsește din act: ${needle}`);
  }
  for (const needle of variant.excludes ?? []) {
    if (text.includes(needle)) problems.push(`actul conține o clauză necerută: ${needle}`);
  }
  for (const [key, expected] of Object.entries(variant.values)) {
    const actual = extracted[key];
    const ok = moneyKeys(key) ? sameMoney(actual, expected) : actual === expected;
    if (!ok) problems.push(`${key}: extras „${actual ?? ''}”, așteptat „${expected}”`);
  }
  const regenerated = template.generate(extracted, OFFICE).plainText;
  for (const field of template.fields) {
    if (!field.required) continue;
    if (!extracted[field.key]?.trim()) problems.push(`după Verifică lipsește obligatoriu ${field.key}`);
  }
  if (regenerated.includes('[●]')) problems.push('regenerarea pune [●] în antet');
  return problems;
}

function block(
  file: string,
  title: string,
  detected: string,
  issues: { level: string; message: string }[],
  problems: string[],
  laws: { citation: string; known: boolean; title: string }[],
): string {
  const unknown = laws.filter((law) => !law.known).map((law) => law.citation);
  return [
    `== ${file} ==`,
    `Model: ${title}. Recunoscut la Verifică: ${detected}.`,
    problems.length ? `Probleme: ${problems.join(' | ')}` : 'Verifică: structură prezentă, câmpurile completate se regăsesc, regenerarea păstrează modelul.',
    issues.length ? `Mențiuni: ${issues.map((issue) => `${issue.level}: ${issue.message}`).join(' | ')}` : 'Fără mențiuni.',
    unknown.length ? `Articole citate și necunoscute în baza locală (nu au fost șterse): ${unknown.join(', ')}.` : 'Articolele de 3–4 cifre găsite sunt în baza locală.',
    '',
  ].join('\n');
}

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

async function writeSuccessions(failures: string[]): Promise<string[]> {
  const lines = ['', 'SUCCESIUNI', ''];
  const cases: { file: string; title: string; input: SuccessionInput; expectShares: Record<string, string>; expectGross: number; tax: number }[] = [];

  cases.push({
    file: '01-sot-si-un-copil',
    title: 'Soț și un copil, bun comun, finalizată în 2 ani',
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
    expectShares: { s: '1/4', c: '3/4' },
    expectGross: 200000,
    tax: 0,
  });

  cases.push({
    file: '02-doi-copii-fara-sot',
    title: 'Doi copii, fără soț',
    input: succession({
      heirs: [
        heir({ id: 'c1', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Ana Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 300000 }],
    }),
    expectShares: { c1: '1/2', c2: '1/2' },
    expectGross: 300000,
    tax: 0,
  });

  cases.push({
    file: '03-sot-parinti-frate',
    title: 'Soț, ambii părinți și un frate, art. 972 și art. 978',
    input: succession({
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 't', name: 'Vasile Mureșan', kind: 'parent', status: 'accepts', degree: 1 }),
        heir({ id: 'm', name: 'Maria Mureșan', kind: 'parent', status: 'accepts', degree: 1 }),
        heir({ id: 'f', name: 'Radu Mureșan', kind: 'privileged-collateral', status: 'accepts', degree: 2, line: 'both' }),
      ],
      assets: [{ id: 'a', label: 'Casă proprie', category: 'imobil', regime: 'propriu-defunct', value: 300000 }],
    }),
    expectShares: { s: '1/3', t: '1/6', m: '1/6', f: '1/3' },
    expectGross: 300000,
    tax: 0,
  });

  cases.push({
    file: '04-sot-si-un-parinte',
    title: 'Soț și un singur părinte',
    input: succession({
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 't', name: 'Vasile Mureșan', kind: 'parent', status: 'accepts', degree: 1 }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 200000 }],
    }),
    expectShares: { s: '1/2', t: '1/2' },
    expectGross: 200000,
    tax: 0,
  });

  cases.push({
    file: '05-sot-si-unchi',
    title: 'Soț și un unchi, clasa a IV-a',
    input: succession({
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'u', name: 'Gheorghe Mureșan', kind: 'ordinary-collateral', status: 'accepts', degree: 3 }),
      ],
      assets: [{ id: 'a', label: 'Teren propriu', category: 'imobil', regime: 'propriu-defunct', value: 200000 }],
    }),
    expectShares: { s: '3/4', u: '1/4' },
    expectGross: 200000,
    tax: 0,
  });

  cases.push({
    file: '06-numai-sotul',
    title: 'Numai soțul supraviețuitor',
    input: succession({
      heirs: [heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 })],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 150000 }],
    }),
    expectShares: { s: '1/1' },
    expectGross: 150000,
    tax: 0,
  });

  cases.push({
    file: '07-reprezentare-nepoti',
    title: 'Reprezentarea copilului predecedat',
    input: succession({
      heirs: [
        heir({ id: 'c1', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Ana Mureșan', kind: 'descendant', status: 'predeceased', degree: 1 }),
        heir({ id: 'g1', name: 'Luca Mureșan', kind: 'descendant', status: 'accepts', degree: 2, representsId: 'c2' }),
        heir({ id: 'g2', name: 'Maria Mureșan', kind: 'descendant', status: 'accepts', degree: 2, representsId: 'c2' }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 240000 }],
    }),
    expectShares: { c1: '1/2', g1: '1/4', g2: '1/4' },
    expectGross: 240000,
    tax: 0,
  });

  cases.push({
    file: '08-renuntare-fara-reprezentare',
    title: 'Renunțarea nu deschide reprezentarea',
    input: succession({
      heirs: [
        heir({ id: 'c1', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Ana Mureșan', kind: 'descendant', status: 'renounces', degree: 1 }),
        heir({ id: 'g', name: 'Luca Mureșan', kind: 'descendant', status: 'accepts', degree: 2, representsId: 'c2' }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 240000 }],
    }),
    expectShares: { c1: '1/1' },
    expectGross: 240000,
    tax: 0,
  });

  cases.push({
    file: '09-nedemn-cu-reprezentare',
    title: 'Nedemnitatea deschide reprezentarea',
    input: succession({
      heirs: [
        heir({ id: 'c1', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Ana Mureșan', kind: 'descendant', status: 'unworthy', degree: 1 }),
        heir({ id: 'g', name: 'Luca Mureșan', kind: 'descendant', status: 'accepts', degree: 2, representsId: 'c2' }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 240000 }],
    }),
    expectShares: { c1: '1/2', g: '1/2' },
    expectGross: 240000,
    tax: 0,
  });

  cases.push({
    file: '10-succesiune-vacanta',
    title: 'Nimeni nu vine la moștenire',
    input: succession({
      heirs: [heir({ id: 'c', name: 'Sorin Mureșan', kind: 'descendant', status: 'renounces', degree: 1 })],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 100000 }],
    }),
    expectShares: {},
    expectGross: 100000,
    tax: 0,
  });

  cases.push({
    file: '11-masa-datorii-uz-casnic-legat',
    title: 'Comunitate, datorie, uz casnic și legat peste disponibil',
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
    expectShares: { s: '1/4', c: '3/4' },
    expectGross: 210000,
    tax: 0,
  });

  cases.push({
    file: '12-sot-fara-alta-locuinta',
    title: 'Soț fără altă locuință, art. 973, cote neschimbate',
    input: succession({
      spouseHasAnotherHome: false,
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'c', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
      ],
      assets: [{ id: 'a', label: 'Casa în care a locuit', category: 'imobil', regime: 'propriu-defunct', value: 200000 }],
    }),
    expectShares: { s: '1/4', c: '3/4' },
    expectGross: 200000,
    tax: 0,
  });

  cases.push({
    file: '13-sot-si-doi-copii',
    title: 'Soț și doi copii',
    input: succession({
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'c1', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
        heir({ id: 'c2', name: 'Ana Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 400000 }],
    }),
    expectShares: { s: '1/4', c1: '3/8', c2: '3/8' },
    expectGross: 400000,
    tax: 0,
  });

  cases.push({
    file: '14-finalizata-dupa-doi-ani',
    title: 'Finalizată după 2 ani: impozit 1% pe netul imobiliar',
    input: succession({
      deathOn: '2023-01-15',
      finalizedOn: '2026-10-14',
      heirs: [
        heir({ id: 's', name: 'Ioana Mureșan', kind: 'spouse', status: 'accepts', degree: 0 }),
        heir({ id: 'c', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 }),
      ],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 180000 }],
    }),
    expectShares: { s: '1/4', c: '3/4' },
    expectGross: 180000,
    tax: 1800,
  });

  cases.push({
    file: '15-scutirea-170-nu-mai-acopera',
    title: 'Termenul de 2 ani cădea în fereastra Legii 170/2026, dar finalizarea este după 30 septembrie 2026',
    input: succession({
      deathOn: '2024-08-01',
      finalizedOn: '2026-10-14',
      heirs: [heir({ id: 'c', name: 'Sorin Mureșan', kind: 'descendant', status: 'accepts', degree: 1 })],
      assets: [{ id: 'a', label: 'Apartament propriu', category: 'imobil', regime: 'propriu-defunct', value: 100000 }],
    }),
    expectShares: { c: '1/1' },
    expectGross: 100000,
    tax: 1000,
  });

  for (const item of cases) {
    let result;
    try {
      result = computeSuccession(item.input);
    } catch (error) {
      failures.push(`${item.file}: calculul a aruncat ${(error as Error).message}`);
      continue;
    }
    const tax = successionTax({
      deathOn: item.input.deathOn,
      finalizedOn: item.input.finalizedOn,
      netImmovable: result.netImmovable,
    });
    const fee = feeSuccesiune(result.grossEstate);
    const problems: string[] = [];
    if (result.grossEstate !== item.expectGross) problems.push(`activ brut ${result.grossEstate}, așteptat ${item.expectGross}`);
    if (!result.sharesBalanced) problems.push('suma cotelor nu este 1/1');
    if (!result.moneyBalanced) problems.push('suma valorilor nu închide activul net');
    if (result.vacant !== (Object.keys(item.expectShares).length === 0)) problems.push('vacanța nu corespunde');
    for (const [id, share] of Object.entries(item.expectShares)) {
      const found = result.heirs.find((heir) => heir.id === id)?.share.toString();
      if (found !== share) problems.push(`${id} are ${found ?? 'lipsă'}, așteptat ${share}`);
    }
    for (const heir of result.heirs) {
      if (!item.expectShares[heir.id]) problems.push(`${heir.name} nu trebuia să culeagă`);
      if (heir.reserved && !heir.reserve.mul(new Fraction(2, 1)).eq(heir.share)) {
        problems.push(`rezerva lui ${heir.name} nu este jumătate din cotă`);
      }
    }
    if (fee.onorariu !== successionFeeHand(result.grossEstate)) problems.push(`onorariu ${fee.onorariu} diferă de grila anexei 3`);
    if (fee.arhivare !== 45) problems.push('arhivarea succesorală nu este 45 lei');
    if (tax.tax !== item.tax) problems.push(`impozit ${tax.tax}, așteptat ${item.tax}`);
    if (item.tax === 0 && tax.due) problems.push('impozitul este marcat datorat înăuntrul scutirii');
    if (item.tax > 0 && !tax.note.includes('1%')) problems.push('nota fiscală nu spune 1%');
    if (item.file === '11-masa-datorii-uz-casnic-legat') {
      if (result.spouseRetainedCommunity !== 200000) problems.push('partea soțului din comun nu este 200000');
      if (result.householdGoods !== 15000) problems.push('uzul casnic nu este 15000');
      if (result.netEstate !== 190000) problems.push('netul nu este 190000');
      if (result.netImmovable !== 180000) problems.push('netul imobiliar nu este 180000');
      if (result.legacyExcess.toString() !== '1/4') problems.push(`depășirea disponibilului este ${result.legacyExcess.toString()}`);
      if (result.disposable.toString() !== '1/2') problems.push('disponibilul soț+copil nu este 1/2');
    }
    if (item.file === '12-sot-fara-alta-locuinta' && !result.explanations.some((line) => line.includes('973'))) {
      problems.push('lipsește mențiunea art. 973');
    }
    if (item.file === '01-sot-si-un-copil') {
      if (result.spouseRetainedCommunity !== 200000) problems.push('comunitatea reținută nu este 200000');
      if (result.householdGoods !== 0) problems.push('uzul casnic a intrat în masă');
      if (result.totalReserve.toString() !== '1/2') problems.push('rezerva totală nu este 1/2');
    }
    if (item.file === '08-renuntare-fara-reprezentare' && result.heirs.some((heir) => heir.id === 'g')) {
      problems.push('nepotul renunțătorului a fost chemat');
    }
    if (item.file === '15-scutirea-170-nu-mai-acopera' && tax.note.includes('nu se datorează')) {
      problems.push('scutirea din Legea 170/2026 a fost aplicată după 30 septembrie 2026');
    }

    const certificate = successionCertificate(item.input, result, OFFICE);
    const closing = successionClosing(item.input, result, OFFICE);
    if (certificate.plainText.includes('[●]')) problems.push('certificatul are [●]');
    if (item.file !== '10-succesiune-vacanta' && certificate.plainText.includes('……')) problems.push('certificatul are câmp gol');
    if (closing.plainText.includes('[●]') || closing.plainText.includes('……')) problems.push('încheierea are câmp gol sau [●]');
    for (const share of Object.values(item.expectShares)) {
      if (!certificate.plainText.includes(`(${share})`)) problems.push(`certificatul nu arată cota ${share}`);
    }
    if (result.vacant && !certificate.plainText.includes('Nu se eliberează certificat')) {
      problems.push('vacanța încă produce certificat');
    }
    if (!certificate.plainText.includes(tax.note)) problems.push('certificatul nu preia nota de impozit');
    failures.push(...problems.map((problem) => `${item.file}: ${problem}`));

    const sheet = [
      item.title,
      `Deces ${item.input.deathOn}, finalizare ${item.input.finalizedOn}, domiciliu ${item.input.lastDomicile}.`,
      `Clasa ${result.relativeClass}. Activ brut ${result.grossEstate}. Pasiv ${result.debtTotal}. Net ${result.netEstate}.`,
      `Net imobiliar ${result.netImmovable}. Comunitate reținută de soț ${result.spouseRetainedCommunity}. Uz casnic ${result.householdGoods}.`,
      `Rezervă ${result.totalReserve.toString()}. Disponibil ${result.disposable.toString()}. Depășire legate ${result.legacyExcess.toString()}.`,
      `Onorariu minimal ${fee.onorariu} lei, arhivare ${fee.arhivare} lei. ${fee.sursa}`,
      `Impozit: ${tax.note} Sumă ${tax.tax} lei.`,
      'Cote:',
      ...result.heirs.map((heir) => `- ${heir.name}: ${heir.share.toString()}, rezervă ${heir.reserve.toString()}, net ${heir.netValue}`),
      result.vacant ? '- niciun moștenitor' : '',
      'Controale:',
      ...result.checks.map((check) => `- ${check.ok ? 'da' : 'nu'}: ${check.label}. ${check.detail}`),
      ...result.explanations.map((line) => `Explicație: ${line}`),
      ...result.warnings.map((line) => `Avertisment: ${line}`),
      problems.length ? `PROBLEME: ${problems.join(' | ')}` : 'Calculele coincid cu cotele legale verificate manual și cu grilele din motor.',
    ]
      .filter(Boolean)
      .join('\n');
    await writeFile(path.join(ROOT, 'succesiuni', `${item.file}-fisa.txt`), sheet, 'utf8');
    await writeFile(path.join(ROOT, 'succesiuni', `${item.file}-certificat.txt`), certificate.plainText, 'utf8');
    await writeFile(path.join(ROOT, 'succesiuni', `${item.file}-incheiere.txt`), closing.plainText, 'utf8');
    await writeFile(path.join(ROOT, 'succesiuni', `${item.file}-certificat.docx`), Buffer.from(await (await documentToDocx(certificate)).arrayBuffer()));
    lines.push(`${item.file}: ${item.title}. ${problems.length ? problems.join(' | ') : 'cote, masă, onorariu și impozit verificate.'}`);
  }
  return lines;
}

function successionFeeHand(value: number): number {
  if (value <= 20000) return roundMoney(Math.max(value * 0.027, 240));
  if (value <= 35000) return roundMoney(540 + 0.019 * (value - 20001));
  if (value <= 65000) return roundMoney(725 + 0.016 * (value - 35001));
  return roundMoney(1205 + 0.0085 * (value - 65001));
}

function writeCalculations(): string[] {
  const lines: string[] = ['', 'CALCULE FISCALE ȘI ONORARII', ''];
  const checks: [string, boolean][] = [];
  const push = (label: string, ok: boolean) => {
    checks.push([label, ok]);
    lines.push(`${ok ? 'DA' : 'NU'}: ${label}`);
  };

  const fee100 = feeImobil(100000);
  push('Onorariu imobil la 100.000 lei = 1.729,99 lei, arhivare 45', fee100.onorariu === 1729.99 && fee100.arhivare === 45);
  push('Pragul 20.000 lei rămâne 440 lei', feeImobil(20000).onorariu === 440);
  push('20.001 lei rămâne 440 lei, fiind chiar baza tranșei', feeImobil(20001).onorariu === 440);
  push('20.002 lei este 440,02 lei', feeImobil(20002).onorariu === 440.02);
  push('TVA nu se adaugă dacă biroul nu este plătitor', withVat(1729.99, false).vat === 0 && withVat(1729.99, false).total === 1729.99);
  push('TVA 21% la 1.729,99 lei este 363,30 lei', withVat(1729.99, true).vat === 363.3 && withVat(1729.99, true).total === 2093.29);

  const over3 = transferTax({ declaredValue: 250000, gridValue: 240000, acquiredOn: '2018-01-15', transferredOn: '2026-10-14', exemption: 'none' });
  push('Deținere 2018–2026: bază 250.000, cotă 1%, impozit 2.500', over3.base === 250000 && over3.rate === 0.01 && over3.tax === 2500 && over3.holding === 'peste-3-ani');
  const under = transferTax({ declaredValue: 250000, gridValue: 0, acquiredOn: '2024-10-14', transferredOn: '2026-10-14', exemption: 'none' });
  push('Deținere de 2 ani: cotă 3%, impozit 7.500', under.rate === 0.03 && under.tax === 7500);
  const exact3 = transferTax({ declaredValue: 250000, gridValue: 0, acquiredOn: '2023-10-14', transferredOn: '2026-10-14', exemption: 'none' });
  push('Exact 3 ani rămâne 3%, pentru că legea spune până la 3 ani inclusiv', exact3.rate === 0.03 && exact3.tax === 7500 && isAfterYears('2023-10-14', '2026-10-14', 3) === false);
  const grid = transferTax({ declaredValue: 250000, gridValue: 300000, acquiredOn: '2018-01-15', transferredOn: '2026-10-14', exemption: 'none' });
  push('Grila mai mare decât prețul urcă baza la 300.000 și impozitul la 3.000', grid.base === 300000 && grid.tax === 3000);
  push('O zi peste 3 ani trece la 1%', isAfterYears('2023-10-13', '2026-10-14', 3) === true);

  const inTime = successionTax({ deathOn: '2024-03-01', finalizedOn: '2026-02-01', netImmovable: 200000 });
  push('Succesiune finalizată în 2 ani: impozit 0', inTime.due === false && inTime.tax === 0);
  const late = successionTax({ deathOn: '2023-01-15', finalizedOn: '2026-10-14', netImmovable: 180000 });
  push('Succesiune după 2 ani, la 14 octombrie 2026: 1% din 180.000 = 1.800', late.due === true && late.tax === 1800);
  const waiverGone = successionTax({ deathOn: '2024-08-01', finalizedOn: '2026-10-14', netImmovable: 100000 });
  push('Legea 170/2026 nu mai scutește o finalizare din 14 octombrie 2026', waiverGone.due === true && waiverGone.tax === 1000);
  const waiverThen = successionTax({ deathOn: '2024-08-01', finalizedOn: '2026-09-30', netImmovable: 100000 });
  push('Aceeași moștenire, finalizată la 30 septembrie 2026, era încă în scutirea punctuală', waiverThen.due === false && waiverThen.tax === 0);

  const procura = FIXED_FEES.find((fee) => fee.id === 'procura-reprezentare');
  const pensie = FIXED_FEES.find((fee) => fee.id === 'procura-pensie');
  push('Procura de reprezentare rămâne 100 lei plus arhivare 20', procura?.onorariu === 100 && procura.arhivare === 20);
  push('Procura de pensie rămâne 8 lei plus arhivare 20', pensie?.onorariu === 8 && pensie.arhivare === 20);
  push('Succesiunea de 200.000 lei are onorariu minimal 2.352,49 lei', feeSuccesiune(200000).onorariu === 2352.49 && successionFeeHand(200000) === 2352.49);

  lines.push('');
  lines.push('Limite păstrate: nu este codificat onorariul din anexa nr. 2 pct. XIV, nici tariful ANCPI, nici raportul donațiilor, nici reducerile din anexa nr. 5.');
  lines.push('Impozitul și onorariul nu se amestecă. TVA nu se pune pe impozit.');
  if (checks.some(([, ok]) => !ok)) {
    lines.push('', 'CALCULE GREȘITE:');
    for (const [label, ok] of checks) if (!ok) lines.push(`- ${label}`);
  }
  return lines;
}
