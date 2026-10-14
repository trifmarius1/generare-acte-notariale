import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DigitsField, FilteredField, MoneyField } from '@/components/ActField';
import { DocumentPanel } from '@/components/DocumentPanel';
import type { Localized } from '@/domain/types';
import { useI18n } from '@/hooks/useI18n';
import { feeSuccesiune } from '@/lib/fees';
import { uid } from '@/lib/id';
import { formatLei } from '@/lib/money';
import { quoteShare } from '@/lib/romanian';
import {
  computeSuccession,
  type AssetInput,
  type AssetRegime,
  type CollateralLine,
  type DebtInput,
  type HeirInput,
  type HeirKind,
  type HeirStatus,
  type LegacyInput,
  type SuccessionInput,
  type SuccessionResult,
} from '@/lib/succession';
import { successionTax } from '@/lib/tax';
import { successionCertificate, successionClosing } from '@/modules/successionDoc';
import { db } from '@/store/db';
import { useAppStore } from '@/store/useAppStore';

const SAMPLE: Localized = {
  ro: 'Date de exemplu: soț și un copil, apartament comun de 400.000 lei. Nu este un dosar real.',
  en: 'Sample data: a spouse and one child, a common apartment of 400,000 lei. This is not a real file.',
  hu: 'Mintaadatok: házastárs és egy gyermek, 400 000 lejes közös lakás. Nem valós ügy.',
};

const REGIMES: { value: AssetRegime; label: Localized }[] = [
  { value: 'propriu-defunct', label: { ro: 'Propriu al defunctului', en: 'Own property of the deceased', hu: 'Az elhunyt különvagyona' } },
  { value: 'comun', label: { ro: 'Comun', en: 'Common property', hu: 'Közös vagyon' } },
  { value: 'propriu-sot', label: { ro: 'Propriu al soțului', en: 'Own property of the spouse', hu: 'A házastárs különvagyona' } },
  { value: 'uz-casnic', label: { ro: 'Uz casnic, art. 974', en: 'Household goods, art. 974', hu: 'Háztartási holmi, 974. cikk' } },
];

const KINDS: { value: HeirKind; label: 'spouse' | 'descendant' | 'parent' | 'sibling' | 'ordinaryAsc' | 'ordinaryCol' }[] = [
  { value: 'spouse', label: 'spouse' },
  { value: 'descendant', label: 'descendant' },
  { value: 'parent', label: 'parent' },
  { value: 'privileged-collateral', label: 'sibling' },
  { value: 'ordinary-ascendant', label: 'ordinaryAsc' },
  { value: 'ordinary-collateral', label: 'ordinaryCol' },
];

const STATUSES: { value: HeirStatus; label: 'accepts' | 'renounces' | 'predeceased' | 'unworthy' }[] = [
  { value: 'accepts', label: 'accepts' },
  { value: 'renounces', label: 'renounces' },
  { value: 'predeceased', label: 'predeceased' },
  { value: 'unworthy', label: 'unworthy' },
];

function blankHeir(): HeirInput {
  return { id: uid(), name: '', kind: 'descendant', status: 'accepts', degree: 1 };
}

function exampleInput(): SuccessionInput {
  return {
    deceasedName: 'Pop Andrei (exemplu)',
    deathOn: '2024-03-01',
    finalizedOn: '2026-02-01',
    lastDomicile: 'Cluj-Napoca (exemplu)',
    spouseHasAnotherHome: true,
    heirs: [
      { id: 'exemplu-sot', name: 'Pop Maria (exemplu)', kind: 'spouse', status: 'accepts', degree: 0 },
      { id: 'exemplu-copil', name: 'Pop Ioana (exemplu)', kind: 'descendant', status: 'accepts', degree: 1 },
    ],
    assets: [
      { id: 'exemplu-apt', label: 'Apartament (exemplu)', category: 'imobil', regime: 'comun', value: 400_000 },
    ],
    debts: [],
    legacies: [],
  };
}

function isSuccession(value: unknown): value is SuccessionInput {
  if (!value || typeof value !== 'object') return false;
  const record = value as SuccessionInput;
  return typeof record.deceasedName === 'string' && Array.isArray(record.heirs) && Array.isArray(record.assets);
}

function readyInput(form: SuccessionInput): SuccessionInput {
  return {
    ...form,
    heirs: form.heirs
      .filter((heir) => heir.name.trim())
      .map((heir) => ({
        ...heir,
        name: heir.name.trim(),
        degree: Number.isInteger(heir.degree) ? heir.degree : 1,
        representsId: heir.representsId || undefined,
        line: heir.kind === 'privileged-collateral' ? heir.line ?? 'both' : undefined,
      })),
    assets: form.assets
      .filter((asset) => asset.label.trim() || asset.value > 0)
      .map((asset) => ({ ...asset, label: asset.label.trim() || '……', assignedTo: asset.assignedTo || undefined })),
    debts: form.debts.filter((debt) => debt.label.trim() || debt.amount > 0),
    legacies: form.legacies.filter(
      (legacy) =>
        legacy.beneficiary.trim() &&
        legacy.denominator > 0 &&
        Number.isInteger(legacy.numerator) &&
        Number.isInteger(legacy.denominator),
    ),
  };
}

export function SuccessionPage() {
  const { t, L, language } = useI18n();
  const office = useAppStore((state) => state.office);
  const [params] = useSearchParams();
  const draftParam = params.get('ciorna');
  const [deceasedName, setDeceasedName] = useState('');
  const [deathOn, setDeathOn] = useState('');
  const [finalizedOn, setFinalizedOn] = useState('');
  const [lastDomicile, setLastDomicile] = useState('');
  const [spouseHasAnotherHome, setSpouseHasAnotherHome] = useState(true);
  const [heirs, setHeirs] = useState<HeirInput[]>([blankHeir()]);
  const [assets, setAssets] = useState<AssetInput[]>([]);
  const [debts, setDebts] = useState<DebtInput[]>([]);
  const [legacies, setLegacies] = useState<LegacyInput[]>([]);
  const [sample, setSample] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [paper, setPaper] = useState<'certificate' | 'closing'>('certificate');

  const form = useMemo<SuccessionInput>(
    () => ({
      deceasedName,
      deathOn,
      finalizedOn,
      lastDomicile,
      spouseHasAnotherHome,
      heirs,
      assets,
      debts,
      legacies,
    }),
    [assets, deathOn, debts, deceasedName, finalizedOn, heirs, lastDomicile, legacies, spouseHasAnotherHome],
  );

  useEffect(() => {
    if (!draftParam) return;
    let cancelled = false;
    void db.drafts.get(draftParam).then((record) => {
      if (cancelled || !record || record.kind !== 'succession' || !isSuccession(record.payload)) return;
      const loaded = record.payload;
      setDraftId(record.id);
      setDeceasedName(loaded.deceasedName);
      setDeathOn(loaded.deathOn);
      setFinalizedOn(loaded.finalizedOn);
      setLastDomicile(loaded.lastDomicile);
      setSpouseHasAnotherHome(loaded.spouseHasAnotherHome);
      setHeirs(loaded.heirs.length ? loaded.heirs : [blankHeir()]);
      setAssets(loaded.assets);
      setDebts(loaded.debts);
      setLegacies(loaded.legacies);
      setSample(false);
    });
    return () => {
      cancelled = true;
    };
  }, [draftParam]);

  const computed = useMemo(() => {
    try {
      return { result: computeSuccession(readyInput(form)), error: '' };
    } catch (error) {
      return { result: null as SuccessionResult | null, error: error instanceof Error ? error.message : t('calcFailed') };
    }
  }, [form, language]);

  const result = computed.result;
  const document = useMemo(() => {
    if (!result || !form.deceasedName.trim()) return null;
    const input = readyInput(form);
    return paper === 'closing' ? successionClosing(input, result, office) : successionCertificate(input, result, office);
  }, [form, office, paper, result]);

  function apply(next: SuccessionInput, markSample: boolean) {
    setDeceasedName(next.deceasedName);
    setDeathOn(next.deathOn);
    setFinalizedOn(next.finalizedOn);
    setLastDomicile(next.lastDomicile);
    setSpouseHasAnotherHome(next.spouseHasAnotherHome);
    setHeirs(next.heirs);
    setAssets(next.assets);
    setDebts(next.debts);
    setLegacies(next.legacies);
    setSample(markSample);
    setDraftId(null);
  }

  function patchHeir(id: string, patch: Partial<HeirInput>) {
    setSample(false);
    setHeirs((current) => current.map((heir) => (heir.id === id ? { ...heir, ...patch } : heir)));
  }

  async function saveDraft() {
    const id = draftId ?? uid();
    await db.drafts.put({
      id,
      kind: 'succession',
      title: form.deceasedName.trim() || t('deceased'),
      updatedAt: new Date().toISOString(),
      payload: form,
    });
    setDraftId(id);
  }

  const tax = result ? successionTax({ deathOn: form.deathOn, finalizedOn: form.finalizedOn, netImmovable: result.netImmovable }) : null;
  const fee = result ? feeSuccesiune(result.grossEstate) : null;

  return (
    <div className="stack">
      <header>
        <p className="kicker">{t('navSuccession')}</p>
        <h1 className="h1">{t('openSuccession')}</h1>
        <p className="lead">{t('actsStayRo')}</p>
      </header>
      <button type="button" className="btn secondary" onClick={() => apply(exampleInput(), true)}>
        {t('example')}
      </button>
      {sample && <p className="issue warn">{L(SAMPLE)}</p>}

      <section className="card">
        <h2 className="h2">{t('deceased')}</h2>
        <div className="fields">
          <FilteredField
            entryKey="deceasedName"
            label={t('name')}
            value={deceasedName}
            onChange={(next) => {
              setSample(false);
              setDeceasedName(next);
            }}
          />
          <label className="field">
            <span>{t('death')}</span>
            <input type="date" value={deathOn} onChange={(event) => setDeathOn(event.target.value)} />
          </label>
          <label className="field">
            <span>{t('finalized')}</span>
            <input type="date" value={finalizedOn} onChange={(event) => setFinalizedOn(event.target.value)} />
          </label>
          <FilteredField entryKey="lastDomicile" label={t('domicile')} value={lastDomicile} onChange={setLastDomicile} />
          <label className="field wide">
            <span>{t('homeRight')}</span>
            <input
              type="checkbox"
              checked={spouseHasAnotherHome}
              onChange={(event) => setSpouseHasAnotherHome(event.target.checked)}
            />
          </label>
        </div>
      </section>

      <section className="stack">
        <div className="btn-row">
          <h2 className="h2">{t('addHeir')}</h2>
          <button type="button" className="btn" onClick={() => setHeirs((current) => [...current, blankHeir()])}>
            {t('addHeir')}
          </button>
        </div>
        {heirs.map((heir) => (
          <article key={heir.id} className="row-card">
            <div className="fields">
              <FilteredField
                entryKey="name"
                label={t('name')}
                value={heir.name}
                onChange={(name) => patchHeir(heir.id, { name })}
              />
              <label className="field">
                <span>{t('kind')}</span>
                <select value={heir.kind} onChange={(event) => patchHeir(heir.id, { kind: event.target.value as HeirKind })}>
                  {KINDS.map((kind) => (
                    <option key={kind.value} value={kind.value}>
                      {t(kind.label)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t('status')}</span>
                <select value={heir.status} onChange={(event) => patchHeir(heir.id, { status: event.target.value as HeirStatus })}>
                  {STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {t(status.label)}
                    </option>
                  ))}
                </select>
              </label>
              <DigitsField
                label={t('degree')}
                entryKey="degree"
                value={heir.degree}
                onChange={(degree) => patchHeir(heir.id, { degree })}
              />
              {heir.kind === 'privileged-collateral' && (
                <label className="field">
                  <span>{t('line')}</span>
                  <select value={heir.line ?? 'both'} onChange={(event) => patchHeir(heir.id, { line: event.target.value as CollateralLine })}>
                    <option value="both">{t('both')}</option>
                    <option value="maternal">{t('maternal')}</option>
                    <option value="paternal">{t('paternal')}</option>
                  </select>
                </label>
              )}
              <label className="field">
                <span>{t('represents')}</span>
                <select value={heir.representsId ?? ''} onChange={(event) => patchHeir(heir.id, { representsId: event.target.value })}>
                  <option value="">—</option>
                  {heirs
                    .filter((other) => other.id !== heir.id)
                    .map((other) => (
                      <option key={other.id} value={other.id}>
                        {other.name || other.id}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <button type="button" className="btn secondary" onClick={() => setHeirs((current) => current.filter((item) => item.id !== heir.id))}>
              {t('remove')}
            </button>
          </article>
        ))}
      </section>

      <section className="stack">
        <div className="btn-row">
          <h2 className="h2">{t('asset')}</h2>
          <button
            type="button"
            className="btn"
            onClick={() =>
              setAssets((current) => [
                ...current,
                { id: uid(), label: '', category: 'imobil', regime: 'propriu-defunct', value: 0 },
              ])
            }
          >
            {t('addAsset')}
          </button>
        </div>
        {assets.map((asset) => (
          <article key={asset.id} className="row-card">
            <div className="fields">
              <FilteredField
                entryKey="label"
                label={t('asset')}
                value={asset.label}
                onChange={(label) => setAssets((current) => current.map((item) => item.id === asset.id ? { ...item, label } : item))}
              />
              <MoneyField
                label={t('value')}
                value={asset.value}
                onChange={(value) => setAssets((current) => current.map((item) => item.id === asset.id ? { ...item, value } : item))}
              />
              <label className="field">
                <span>{t('regime')}</span>
                <select
                  value={asset.regime}
                  onChange={(event) =>
                    setAssets((current) =>
                      current.map((item) => item.id === asset.id ? { ...item, regime: event.target.value as AssetRegime } : item),
                    )
                  }
                >
                  {REGIMES.map((regime) => (
                    <option key={regime.value} value={regime.value}>
                      {L(regime.label)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t('assign')}</span>
                <select
                  value={asset.assignedTo ?? ''}
                  onChange={(event) =>
                    setAssets((current) => current.map((item) => item.id === asset.id ? { ...item, assignedTo: event.target.value } : item))
                  }
                >
                  <option value="">{t('indivision')}</option>
                  {heirs.map((heir) => (
                    <option key={heir.id} value={heir.id}>
                      {heir.name || heir.id}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" className="btn secondary" onClick={() => setAssets((current) => current.filter((item) => item.id !== asset.id))}>
              {t('remove')}
            </button>
          </article>
        ))}
      </section>

      <section className="stack">
        <div className="btn-row">
          <h2 className="h2">{t('debt')}</h2>
          <button
            type="button"
            className="btn"
            onClick={() => setDebts((current) => [...current, { id: uid(), label: '', amount: 0, immovable: false }])}
          >
            {t('addDebt')}
          </button>
        </div>
        {debts.map((debt) => (
          <article key={debt.id} className="row-card">
            <div className="fields">
              <FilteredField
                entryKey="label"
                label={t('debt')}
                value={debt.label}
                onChange={(label) => setDebts((current) => current.map((item) => item.id === debt.id ? { ...item, label } : item))}
              />
              <MoneyField
                label={t('value')}
                value={debt.amount}
                onChange={(amount) => setDebts((current) => current.map((item) => item.id === debt.id ? { ...item, amount } : item))}
              />
              <label className="field">
                <span>{t('immovableDebt')}</span>
                <input
                  type="checkbox"
                  checked={debt.immovable}
                  onChange={(event) =>
                    setDebts((current) => current.map((item) => item.id === debt.id ? { ...item, immovable: event.target.checked } : item))
                  }
                />
              </label>
            </div>
            <button type="button" className="btn secondary" onClick={() => setDebts((current) => current.filter((item) => item.id !== debt.id))}>
              {t('remove')}
            </button>
          </article>
        ))}
      </section>

      <section className="stack">
        <div className="btn-row">
          <h2 className="h2">{t('legacy')}</h2>
          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              setLegacies((current) => [...current, { id: uid(), beneficiary: '', numerator: 1, denominator: 4, reservedHeir: false }])
            }
          >
            {t('legacy')}
          </button>
        </div>
        {legacies.map((legacy) => (
          <article key={legacy.id} className="row-card">
            <div className="fields">
              <FilteredField
                entryKey="beneficiary"
                label={t('name')}
                value={legacy.beneficiary}
                onChange={(beneficiary) =>
                  setLegacies((current) => current.map((item) => item.id === legacy.id ? { ...item, beneficiary } : item))
                }
              />
              <DigitsField
                label={t('legacy')}
                entryKey="numerator"
                value={legacy.numerator}
                onChange={(numerator) =>
                  setLegacies((current) => current.map((item) => item.id === legacy.id ? { ...item, numerator } : item))
                }
              />
              <DigitsField
                label="/"
                entryKey="denominator"
                value={legacy.denominator}
                onChange={(denominator) =>
                  setLegacies((current) => current.map((item) => item.id === legacy.id ? { ...item, denominator } : item))
                }
              />
            </div>
            <button type="button" className="btn secondary" onClick={() => setLegacies((current) => current.filter((item) => item.id !== legacy.id))}>
              {t('remove')}
            </button>
          </article>
        ))}
      </section>

      {computed.error && <p className="issue error">{computed.error}</p>}
      {result && (
        <section className="card stack">
          <h2 className="h2">{t('result')}</h2>
          <p>
            {t('shareSum')}: <strong className={result.sharesBalanced ? 'ok' : 'bad'}>{result.sharesBalanced ? '1/1' : '≠ 1/1'}</strong>
            {' · '}
            {t('netEstate')}: <strong>{formatLei(result.netEstate)}</strong>
            {' · '}
            {t('community')}: {formatLei(result.spouseRetainedCommunity)}
          </p>
          <ul className="list">
            {result.heirs.map((heir) => (
              <li key={heir.id}>
                <strong>{heir.name}</strong> · {quoteShare(heir.share)} · {formatLei(heir.netValue)}
                {heir.sulta !== 0 ? ` · sultă ${formatLei(heir.sulta)}` : ''}
                <div className="muted">{heir.basis}</div>
              </li>
            ))}
          </ul>
          {result.checks.map((check) => (
            <p key={check.label} className={check.ok ? 'ok' : 'bad'}>
              {check.label}. {check.detail}
            </p>
          ))}
          {result.warnings.map((warning) => (
            <p key={warning} className="issue warn">
              {warning}
            </p>
          ))}
          {result.explanations.map((line) => (
            <p key={line} className="muted">
              {line}
            </p>
          ))}
          {fee && tax && (
            <p>
              {t('minimumFee')}: {formatLei(fee.onorariu)} + {t('archive')} {formatLei(fee.arhivare)}. {tax.note}
              {tax.due ? ` ${formatLei(tax.tax)}.` : ''}
            </p>
          )}
          <div className="btn-row">
            <button type="button" className={paper === 'certificate' ? 'btn' : 'btn secondary'} onClick={() => setPaper('certificate')}>
              {t('certificate')}
            </button>
            <button type="button" className={paper === 'closing' ? 'btn' : 'btn secondary'} onClick={() => setPaper('closing')}>
              {t('closing')}
            </button>
          </div>
        </section>
      )}
      {document && <DocumentPanel document={document} onSave={saveDraft} />}
    </div>
  );
}
