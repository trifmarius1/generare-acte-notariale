import { Fraction, sumFractions } from './fraction';
import { isAfterYears, roundMoney } from './money';
import { quoteShare } from './romanian';

/**
 * Devoluțiune legală, Codul civil (Legea nr. 287/2009).
 * Art. 963–983 clasele; art. 970–974 soțul; art. 964–969 reprezentarea;
 * art. 1086–1088 rezerva; art. 1103 termenul de opțiune de un an;
 * art. 339 și 357 lichidarea comunității înainte de moștenire.
 *
 * Reprezentarea este admisă pentru predecedare și nedemnitate, nu pentru renunțare
 * (art. 967: poate fi reprezentată persoana lipsită de capacitatea de a moșteni și cea nedemnă).
 * Partea renunțătorului profită comoștenitorilor din aceeași tulpină sau clasă.
 */

export type HeirKind =
  | 'spouse'
  | 'descendant'
  | 'parent'
  | 'privileged-collateral'
  | 'ordinary-ascendant'
  | 'ordinary-collateral';

export type HeirStatus = 'accepts' | 'renounces' | 'predeceased' | 'unworthy';
export type CollateralLine = 'maternal' | 'paternal' | 'both';
export type AssetRegime = 'propriu-defunct' | 'comun' | 'propriu-sot' | 'uz-casnic';

export interface HeirInput {
  id: string;
  name: string;
  kind: HeirKind;
  status: HeirStatus;
  /** Gradul de rudenie cu defunctul. Copilul este gradul 1, nepotul de fiu gradul 2, fratele gradul 2. */
  degree: number;
  /** Persoana mai apropiată pe care o reprezintă, dacă vine prin reprezentare. */
  representsId?: string;
  /** Doar pentru frați: linie maternă, paternă sau ambele (frate bun). */
  line?: CollateralLine;
}

export interface AssetInput {
  id: string;
  label: string;
  category: 'imobil' | 'mobil';
  regime: AssetRegime;
  value: number;
  /** Cota defunctului din bunul comun. Implicit 1/2 (art. 357). */
  deceasedNumerator?: number;
  deceasedDenominator?: number;
  /** Id-ul moștenitorului căruia i se atribuie bunul. Gol = indiviziune. */
  assignedTo?: string;
}

export interface DebtInput {
  id: string;
  label: string;
  amount: number;
  immovable: boolean;
}

export interface LegacyInput {
  id: string;
  beneficiary: string;
  /** Fracție din moștenire lăsată prin liberalitate. */
  numerator: number;
  denominator: number;
  reservedHeir: boolean;
}

export interface SuccessionInput {
  deceasedName: string;
  deathOn: string;
  finalizedOn: string;
  lastDomicile: string;
  heirs: HeirInput[];
  assets: AssetInput[];
  debts: DebtInput[];
  legacies: LegacyInput[];
  spouseHasAnotherHome: boolean;
}

export interface HeirResult {
  id: string;
  name: string;
  kind: HeirKind;
  share: Fraction;
  reserve: Fraction;
  reserved: boolean;
  estateValue: number;
  debtShare: number;
  netValue: number;
  receivedPartition: number;
  sulta: number;
  basis: string;
}

export interface SuccessionResult {
  heirs: HeirResult[];
  vacant: boolean;
  relativeClass: 0 | 1 | 2 | 3 | 4;
  spouseShare: Fraction;
  disposable: Fraction;
  totalReserve: Fraction;
  grossEstate: number;
  debtTotal: number;
  netEstate: number;
  netImmovable: number;
  spouseRetainedCommunity: number;
  householdGoods: number;
  sharesBalanced: boolean;
  moneyBalanced: boolean;
  legacyExcess: Fraction;
  explanations: string[];
  warnings: string[];
  checks: { ok: boolean; label: string; detail: string }[];
}

export function computeSuccession(input: SuccessionInput): SuccessionResult {
  const explanations: string[] = [];
  const warnings: string[] = [];
  const descendants = distributeDescendants(input.heirs);
  const classTwo = distributeClassTwo(input.heirs);
  const ordinaryAsc = distributeOrdinary(input.heirs, 'ordinary-ascendant');
  const ordinaryCol = distributeOrdinary(input.heirs, 'ordinary-collateral', 4);

  let relative: Map<string, Fraction> | null = null;
  let relativeClass: 0 | 1 | 2 | 3 | 4 = 0;
  if (descendants && descendants.size) {
    relative = descendants;
    relativeClass = 1;
    explanations.push('Clasa I, descendenții, înlătură clasele următoare (art. 963 și art. 975 C. civ.).');
  } else if (classTwo && classTwo.size) {
    relative = classTwo;
    relativeClass = 2;
    explanations.push(
      'Nu vine niciun descendent. Moștenesc ascendenții privilegiați și colateralii privilegiați (art. 976–981 C. civ.).',
    );
  } else if (ordinaryAsc && ordinaryAsc.size) {
    relative = ordinaryAsc;
    relativeClass = 3;
    explanations.push('Vin ascendenții ordinari de gradul cel mai apropiat, în cote egale (art. 982 C. civ.).');
  } else if (ordinaryCol && ordinaryCol.size) {
    relative = ordinaryCol;
    relativeClass = 4;
    explanations.push('Vin colateralii ordinari de gradul cel mai apropiat, cel mult gradul IV (art. 983 C. civ.).');
  }

  const spouse = input.heirs.find((heir) => heir.kind === 'spouse' && heir.status === 'accepts');
  let spouseShare = Fraction.zero();
  if (spouse) {
    if (!relative) {
      spouseShare = Fraction.one();
      explanations.push('În lipsa rudelor din cele patru clase, soțul supraviețuitor culege întreaga moștenire (art. 971 alin. (2)).');
    } else if (relativeClass === 1) {
      spouseShare = new Fraction(1, 4);
      explanations.push('Soțul supraviețuitor, în concurs cu descendenții, are o pătrime (art. 972 alin. (1) lit. a).');
    } else if (relativeClass === 2) {
      const parents = acceptingParents(input.heirs);
      const collaterals = collateralShares(input.heirs);
      if (parents.length && collaterals) {
        spouseShare = new Fraction(1, 3);
        explanations.push(
          'Soțul vine cu ascendenți privilegiați și cu colaterali privilegiați: o treime soțul, două treimi clasa a II-a (art. 972 alin. (1) lit. b și art. 977 alin. (1)).',
        );
      } else {
        spouseShare = new Fraction(1, 2);
        explanations.push(
          'Soțul vine numai cu ascendenți privilegiați sau numai cu colaterali privilegiați: o jumătate (art. 972 alin. (1) lit. c și art. 977 alin. (2)).',
        );
      }
    } else {
      spouseShare = new Fraction(3, 4);
      explanations.push('Soțul, în concurs cu clasa a III-a sau a IV-a, are trei pătrimi (art. 972 alin. (1) lit. d).');
    }
  } else if (input.heirs.some((heir) => heir.kind === 'spouse' && heir.status === 'renounces')) {
    explanations.push('Soțul supraviețuitor a renunțat. Cota lui profită clasei cu care ar fi venit în concurs.');
  }

  const relativeMultiplier = Fraction.one().sub(spouseShare);
  const shares = new Map<string, Fraction>();
  if (spouse && !spouseShare.isZero()) shares.set(spouse.id, spouseShare);
  if (relative) {
    for (const [id, share] of relative) {
      const scaled = share.mul(relativeMultiplier);
      if (!scaled.isZero()) shares.set(id, scaled);
    }
  }

  if (relativeClass === 2 && relative) {
    explanations.push(classTwoDetail(input.heirs, spouseShare));
  }

  const vacant = shares.size === 0;
  if (vacant) {
    warnings.push(
      'Nicio persoană chemată nu vine la moștenire. Succesiunea poate fi vacantă și culeasă de comună, oraș sau municipiu, în condițiile art. 1135 și urm. C. civ. și ale Legii nr. 36/1995. Nu eliberați certificat de moștenitor pe acest proiect.',
    );
  }

  const totalShare = sumFractions([...shares.values()]);
  const sharesBalanced = vacant || totalShare.isOne();

  const reservedKinds = new Set<HeirKind>(['spouse', 'descendant', 'parent']);
  const heirResultsBase = [...shares.entries()].map(([id, share]) => {
    const heir = input.heirs.find((item) => item.id === id);
    const reserved = heir ? reservedKinds.has(heir.kind) : false;
    return {
      id,
      name: heir?.name || 'Moștenitor',
      kind: heir?.kind || 'descendant',
      share,
      reserve: reserved ? share.div(new Fraction(2, 1)) : Fraction.zero(),
      reserved,
      basis: heir ? basisFor(heir) : '',
    };
  });

  const totalReserve = sumFractions(heirResultsBase.map((heir) => heir.reserve));
  const disposable = Fraction.one().sub(totalReserve);
  explanations.push(
    `Rezerva fiecărui moștenitor rezervatar este jumătate din cota legală (art. 1088). Cotitatea disponibilă este ${quoteShare(disposable)}.`,
  );

  const legacyToStrangers = sumFractions(
    input.legacies.filter((legacy) => !legacy.reservedHeir).map((legacy) => new Fraction(legacy.numerator, legacy.denominator)),
  );
  const legacyExcess = legacyToStrangers.gt(disposable) ? legacyToStrangers.sub(disposable) : Fraction.zero();
  if (input.legacies.length) {
    warnings.push(
      'Legatele se impută mai întâi asupra cotității disponibile. Raportul donațiilor și reducțiunea se judecă pe masa de calcul, nu doar pe activul rămas la deces (art. 1091 și urm.). Cifrele de mai jos sunt control matematic, nu o reducțiune gata de certificat.',
    );
    if (!legacyExcess.isZero()) {
      warnings.push(
        `Liberalitățile către persoane nerezervatare depășesc cotitatea disponibilă cu ${quoteShare(legacyExcess)}. Ele sunt supuse reducțiunii.`,
      );
    }
  }

  const valuation = valueEstate(input);
  const { grossEstate, debtTotal, netEstate, netImmovable, spouseRetainedCommunity, householdGoods, estateAssets } = valuation;
  if (householdGoods > 0 && spouse) {
    explanations.push(
      `Mobilierul și obiectele de uz casnic afectate folosinței comune, în valoare de ${householdGoods.toFixed(2)} lei, se cuvin soțului pe lângă cotă și nu intră în masa care se împarte (art. 974).`,
    );
  } else if (householdGoods > 0 && !spouse) {
    warnings.push('Există bunuri marcate ca uz casnic al soțului, dar soțul nu vine la moștenire. Reclasificați bunurile în masă.');
  }
  if (input.spouseHasAnotherHome === false && spouse) {
    explanations.push(
      'Dacă soțul nu are un alt drept real asupra unei locuințe corespunzătoare, art. 973 îi recunoaște un drept de abitație asupra casei în care a locuit. Dreptul nu modifică cotele de proprietate și durează cel puțin un an.',
    );
  }

  const partitioned = estateAssets.filter((asset) => asset.assignedTo && shares.has(asset.assignedTo));
  const partitionedTotal = partitioned.reduce((sum, asset) => sum + asset.estateValue, 0);

  const rawMoney = heirResultsBase.map((heir) => {
    const estateValue = heir.share.toNumber() * grossEstate;
    const debtShare = heir.share.toNumber() * debtTotal;
    const netValue = heir.share.toNumber() * netEstate;
    const receivedPartition = partitioned
      .filter((asset) => asset.assignedTo === heir.id)
      .reduce((sum, asset) => sum + asset.estateValue, 0);
    const targetPartition = heir.share.toNumber() * partitionedTotal;
    const sulta = receivedPartition - targetPartition;
    return { ...heir, estateValue, debtShare, netValue, receivedPartition, sulta };
  });

  const heirs = balanceMoney(rawMoney, grossEstate, debtTotal, netEstate);
  const moneyBalanced =
    heirs.length === 0 || Math.abs(heirs.reduce((sum, heir) => sum + heir.netValue, 0) - roundMoney(netEstate)) < 0.02;

  if (partitioned.length && partitioned.length !== estateAssets.length) {
    explanations.push('Sulta este calculată numai pentru bunurile atribuite. Bunurile lăsate în indiviziune rămân comune pe cotele legale.');
  } else if (partitioned.length) {
    explanations.push('Sulta pozitivă înseamnă că moștenitorul a primit peste cotă și o datorează celorlalți. Sulta negativă este suma pe care o primește.');
  }

  if (input.deathOn && isAfterYears(input.deathOn, todayIso(), 1)) {
    warnings.push(
      'A trecut mai mult de un an de la deces. Termenul de opțiune succesorală este de un an (art. 1103), cu excepțiile legale pentru moștenitorii care nu au cunoscut deschiderea moștenirii. Verificați acceptarea, expresă sau tacită, înainte de a-i trece ca renunțători.',
    );
  }
  warnings.push(
    'Procedura succesorală este de competența notarului din circumscripția tribunalului ultimului domiciliu al defunctului și se soluționează numai la sediul biroului (Legea nr. 36/1995, art. 15).',
  );
  if (!input.lastDomicile.trim()) {
    warnings.push('Ultimul domiciliu nu este completat. Fără el nu se poate stabili competența teritorială.');
  }

  const checks: SuccessionResult['checks'] = [
    {
      ok: sharesBalanced,
      label: 'Suma cotelor legale',
      detail: vacant ? 'Nu există moștenitori. Succesiune posibil vacantă.' : `Suma cotelor este ${totalShare.toString()}.`,
    },
    {
      ok: moneyBalanced,
      label: 'Suma valorilor pe moștenitori',
      detail: moneyBalanced
        ? 'Valorile nete, după rotunjirea la ban, acoperă activul net.'
        : 'Rotunjirea nu închide suma. Reluați calculul înainte de certificat.',
    },
    {
      ok: !totalReserve.gt(Fraction.one()),
      label: 'Rezerva nu depășește moștenirea',
      detail: `Rezervă totală ${totalReserve.toString()}, cotitate disponibilă ${disposable.toString()}.`,
    },
    {
      ok: legacyExcess.isZero(),
      label: 'Liberalitățile față de cotitatea disponibilă',
      detail: input.legacies.length
        ? legacyExcess.isZero()
          ? 'Liberalitățile către nerezervatari încap în cotitatea disponibilă.'
          : `Depășire de ${legacyExcess.toString()}.`
        : 'Nu au fost introduse legate.',
    },
  ];

  return {
    heirs,
    vacant,
    relativeClass,
    spouseShare,
    disposable,
    totalReserve,
    grossEstate: roundMoney(grossEstate),
    debtTotal: roundMoney(debtTotal),
    netEstate: roundMoney(netEstate),
    netImmovable: roundMoney(netImmovable),
    spouseRetainedCommunity: roundMoney(spouseRetainedCommunity),
    householdGoods: roundMoney(householdGoods),
    sharesBalanced,
    moneyBalanced,
    legacyExcess,
    explanations,
    warnings,
    checks,
  };
}

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function basisFor(heir: HeirInput): string {
  if (heir.kind === 'spouse') return 'Art. 971–972 C. civ.';
  if (heir.kind === 'descendant') {
    return heir.representsId ? 'Art. 975 și art. 964–969 C. civ., pe tulpină.' : 'Art. 975 C. civ., pe capete.';
  }
  if (heir.kind === 'parent') return 'Art. 976–980 C. civ.';
  if (heir.kind === 'privileged-collateral') return 'Art. 976 și art. 981 C. civ.';
  if (heir.kind === 'ordinary-ascendant') return 'Art. 982 C. civ.';
  return 'Art. 983 C. civ.';
}

function classTwoDetail(heirs: HeirInput[], spouseShare: Fraction): string {
  const parents = acceptingParents(heirs);
  const collaterals = collateralShares(heirs);
  if (parents.length === 1 && collaterals) {
    return `În clasa a II-a, un singur părinte ia un sfert din partea clasei, iar colateralii privilegiați trei sferturi (art. 978 lit. a). Partea clasei este ${quoteShare(Fraction.one().sub(spouseShare))}.`;
  }
  if (parents.length >= 2 && collaterals) {
    return 'Ambii părinți iau împreună jumătate din partea clasei a II-a, iar colateralii privilegiați cealaltă jumătate (art. 978 lit. b).';
  }
  if (parents.length && !collaterals) {
    return 'Nu vin colaterali privilegiați. Ascendenții privilegiați culeg întreaga parte a clasei a II-a, în cote egale (art. 979 și art. 980).';
  }
  return 'Nu vin ascendenți privilegiați. Colateralii privilegiați culeg întreaga parte a clasei a II-a (art. 979).';
}

interface EstateAsset {
  assignedTo?: string;
  estateValue: number;
  category: 'imobil' | 'mobil';
}

function valueEstate(input: SuccessionInput): {
  grossEstate: number;
  debtTotal: number;
  netEstate: number;
  netImmovable: number;
  spouseRetainedCommunity: number;
  householdGoods: number;
  estateAssets: EstateAsset[];
} {
  let spouseRetainedCommunity = 0;
  let householdGoods = 0;
  const estateAssets: EstateAsset[] = [];
  for (const asset of input.assets) {
    const value = Math.max(0, asset.value);
    if (asset.regime === 'propriu-sot') continue;
    if (asset.regime === 'uz-casnic') {
      householdGoods += value;
      continue;
    }
    if (asset.regime === 'comun') {
      const numerator = asset.deceasedNumerator ?? 1;
      const denominator = asset.deceasedDenominator ?? 2;
      const deceased = value * (numerator / denominator);
      spouseRetainedCommunity += value - deceased;
      estateAssets.push({ assignedTo: asset.assignedTo, estateValue: deceased, category: asset.category });
    } else {
      estateAssets.push({ assignedTo: asset.assignedTo, estateValue: value, category: asset.category });
    }
  }
  const grossEstate = estateAssets.reduce((sum, asset) => sum + asset.estateValue, 0);
  const debtTotal = input.debts.reduce((sum, debt) => sum + Math.max(0, debt.amount), 0);
  const immovableGross = estateAssets
    .filter((asset) => asset.category === 'imobil')
    .reduce((sum, asset) => sum + asset.estateValue, 0);
  const immovableDebt = input.debts
    .filter((debt) => debt.immovable)
    .reduce((sum, debt) => sum + Math.max(0, debt.amount), 0);
  return {
    grossEstate,
    debtTotal,
    netEstate: grossEstate - debtTotal,
    netImmovable: Math.max(0, immovableGross - immovableDebt),
    spouseRetainedCommunity,
    householdGoods,
    estateAssets,
  };
}

function balanceMoney(
  heirs: Omit<HeirResult, never>[],
  gross: number,
  debts: number,
  net: number,
): HeirResult[] {
  if (!heirs.length) return [];
  const rounded = heirs.map((heir) => ({
    ...heir,
    estateValue: roundMoney(heir.estateValue),
    debtShare: roundMoney(heir.debtShare),
    netValue: roundMoney(heir.netValue),
    receivedPartition: roundMoney(heir.receivedPartition),
    sulta: roundMoney(heir.sulta),
  }));
  const fix = (key: 'estateValue' | 'debtShare' | 'netValue', target: number) => {
    const sum = rounded.reduce((acc, heir) => acc + heir[key], 0);
    const delta = roundMoney(target - sum);
    if (delta !== 0) {
      const host = [...rounded].sort((a, b) => b.share.toNumber() - a.share.toNumber())[0];
      host[key] = roundMoney(host[key] + delta);
    }
  };
  fix('estateValue', gross);
  fix('debtShare', debts);
  fix('netValue', net);
  return rounded;
}

function addShare(target: Map<string, Fraction>, id: string, share: Fraction): void {
  const current = target.get(id) ?? Fraction.zero();
  target.set(id, current.add(share));
}

function acceptingParents(heirs: HeirInput[]): HeirInput[] {
  return heirs.filter((heir) => heir.kind === 'parent' && heir.status === 'accepts');
}

function collectRepresentation(rootId: string, pool: HeirInput[]): Map<string, Fraction> {
  const direct = pool.filter((heir) => heir.representsId === rootId);
  const slots: { id?: string; sub?: Map<string, Fraction> }[] = [];
  for (const heir of direct) {
    if (heir.status === 'accepts') slots.push({ id: heir.id });
    else if (heir.status === 'predeceased' || heir.status === 'unworthy') {
      const sub = collectRepresentation(heir.id, pool);
      if (sub.size) slots.push({ sub });
    }
  }
  if (!slots.length) return new Map();
  const each = new Fraction(1, slots.length);
  const result = new Map<string, Fraction>();
  for (const slot of slots) {
    if (slot.sub) {
      for (const [id, part] of slot.sub) addShare(result, id, each.mul(part));
    } else if (slot.id) addShare(result, slot.id, each);
  }
  return result;
}

function distributeDescendants(heirs: HeirInput[]): Map<string, Fraction> | null {
  const descendants = heirs.filter((heir) => heir.kind === 'descendant');
  if (!descendants.length) return null;
  const children = descendants.filter((heir) => heir.degree === 1);
  const stems: Map<string, Fraction>[] = [];
  for (const child of children) {
    if (child.status === 'accepts') stems.push(new Map([[child.id, Fraction.one()]]));
    else if (child.status === 'predeceased' || child.status === 'unworthy') {
      const branch = collectRepresentation(child.id, descendants);
      if (branch.size) stems.push(branch);
    }
  }
  if (stems.length) return mergeStems(stems);
  const accepting = descendants.filter((heir) => heir.status === 'accepts' && heir.degree > 1);
  if (!accepting.length) return null;
  const closest = Math.min(...accepting.map((heir) => heir.degree));
  const group = accepting.filter((heir) => heir.degree === closest);
  const each = new Fraction(1, group.length);
  return new Map(group.map((heir) => [heir.id, each]));
}

function mergeStems(stems: Map<string, Fraction>[]): Map<string, Fraction> {
  const each = new Fraction(1, stems.length);
  const result = new Map<string, Fraction>();
  for (const stem of stems) {
    for (const [id, part] of stem) addShare(result, id, each.mul(part));
  }
  return result;
}

interface CollateralStem {
  line: CollateralLine;
  parts: Map<string, Fraction>;
}

function collateralShares(heirs: HeirInput[]): Map<string, Fraction> | null {
  const collaterals = heirs.filter((heir) => heir.kind === 'privileged-collateral');
  const siblings = collaterals.filter((heir) => heir.degree === 2);
  const stems: CollateralStem[] = [];
  for (const sibling of siblings) {
    const line = sibling.line ?? 'both';
    if (sibling.status === 'accepts') stems.push({ line, parts: new Map([[sibling.id, Fraction.one()]]) });
    else if (sibling.status === 'predeceased' || sibling.status === 'unworthy') {
      const branch = collectRepresentation(sibling.id, collaterals);
      if (branch.size) stems.push({ line, parts: branch });
    }
  }
  if (!stems.length) {
    const further = collaterals.filter((heir) => heir.status === 'accepts' && heir.degree > 2 && heir.degree <= 4);
    if (!further.length) return null;
    const closest = Math.min(...further.map((heir) => heir.degree));
    const group = further.filter((heir) => heir.degree === closest);
    const each = new Fraction(1, group.length);
    return new Map(group.map((heir) => [heir.id, each]));
  }
  const hasMaternal = stems.some((stem) => stem.line === 'maternal' || stem.line === 'both');
  const hasPaternal = stems.some((stem) => stem.line === 'paternal' || stem.line === 'both');
  const result = new Map<string, Fraction>();
  if (hasMaternal && hasPaternal) {
    pourLine(result, stems.filter((stem) => stem.line !== 'paternal'), new Fraction(1, 2));
    pourLine(result, stems.filter((stem) => stem.line !== 'maternal'), new Fraction(1, 2));
  } else {
    pourLine(result, stems, Fraction.one());
  }
  return result;
}

function pourLine(target: Map<string, Fraction>, stems: CollateralStem[], portion: Fraction): void {
  if (!stems.length) return;
  const each = portion.div(new Fraction(stems.length, 1));
  for (const stem of stems) {
    for (const [id, part] of stem.parts) addShare(target, id, each.mul(part));
  }
}

function distributeClassTwo(heirs: HeirInput[]): Map<string, Fraction> | null {
  const parents = acceptingParents(heirs);
  const collaterals = collateralShares(heirs);
  if (!parents.length && !collaterals) return null;
  const result = new Map<string, Fraction>();
  if (parents.length && collaterals) {
    const parentPortion = parents.length === 1 ? new Fraction(1, 4) : new Fraction(1, 2);
    const collateralPortion = Fraction.one().sub(parentPortion);
    const eachParent = parentPortion.div(new Fraction(parents.length, 1));
    for (const parent of parents) result.set(parent.id, eachParent);
    for (const [id, part] of collaterals) result.set(id, collateralPortion.mul(part));
    return result;
  }
  if (parents.length) {
    const eachParent = new Fraction(1, parents.length);
    for (const parent of parents) result.set(parent.id, eachParent);
    return result;
  }
  return collaterals;
}

function distributeOrdinary(heirs: HeirInput[], kind: HeirKind, maxDegree?: number): Map<string, Fraction> | null {
  const group = heirs.filter(
    (heir) => heir.kind === kind && heir.status === 'accepts' && (maxDegree === undefined || heir.degree <= maxDegree),
  );
  if (!group.length) return null;
  const closest = Math.min(...group.map((heir) => heir.degree));
  const coming = group.filter((heir) => heir.degree === closest);
  const each = new Fraction(1, coming.length);
  return new Map(coming.map((heir) => [heir.id, each]));
}
