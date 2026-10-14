import type { OfficeProfile } from '@/domain/types';
import { formatLei, formatRomanianDate } from '@/lib/money';
import { quoteShare } from '@/lib/romanian';
import type { HeirResult, SuccessionInput, SuccessionResult } from '@/lib/succession';
import { successionTax } from '@/lib/tax';
import { feeSuccesiune } from '@/lib/fees';
import { buildDocument } from './document';

const KIND_RO: Record<HeirResult['kind'], string> = {
  spouse: 'soț supraviețuitor',
  descendant: 'descendent',
  parent: 'ascendent privilegiat',
  'privileged-collateral': 'colateral privilegiat',
  'ordinary-ascendant': 'ascendent ordinar',
  'ordinary-collateral': 'colateral ordinar',
};

function heirLines(result: SuccessionResult): string[] {
  return result.heirs.map((heir, index) => {
    const sulta =
      heir.sulta === 0 ? 'fără sultă pe bunurile atribuite' : `sultă ${heir.sulta > 0 ? 'de plătit' : 'de primit'} ${formatLei(Math.abs(heir.sulta))}`;
    return `${index + 1}. ${heir.name}, ${KIND_RO[heir.kind]}, cotă ${quoteShare(heir.share)}, rezervă ${heir.reserved ? quoteShare(heir.reserve) : 'nu este rezervatar'}, activ ${formatLei(heir.estateValue)}, pasiv repartizat ${formatLei(heir.debtShare)}, net ${formatLei(heir.netValue)}, ${sulta}. ${heir.basis}`;
  });
}

export function successionCertificate(input: SuccessionInput, result: SuccessionResult, office: OfficeProfile) {
  const tax = successionTax({
    deathOn: input.deathOn,
    finalizedOn: input.finalizedOn || input.deathOn,
    netImmovable: result.netImmovable,
  });
  const fee = feeSuccesiune(result.grossEstate);
  const goods = input.assets.map((asset) => {
    const who = result.heirs.find((heir) => heir.id === asset.assignedTo)?.name;
    return `- ${asset.label}: ${formatLei(asset.value)}, regim ${asset.regime}, categorie ${asset.category}${who ? `, atribuit lui ${who}` : ', lăsat în indiviziune'}.`;
  });
  return buildDocument({
    title: 'CERTIFICAT DE MOȘTENITOR — PROIECT',
    kind: 'certificat-mostenitor',
    office,
    citations: [
      { label: 'Codul civil, art. 971–983 și art. 1088', url: 'https://legislatie.just.ro', note: 'Devoluțiunea legală și rezerva.' },
      { label: 'Legea nr. 36/1995, art. 15 și art. 113 și urm.', url: 'https://www.uniuneanotarilor.ro', note: 'Competența și cuprinsul încheierii finale.' },
      { label: 'Codul fiscal, art. 111 alin. (3)', url: 'https://legislatie.just.ro', note: tax.note },
    ],
    intro: [
      `Proiect întocmit pentru succesiunea lui ${deceasedLine(input)}.`,
      `Decesul: ${input.deathOn ? formatRomanianDate(input.deathOn) : '……'}. Ultimul domiciliu: ${input.lastDomicile || '……'}.`,
      'Competența aparține notarului din circumscripția tribunalului acestui domiciliu și se exercită numai la sediul biroului.',
    ],
    sections: [
      {
        heading: 'I. Moștenitorii și cotele',
        paragraphs: result.vacant
          ? ['Nu a fost găsit niciun moștenitor care să vină la moștenire. Nu se eliberează certificat pe acest proiect. Se verifică vacanța succesorală.']
          : heirLines(result),
      },
      {
        heading: 'II. Masa',
        paragraphs: [
          ...goods,
          `Activ brut succesoral: ${formatLei(result.grossEstate)}.`,
          `Pasiv: ${formatLei(result.debtTotal)}.`,
          `Activ net: ${formatLei(result.netEstate)}.`,
          `Partea soțului din bunurile comune, care nu intră în masă: ${formatLei(result.spouseRetainedCommunity)}.`,
          `Bunuri de uz casnic atribuite soțului pe lângă cotă, art. 974: ${formatLei(result.householdGoods)}.`,
          `Activ net imobiliar, bază de lucru pentru art. 111 alin. (3): ${formatLei(result.netImmovable)}.`,
        ],
      },
      {
        heading: 'III. Controlul calculelor',
        paragraphs: [
          ...result.checks.map((check) => `${check.ok ? 'Îndeplinit' : 'Neîndeplinit'}: ${check.label}. ${check.detail}`),
          ...result.explanations,
          ...result.warnings,
        ],
      },
      {
        heading: 'IV. Onorariu și impozit, orientativ',
        paragraphs: [
          `Onorariu minimal de procedură: ${formatLei(fee.onorariu)}. Arhivare: ${formatLei(fee.arhivare)}. ${fee.sursa}`,
          tax.note + (tax.due ? ` Sumă de lucru: ${formatLei(tax.tax)}.` : ''),
          'Tarifele de carte funciară se adaugă după tariful ANCPI din ziua cererii.',
        ],
      },
    ],
    closing: [
      'Certificatul adevărat se eliberează numai după încheierea finală, acordul moștenitorilor sau soluționarea opozițiilor, și după administrarea probelor. Până la acel moment, prezentul text nu face dovada calității de moștenitor.',
    ],
  });
}

export function successionClosing(input: SuccessionInput, result: SuccessionResult, office: OfficeProfile) {
  return buildDocument({
    title: 'ÎNCHEIERE FINALĂ — PROIECT',
    kind: 'incheiere-succesiune',
    office,
    citations: [
      { label: 'Legea nr. 36/1995, procedura succesorală', url: 'https://www.uniuneanotarilor.ro', note: 'Încheierea finală constată masa, devoluțiunea, taxele și eliberarea certificatului.' },
    ],
    intro: [
      `Dosar succesoral: numărul se completează din registrul biroului / ${input.deathOn ? input.deathOn.slice(0, 4) : 'anul decesului'}. Proiectul nu inventează numărul.`,
      `Notar instrumentator: ${office.notaryName || '……'}.`,
      `Data încheierii: ${input.finalizedOn ? formatRomanianDate(input.finalizedOn) : '……'}.`,
    ],
    sections: [
      {
        heading: 'Constatări',
        paragraphs: [
          deceasedLine(input),
          result.vacant
            ? 'Nu s-a constatat acord asupra unui moștenitor. Procedura nu se închide cu certificat.'
            : `S-a reținut devoluțiunea legală. Cotele, a căror sumă ${result.sharesBalanced ? 'este 1/1' : 'NU este 1/1'}:`,
          ...heirLines(result),
          `Masa: activ ${formatLei(result.grossEstate)}, pasiv ${formatLei(result.debtTotal)}, net ${formatLei(result.netEstate)}.`,
          'Temeiul devoluțiunii este legea, în limitele datelor introduse. Un testament schimbă împărțirea numai înăuntrul cotității disponibile.',
          'Se va dispune eliberarea certificatului de moștenitor numai dacă probele și acordul sunt îndestulătoare. Acest paragraf nu este acea dispoziție.',
        ],
      },
    ],
    closing: ['Încheierea autentică se semnează de notar în original și se păstrează la dosar.'],
  });
}

function deceasedLine(input: SuccessionInput): string {
  const name = input.deceasedName.trim() || '……';
  const when = input.deathOn ? formatRomanianDate(input.deathOn) : '……';
  return `${name}, decedat la ${when}, cu ultimul domiciliu în ${input.lastDomicile || '……'}`;
}
