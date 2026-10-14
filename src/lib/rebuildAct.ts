import type { ActTemplate } from '@/domain/types';
import { splitIdentityText } from '@/modules/document';
import { restoreDiacritics } from './diacritics';

const MONTHS: Record<string, string> = {
  ianuarie: '01',
  februarie: '02',
  martie: '03',
  aprilie: '04',
  mai: '05',
  iunie: '06',
  iulie: '07',
  august: '08',
  septembrie: '09',
  octombrie: '10',
  noiembrie: '11',
  decembrie: '12',
};

interface PartyBits {
  name?: string;
  cnp?: string;
  ci?: string;
  domicile?: string;
  civil?: string;
}

interface RoleSpec {
  key: string;
  patterns: RegExp[];
}

const ROLES: Record<string, RoleSpec[]> = {
  'vanzare-imobil': [
    { key: 'v', patterns: [/v[âa]nz[ăa]tori(?:i)?/i, /v[âa]nz[ăa]tor(?:ul|ului)?/i] },
    { key: 'c', patterns: [/cump[ăa]r[ăa]tori(?:i)?/i, /cump[ăa]r[ăa]tor(?:ul|ului)?/i] },
  ],
  'donatie-imobil': [
    { key: 'd', patterns: [/donator(?:ul|ului)?/i] },
    { key: 'b', patterns: [/donatar(?:ul|ului)?/i] },
  ],
  procura: [
    { key: 'm', patterns: [/mandant(?:ul|ului)?/i] },
    { key: 't', patterns: [/mandatar(?:ul|ului)?/i] },
  ],
  antecontract: [
    { key: 'p', patterns: [/promitent(?:ul)?[-\s]*v[âa]nz[ăa]tor(?:ul)?/i] },
    { key: 'b', patterns: [/promitent(?:ul)?[-\s]*cump[ăa]r[ăa]tor(?:ul)?/i] },
  ],
  intretinere: [
    { key: 'c', patterns: [/creditor(?:ul)?(?:\s+[îi]ntre[țt]inerii)?/i] },
    { key: 'd', patterns: [/debitor(?:ul)?(?:\s+[îi]ntre[țt]inerii)?/i] },
  ],
  conventie: [
    { key: 'a', patterns: [/so[țt]ul/i] },
    { key: 'b', patterns: [/so[țt]ia/i] },
  ],
  testament: [{ key: 't', patterns: [/testator(?:ul)?\s*:/i, /testator(?:ul)?/i] }],
  acceptare: [{ key: 'm', patterns: [/succesibil(?:ul)?|subsemnat(?:ul|a)?/i] }],
  renuntare: [{ key: 'm', patterns: [/renun[țt][ăa]tor(?:ul)?|subsemnat(?:ul|a)?/i] }],
};

export function toIsoDate(fragment: string): string | undefined {
  const iso = fragment.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = fragment.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  const long = fragment.match(
    /\b(\d{1,2})\s+(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s+(\d{4})\b/i,
  );
  if (!long) return undefined;
  return `${long[3]}-${MONTHS[long[2].toLocaleLowerCase('ro-RO')]}-${long[1].padStart(2, '0')}`;
}

function dateAfter(text: string, label: RegExp): string | undefined {
  const match = label.exec(text);
  if (!match) return undefined;
  return toIsoDate(text.slice(match.index, match.index + 90));
}

function cleanName(raw: string): string | undefined {
  const name = raw
    .replace(/\s+/g, ' ')
    .replace(/^[\s:.\-–]+/, '')
    .replace(/^(?:numit(?:ul|a)|denumit[ăa]?|subsemnat(?:ul|a)|domnul|doamna|dl\.?|dna\.?)\s+/i, '')
    .trim();
  if (!/\p{L}{2}/u.test(name) || name.length > 90 || name.split(/\s+/).length > 8) return undefined;
  if (/[():[\]]/.test(name) || name.split(/\s+/).some(isHeading)) return undefined;
  return name;
}

const HEADINGS = new Set([
  'VANZATORI',
  'VANZATOR',
  'CUMPARATORI',
  'CUMPARATOR',
  'COPROPRIETARI',
  'DEVALMASI',
  'ACHIZITORI',
  'CONTRACT',
  'OBIECTUL',
  'ROMANIA',
  'UNIUNEA',
]);

function fold(word: string): string {
  return word.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
}

function isHeading(word: string): boolean {
  return HEADINGS.has(fold(word).replace(/[^A-Z]/g, ''));
}

function sectionBetween(text: string, start: RegExp, end: RegExp): string {
  const opened = start.exec(text);
  if (!opened) return '';
  const rest = text.slice(opened.index + opened[0].length);
  const closed = end.exec(rest);
  return closed ? rest.slice(0, closed.index) : rest.slice(0, 1500);
}

function namesIn(section: string): string[] {
  const found: string[] = [];
  const pattern = /\b([A-ZĂÂÎȘȚ]{2,}(?:-[A-ZĂÂÎȘȚ]{2,})?)\s+([A-ZĂÂÎȘȚ]{2,}(?:-[A-ZĂÂÎȘȚ]{2,})?)\b/g;
  for (const match of section.matchAll(pattern)) {
    if (isHeading(match[1]) || isHeading(match[2])) continue;
    found.push(`${match[1]} ${match[2]}`);
  }
  return [...new Set(found)];
}

function domicileIn(section: string): string | undefined {
  const match = section.match(/domiciliat[ăa]?\s+[îi]n\s+(.+?)(?:,?\s+identificat)/i);
  return match ? restoreDiacritics(match[1].replace(/\s+/g, ' ').trim()) : undefined;
}

/** Limită de cuvânt care vede și ă, â, î, ș, ț. `\b` din JavaScript se oprește înaintea lor. */
const CIVIL =
  /(?<![\p{L}\p{N}_])(nec[ăa]s[ăa]torit[ăa]|c[ăa]s[ăa]torit[ăa]|nec[ăa]s[ăa]torit|c[ăa]s[ăa]torit|v[ăa]duv[ăa]|v[ăa]duv|divor[țt]at[ăa]|divor[țt]at)(?![\p{L}\p{N}_])/iu;

function civilIn(section: string): string | undefined {
  if (/comunit[ăa][țt]ii\s+legal/i.test(section)) return 'căsătoriți, regimul comunității legale';
  const civil = section.match(CIVIL)?.[0];
  return civil ? restoreDiacritics(civil) : undefined;
}

function tidy(value: string): string {
  return restoreDiacritics(value.replace(/\[_+\]/g, '……').replace(/\s+/g, ' ').trim());
}

function readParty(text: string, at: number, labelLength: number, endAt: number): PartyBits {
  const window = text.slice(at, endAt);
  const after = window.slice(labelLength).replace(/^[\s:.\-–]+/, '');
  const name = cleanName(after.split(/,|\bCNP\b|\bC\.?\s*N\.?\s*P\b/i)[0] ?? '');
  const cnp = window.match(/\b[1-8]\d{12}\b/)?.[0];
  const domicile = window.match(
    /domicili(?:at[ăa]?)?(?:\/domiciliat[ăa]?)?(?:ul)?\s+(?:în|in)\s+(.+?)(?=,?\s*stare\s+civil|[.;\n])/iu,
  )?.[1]?.trim();
  const ci = window.match(/(?:\bC\.?\s*I\.?\b|carte de identitate|\bpa[sș]aport\b|\bbuletin\b|\bseria\s+[A-Za-z]{1,2}\b)[^,;\n]{0,55}/i)?.[0]?.trim();
  const civil = window.match(CIVIL)?.[0];
  return {
    name,
    cnp,
    ci: ci ? restoreDiacritics(ci) : undefined,
    domicile: domicile ? restoreDiacritics(domicile) : undefined,
    civil: civil ? restoreDiacritics(civil) : undefined,
  };
}

function locate(text: string, pattern: RegExp): { index: number; length: number } | undefined {
  const match = pattern.exec(text);
  if (!match) return undefined;
  return { index: match.index, length: match[0].length };
}

function assignParty(values: Record<string, string>, template: ActTemplate, prefix: string, party: PartyBits) {
  const put = (suffix: string, value: string | undefined) => {
    const key = `${prefix}${suffix}`;
    if (!value) return;
    if (!template.fields.some((field) => field.key === key)) return;
    values[key] = value;
  };
  put('Nume', party.name);
  put('Cnp', party.cnp);
  const identity = splitIdentityText(party.ci ?? '');
  put('CiSerie', identity.series);
  put('CiNr', identity.number);
  put('Domiciliu', party.domicile);
  put('Stare', party.civil);
}

function proseAfter(text: string, label: RegExp, max = 700): string | undefined {
  const match = label.exec(text);
  if (!match) return undefined;
  let chunk = text.slice(match.index + match[0].length, match.index + match[0].length + max);
  const lineBreak = chunk.indexOf('\n');
  if (lineBreak >= 8) chunk = chunk.slice(0, lineBreak);
  chunk = chunk.replace(/\s+/g, ' ').trim().replace(/^[:\s]+/, '').replace(/\.$/, '');
  if (chunk.length < 8) return undefined;
  return restoreDiacritics(chunk);
}

function has(template: ActTemplate, key: string): boolean {
  return template.fields.some((field) => field.key === key);
}

function put(values: Record<string, string>, template: ActTemplate, key: string, value: string | undefined) {
  if (!value || !has(template, key)) return;
  values[key] = value;
}

/** Extrage din textul verificat datele pe care modelul le poate rescrie. Nu inventează regimul, plata sau scutirea. */
export function extractActValues(text: string, template: ActTemplate): Record<string, string> {
  const values: Record<string, string> = {};
  const roles = ROLES[template.id] ?? [];
  const hits = roles
    .map((role) => {
      const found = role.patterns.map((pattern) => locate(text, pattern)).find(Boolean);
      return found ? { role, ...found } : undefined;
    })
    .filter((hit): hit is { role: RoleSpec; index: number; length: number } => Boolean(hit))
    .sort((a, b) => a.index - b.index);

  hits.forEach((hit, index) => {
    const end = hits[index + 1]?.index ?? Math.min(text.length, hit.index + 800);
    assignParty(values, template, hit.role.key, readParty(text, hit.index, hit.length, end));
  });

  const sellerSection = sectionBetween(text, /v[âa]nz[ăa]tori\b/i, /cump[ăa]r[ăa]tori\b/i);
  const buyerSection = sectionBetween(text, /cump[ăa]r[ăa]tori\b/i, /art\.?\s*1|obiectul contractului/i);
  const sellers = namesIn(sellerSection);
  const buyers = namesIn(buyerSection);
  if (sellers.length) {
    put(values, template, 'vNume', sellers.join(' și '));
    put(values, template, 'vDomiciliu', domicileIn(sellerSection));
    put(values, template, 'vStare', civilIn(sellerSection));
  }
  if (buyers.length) {
    put(values, template, 'cNume', buyers.join(' și '));
    put(values, template, 'cDomiciliu', domicileIn(buyerSection));
    put(values, template, 'cStare', civilIn(buyerSection));
  }

  const labeledProperty = text.match(/\bimobil(?:ul|ului)?:\s+([^.\n]{8,700})/i)?.[1]?.trim();
  const situatedAt = text.search(/imobil(?:ul|ului)\s+situat/i);
  const situatedFrom = situatedAt >= 0 ? text.slice(situatedAt, situatedAt + 800) : '';
  const situatedStop = situatedFrom.search(/\.\s+(?=Imobilul\s+const|Art\.?\s*\d)/i);
  const situated = situatedFrom ? (situatedStop > 0 ? situatedFrom.slice(0, situatedStop + 1) : situatedFrom) : undefined;
  const consists = text.match(/imobilul const[ăa]\s+[îi]n\s+[^.]{8,300}\./i)?.[0];
  const description = labeledProperty
    || [situated, consists].filter(Boolean).join(' ')
    || text.match(/(?:imobilul|apartamentul|terenul|construc[țt]ia|casa)\b[^.]{8,500}\./i)?.[0];
  put(values, template, 'imobil', description ? tidy(description) : undefined);
  put(
    values,
    template,
    'cf',
    text.match(/(?:carte(?:a)?\s+funciar[ăa]|C\.?\s*F\.?)\s*(?:nr\.?|num[ăa]rul)?\s*([0-9]{1,12})/i)?.[1],
  );
  const cadastralRaw = text.match(/cadastral(?:\s+nr\.?)?\s*[:\s]*(\[[^\]]+\]-?[A-Za-z0-9/-]+|[A-Za-z0-9][A-Za-z0-9/-]{1,30})/i)?.[1];
  const cadastral = cadastralRaw?.replace(/\[[^\]]*\]/g, '').replace(/^[-.\s]+/, '').trim();
  put(values, template, 'cadastral', cadastral && /[0-9A-Za-z]/.test(cadastral) ? cadastral : undefined);
  put(
    values,
    template,
    'suprafata',
    text.match(/suprafa[țt][aă]\s*(?:de|m[ăa]sur[âa]nd)?\s*([0-9][0-9\s.,]{0,14}\s*(?:mp|m\.p\.|m2|ha|ari)?)/i)?.[1]?.replace(/\s+/g, ' ').trim(),
  );
  put(
    values,
    template,
    'judet',
    text.match(/jude[țt](?:ul)?\s+([A-ZĂÂÎȘȚa-zăâîșț][\p{L}-]{1,30})/u)?.[1]
      ?? text.match(/\bjud\.?\s+([A-ZĂÂÎȘȚa-zăâîșț][\p{L}-]{1,30})/u)?.[1],
  );
  put(
    values,
    template,
    'uat',
    text.match(/\bUAT\s+([A-ZĂÂÎȘȚa-zăâîșț][\p{L}-]{1,40})/u)?.[1]
      ?? text.match(/(?:municipiul|ora[șs]ul|comuna|satul|mun\.)\s+([A-ZĂÂÎȘȚa-zăâîșț][\p{L}-]{1,40})/iu)?.[1],
  );
  const price = text.match(
    /pre[țt](?:ul)?(?:\s+\p{L}+){0,6}\s*(?:de\s+)?([0-9][0-9.\s]{1,18}(?:,[0-9]{1,2})?)\s*(?:lei|RON)/iu,
  )?.[1]?.replace(/\s/g, '');
  const pretField = template.fields.find((field) => field.key === 'pret');
  if (pretField?.type === 'checkbox') {
    if (/[îi]ncaseaz[ăa]\s+pre[țt]|pre[țt]ul a fost [îi]ncasat/i.test(text)) values.pret = 'da';
  } else {
    put(values, template, 'pret', price);
  }
  put(
    values,
    template,
    'avans',
    text.match(/avans(?:ul)?\s*(?:de\s+)?([0-9][0-9.\s]{0,18}(?:,[0-9]{1,2})?)\s*(?:lei|RON)/i)?.[1]?.replace(/\s/g, ''),
  );
  put(values, template, 'dataAct', dateAfter(text, /ast[ăa]zi|la data de|încheiat(?:ă)? la/i) ?? toIsoDate(text));
  put(values, template, 'dobandire', dateAfter(text, /dob[âa]ndit|dob[âa]ndirii|cump[ăa]rat(?:\s+la)?|prin contractul din/i));
  put(values, template, 'deces', dateAfter(text, /decedat[ăa]?|data decesului/i));
  put(values, template, 'termen', dateAfter(text, /p[âa]n[ăa] la(?:\s+data de)?|termen(?:ul)?(?:\s+de)?/i));
  put(
    values,
    template,
    'grila',
    text.match(/valoare de lucru introdus[ăa]:\s*([0-9][0-9.\s]{0,18}(?:,[0-9]{1,2})?)\s*lei/iu)?.[1]?.replace(/\s/g, ''),
  );
  const place = text.match(/(?:municipiul|ora[șs]ul|comuna)\s+[A-ZĂÂÎȘȚa-zăâîșț][\p{L}-]{1,30}/u)?.[0];
  put(values, template, 'locAct', place ? restoreDiacritics(place) : undefined);

  const body = text.split(/Temeiuri re[țt]inute/i)[0];
  if (has(template, 'vRegim')) {
    if (/[îi]nstr[ăa]ineaz[ăa]\s+cota|vinde\s+cota|cot[ăa](?:-|\s*)parte\s+de\s+\d/i.test(body)) {
      values.vRegim = 'cota';
      put(
        values,
        template,
        'vCota',
        body.match(/cot[ăa](?:-|\s*)parte\s+de\s+([^,.\n]{1,40})/i)?.[1]?.trim()
          ?? body.match(/[îi]nstr[ăa]ineaz[ăa] cota de\s+([^,.\n]{1,24})/i)?.[1]?.trim(),
      );
    } else if (/bun comun|comunit[ăa][țt](?:ii|ea)\s+legal|dev[ăa]lm[ăa][șs]/i.test(body)) values.vRegim = 'comun';
    else if (/bun propriu/i.test(body)) values.vRegim = 'propriu';
  }
  if (has(template, 'plata')) {
    const bankLoan = /ipotec[ăa]\s+bancar/i.test(body) && !/nu se confund[ăa] cu o ipotec[ăa]\s+bancar/i.test(body);
    if (/pre[țt]ul se achit[ăa] din credit|[îi]mprumut bancar/i.test(body) || bankLoan) values.plata = 'credit';
    else if (/nu este achitat integral|achitat par[țt]ial|rest(?:ul)? de plat[ăa]|diferen[țt][ae]\s+de\s+pre[țt]|ipotec[ăa]\s+legal[ăa]/i.test(body)) values.plata = 'partial';
    else if (/achit[ăa]\s+pre[țt]ul integral|achitat integral|[îi]n [îi]ntregime|integral la autentificare/i.test(body)) values.plata = 'integral';
  }
  if (has(template, 'ipoteca') && /ipotec[ăa]\s+legal[ăa]/i.test(body)) values.ipoteca = 'da';
  const restLine = body.match(/(?:Restul|Suma, scaden[țt]a și accesorile|Condi[țt]iile finan[țt][ăa]rii și eventuala ipotec[ăa]):\s*([^\n]+)/i)?.[1]?.trim();
  if (restLine && !restLine.startsWith('……')) put(values, template, 'rest', restoreDiacritics(restLine.replace(/\.$/, '')));
  if (values.plata === 'partial' && !values.rest && values.ipoteca === 'da') {
    values.rest = 'Diferența de preț pentru care se constituie ipoteca legală nu a fost citită în cifre. Se completează suma și scadența din original.';
  }
  if (has(template, 'extravilan') && /p[ăa]r[țt]ile declar[ăa] c[ăa] obiectul cuprinde teren agricol situat [îi]n extravilan|obiectul este teren agricol extravilan/i.test(body)) {
    values.extravilan = 'da';
  }
  if (has(template, 'grad')) {
    if (/declar[ăa] c[ăa] nu sunt [îi]n cazul de scutire|nu sunt rude|\bimpozabil\b/i.test(body)) values.grad = 'impozabil';
    else if (/declar[ăa] c[ăa] sunt so[țt]i sau rude|so[țt]i sau rude ori afini/i.test(body)) values.grad = 'scutit';
  }
  if (has(template, 'fel')) {
    values.fel = /procura este dat[ăa] numai pentru [îi]ncasarea pensiei|[îi]ncasarea pensiei,\s*a ajutorului/i.test(body) ? 'pensie' : 'speciala';
  }
  if (has(template, 'regim')) {
    if (/adopt[ăa] regimul separa[țt]iei de bunuri/i.test(body)) values.regim = 'separatie';
    else if (/adopt[ăa] comunitatea conven[țt]ional[ăa]/i.test(body)) values.regim = 'conventionala';
    else if (/revin la comunitatea legal[ăa]/i.test(body)) values.regim = 'legala';
  }
  if (has(template, 'martori') && /cere asisten[țt]a a unul sau doi martori/i.test(body)) values.martori = 'da';
  if (has(template, 'minor') && /succesibilul este minor/i.test(body)) values.minor = 'da';

  put(
    values,
    template,
    'defunct',
    text.match(/(?:defunct(?:ul|ului|a|ei)?|de pe urma)\s+(?:lui\s+|numitului\s+)?([A-ZĂÂÎȘȚ][\p{L}-]+(?:\s+[A-ZĂÂÎȘȚ][\p{L}-]+){0,3})/u)?.[1],
  );
  put(
    values,
    template,
    'domDefunct',
    text.match(/ultimul domiciliu(?:\s+al defunctului)?\s+(?:în|in|la)\s+([^.\n]{3,160})/i)?.[1]?.trim().replace(/[,;\s]+$/, ''),
  );
  put(values, template, 'calitate', text.match(/(?:în|in) calitate de\s+([^,.\n]{3,80})/i)?.[1]?.trim());
  put(values, template, 'obiect', proseAfter(text, /[îi]mputernice[șs]te pe mandatar s[ăa]|[îi]mputernice[șs]te|imputerniceste/i, 500));
  const dispozitiiLine = text.split(/\n+/).find((line) => /^(?:Las mo[șs]tenire|Las mostenire|Legatez)\b/i.test(line.trim()));
  put(values, template, 'dispozitii', dispozitiiLine?.trim() ?? proseAfter(text, /dispun(?:e)?\s+urm[ăa]toarele|legatez|las mo[șs]tenire|las mostenire/i, 800));
  put(values, template, 'continut', proseAfter(text, /const[âa]nd [îi]n|[îi]ntre[țt]inerea const[ăa]|obliga[țt]ia de [îi]ntre[țt]inere/i, 500));
  put(values, template, 'inventar', proseAfter(text, /inventar(?:ul)?(?:\s+cuprinde)?/i, 500));
  put(values, template, 'durata', text.match(/\bDurata:\s*([^.\n]+)/i)?.[1]?.trim());
  put(values, template, 'efect', text.match(/\bEfecte:\s*([^.\n]+)/i)?.[1]?.trim());
  put(values, template, 'observatii', text.match(/Clauze convenite:\s*([^.\n]+)/i)?.[1]?.trim());
  put(values, template, 'executor', text.match(/executor testamentar pe\s+([^.\n]+)/i)?.[1]?.trim());
  put(values, template, 'sarcini', proseAfter(text, /sarcin(?:i|ile)\s+(?:și|si)\s+not[ăa]ri declarate|sarcina convenit[ăa]/i, 400));
  if (values.ipoteca === 'da' && has(template, 'sarcini') && !values.sarcini) {
    values.sarcini = 'Ipotecă legală a vânzătorului pentru prețul datorat, art. 2386 pct. 1 din Codul civil. Suma se completează din original.';
  }
  return values;
}
