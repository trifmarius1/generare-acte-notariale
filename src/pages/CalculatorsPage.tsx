import { useMemo, useState } from 'react';
import { FilteredField } from '@/components/ActField';
import { useI18n } from '@/hooks/useI18n';
import { FIXED_FEES, feeImobil, feeSuccesiune, withVat } from '@/lib/fees';
import { formatLei } from '@/lib/money';
import { transferTax, type TransferExemption } from '@/lib/tax';
import { amount } from '@/modules/document';
import { useAppStore } from '@/store/useAppStore';

function lei(raw: string): number {
  return amount({ value: raw }, 'value') ?? 0;
}

export function CalculatorsPage() {
  const { t } = useI18n();
  const officeVat = useAppStore((state) => state.office.vatPayer);
  const [vatOn, setVatOn] = useState(officeVat);
  const [declared, setDeclared] = useState('');
  const [grid, setGrid] = useState('');
  const [acquired, setAcquired] = useState('');
  const [transferred, setTransferred] = useState('');
  const [exemption, setExemption] = useState<TransferExemption>('none');
  const [special, setSpecial] = useState(false);
  const [purchaseGrid, setPurchaseGrid] = useState('');
  const [saleGrid, setSaleGrid] = useState('');
  const [imobil, setImobil] = useState('');
  const [estate, setEstate] = useState('');

  const tax = useMemo(
    () =>
      transferTax({
        declaredValue: lei(declared),
        gridValue: lei(grid),
        acquiredOn: acquired,
        transferredOn: transferred,
        exemption,
        law17Special: special ? { purchaseGrid: lei(purchaseGrid), saleGrid: lei(saleGrid) } : undefined,
      }),
    [acquired, declared, exemption, grid, purchaseGrid, saleGrid, special, transferred],
  );
  const imobilFee = feeImobil(lei(imobil));
  const successionFee = feeSuccesiune(lei(estate));
  const imobilVat = withVat(imobilFee.onorariu + imobilFee.arhivare, vatOn);
  const successionVat = withVat(successionFee.onorariu + successionFee.arhivare, vatOn);

  return (
    <div className="stack">
      <header>
        <p className="kicker">{t('navCalc')}</p>
        <h1 className="h1">{t('calculate')}</h1>
        <p className="lead">{t('minimumFee')}</p>
      </header>
      <label className="field">
        <span>{t('vatPayer')}</span>
        <input type="checkbox" checked={vatOn} onChange={(event) => setVatOn(event.target.checked)} />
      </label>

      <section className="card stack">
        <h2 className="h2">{t('navCalc')} · art. 111</h2>
        <p className="muted">{t('legalNotesRo')}</p>
        <div className="fields">
          <FilteredField entryKey="declared" label={t('declared')} value={declared} onChange={setDeclared} />
          <FilteredField entryKey="grid" label={t('grid')} value={grid} onChange={setGrid} />
          <label className="field">
            <span>{t('acquired')}</span>
            <input type="date" value={acquired} onChange={(event) => setAcquired(event.target.value)} />
          </label>
          <label className="field">
            <span>{t('transferred')}</span>
            <input type="date" value={transferred} onChange={(event) => setTransferred(event.target.value)} />
          </label>
          <label className="field wide">
            <span>{t('exemption')}</span>
            <select value={exemption} onChange={(event) => setExemption(event.target.value as TransferExemption)}>
              <option value="none">{t('exemptNone')}</option>
              <option value="donatie-rude">{t('exemptGift')}</option>
              <option value="reconstituire">{t('exemptReconstitution')}</option>
              <option value="desfiintare-retroactiva">{t('exemptAnnulment')}</option>
              <option value="dare-in-plata">{t('exemptDatio')}</option>
              <option value="posesie-carte-funciara">{t('exemptPossession')}</option>
            </select>
          </label>
          <label className="field wide">
            <span>{t('special80')}</span>
            <input type="checkbox" checked={special} onChange={(event) => setSpecial(event.target.checked)} />
          </label>
          {special && (
            <>
              <FilteredField entryKey="purchaseGrid" label={t('purchaseGrid')} value={purchaseGrid} onChange={setPurchaseGrid} />
              <FilteredField entryKey="saleGrid" label={t('saleGrid')} value={saleGrid} onChange={setSaleGrid} />
            </>
          )}
        </div>
        <p>
          {t('total')}: <strong>{tax.exempt ? formatLei(0) : formatLei(tax.tax)}</strong>
          {tax.exempt ? '' : ` · ${(tax.rate * 100).toLocaleString('ro-RO')}% · ${formatLei(tax.base)}`}
        </p>
        {tax.exemptionNote && <p>{tax.exemptionNote}</p>}
        {tax.specialTax80 !== null && (
          <p>
            {t('special80')}: {formatLei(tax.specialTax80)}
          </p>
        )}
        {tax.notes.map((note) => (
          <p key={note} className="muted">
            {note}
          </p>
        ))}
      </section>

      <section className="card stack">
        <h2 className="h2">{t('minimumFee')} · imobil</h2>
        <FilteredField entryKey="amount" label={t('value')} value={imobil} onChange={setImobil} />
        <FeeLines onorariu={imobilFee.onorariu} arhivare={imobilFee.arhivare} vat={imobilVat} source={imobilFee.sursa} note={imobilFee.explicatie} />
      </section>

      <section className="card stack">
        <h2 className="h2">{t('minimumFee')} · {t('navSuccession')}</h2>
        <FilteredField entryKey="estate" label={t('feeEstate')} value={estate} onChange={setEstate} />
        <FeeLines
          onorariu={successionFee.onorariu}
          arhivare={successionFee.arhivare}
          vat={successionVat}
          source={successionFee.sursa}
          note={successionFee.explicatie}
        />
      </section>

      <section className="card stack">
        <h2 className="h2">{t('minimumFee')}</h2>
        <ul className="list">
          {FIXED_FEES.map((fee) => {
            const totals = withVat(fee.onorariu + fee.arhivare, vatOn);
            return (
              <li key={fee.id} className="row-card">
                <strong>{fee.label}</strong>
                <span>
                  {formatLei(fee.onorariu)} + {t('archive')} {formatLei(fee.arhivare)}
                  {vatOn ? ` + ${t('vat')} ${formatLei(totals.vat)} = ${formatLei(totals.total)}` : ''}
                </span>
                <span className="muted">{fee.sursa}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function FeeLines({
  onorariu,
  arhivare,
  vat,
  source,
  note,
}: {
  onorariu: number;
  arhivare: number;
  vat: { vat: number; total: number };
  source: string;
  note: string;
}) {
  const { t } = useI18n();
  return (
    <>
      <p>
        {t('minimumFee')}: <strong>{formatLei(onorariu)}</strong> · {t('archive')} {formatLei(arhivare)}
        {vat.vat > 0 ? ` · ${t('vat')} ${formatLei(vat.vat)} · ${t('total')} ${formatLei(vat.total)}` : ''}
      </p>
      <p className="muted">{note}</p>
      <p className="muted">{source}</p>
    </>
  );
}
