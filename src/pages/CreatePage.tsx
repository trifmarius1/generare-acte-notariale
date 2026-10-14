import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { liveQuery } from 'dexie';
import { ActField, FilteredField } from '@/components/ActField';
import { DocumentPanel } from '@/components/DocumentPanel';
import type { ActDocument, FieldDef } from '@/domain/types';
import { useI18n } from '@/hooks/useI18n';
import { FIXED_FEES, feeImobil, withVat } from '@/lib/fees';
import { uid } from '@/lib/id';
import { formatLei } from '@/lib/money';
import { transferTax } from '@/lib/tax';
import { customDocument, placeholderKeys } from '@/modules/customAct';
import { amount, splitStoredIdentity } from '@/modules/document';
import { templateById, templates } from '@/modules/templates';
import { db, type CustomTemplateRecord } from '@/store/db';
import { useAppStore } from '@/store/useAppStore';

interface ActDraftPayload {
  templateId: string;
  customId?: string;
  values: Record<string, string>;
}

function isActPayload(value: unknown): value is ActDraftPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as ActDraftPayload;
  return typeof record.templateId === 'string' && !!record.values && typeof record.values === 'object';
}

function groupsOf(fields: FieldDef[]) {
  const order: string[] = [];
  const map = new Map<string, FieldDef[]>();
  for (const field of fields) {
    const key = field.group.ro;
    if (!map.has(key)) {
      order.push(key);
      map.set(key, []);
    }
    map.get(key)?.push(field);
  }
  return order.map((key) => ({ group: map.get(key)?.[0].group, fields: map.get(key) ?? [] }));
}

export function CreatePage() {
  const { t, L } = useI18n();
  const office = useAppStore((state) => state.office);
  const [params] = useSearchParams();
  const draftParam = params.get('ciorna');
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [customId, setCustomId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [customs, setCustoms] = useState<CustomTemplateRecord[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [ownTitle, setOwnTitle] = useState('');
  const [ownBody, setOwnBody] = useState('');

  useEffect(() => {
    const subscription = liveQuery(() => db.templates.orderBy('updatedAt').reverse().toArray()).subscribe({
      next: setCustoms,
      error: () => setCustoms([]),
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!draftParam) return;
    let cancelled = false;
    void db.drafts.get(draftParam).then((record) => {
      if (cancelled || !record || record.kind !== 'act' || !isActPayload(record.payload)) return;
      setDraftId(record.id);
      setValues(splitStoredIdentity(record.payload.values));
      if (record.payload.templateId === 'custom' && record.payload.customId) {
        setCustomId(record.payload.customId);
        setTemplateId('');
      } else if (templateById(record.payload.templateId)) {
        setTemplateId(record.payload.templateId);
        setCustomId(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [draftParam]);

  const selectedCustom = customs.find((item) => item.id === customId) ?? null;
  const template = customId ? undefined : templateById(templateId);
  const customFields = selectedCustom ? placeholderKeys(selectedCustom.body) : [];

  const document = useMemo<ActDocument | null>(() => {
    if (selectedCustom) return customDocument(selectedCustom.title, selectedCustom.body, values, office);
    if (!template) return null;
    return template.generate(values, office);
  }, [office, selectedCustom, template, values]);

  function chooseTemplate(id: string) {
    setTemplateId(id);
    setCustomId(null);
    setValues({});
    setDraftId(null);
  }

  function chooseCustom(id: string) {
    setCustomId(id);
    setTemplateId('');
    setValues({});
    setDraftId(null);
  }

  function setValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function saveDraft() {
    if (!document) return;
    const id = draftId ?? uid();
    const title = selectedCustom?.title || template?.title.ro || document.title;
    await db.drafts.put({
      id,
      kind: 'act',
      title,
      updatedAt: new Date().toISOString(),
      payload: {
        templateId: selectedCustom ? 'custom' : templateId,
        customId: selectedCustom?.id,
        values,
      } satisfies ActDraftPayload,
    });
    setDraftId(id);
  }

  async function saveOwnModel() {
    if (!ownTitle.trim() || !ownBody.trim()) return;
    await db.templates.put({
      id: uid(),
      title: ownTitle.trim(),
      body: ownBody,
      updatedAt: new Date().toISOString(),
    });
    setOwnTitle('');
    setOwnBody('');
  }

  return (
    <div className="stack">
      <header>
        <p className="kicker">{t('navCreate')}</p>
        <h1 className="h1">{t('openCreate')}</h1>
        <p className="lead">{t('actsStayRo')}</p>
      </header>
      <section className="stack">
        <h2 className="h2">{t('choose')}</h2>
        <div className="grid-3">
          {templates.map((item) => (
            <button
              key={item.id}
              type="button"
              className="choice"
              aria-pressed={!customId && item.id === templateId}
              onClick={() => chooseTemplate(item.id)}
            >
              <span className="kicker">{L(item.category)}</span>
              <strong>{L(item.title)}</strong>
              <span className="muted">{L(item.summary)}</span>
            </button>
          ))}
          {customs.map((item) => (
            <button
              key={item.id}
              type="button"
              className="choice"
              aria-pressed={item.id === customId}
              onClick={() => chooseCustom(item.id)}
            >
              <span className="kicker">{t('customTitle')}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>
      </section>

      <div className="grid-2">
        <section className="card stack">
          <h2 className="h2">{t('data')}</h2>
          {template &&
            groupsOf(template.fields).map((group) => (
              <fieldset key={group.group?.ro} className="fields" style={{ border: 0, margin: 0, padding: 0 }}>
                <legend className="kicker">{group.group ? L(group.group) : ''}</legend>
                {group.fields.map((field) => (
                  <ActField key={field.key} field={field} value={values[field.key] ?? ''} onChange={setValue} />
                ))}
              </fieldset>
            ))}
          {selectedCustom && (
            <div className="fields">
              {customFields.length === 0 && <p className="muted">{t('customBody')}</p>}
              {customFields.map((key) => (
                <FilteredField
                  key={key}
                  entryKey={key}
                  label={key}
                  value={values[key] ?? ''}
                  onChange={(next) => setValue(key, next)}
                />
              ))}
            </div>
          )}
          {template && <CostNote templateId={template.id} values={values} vatPayer={office.vatPayer} />}
        </section>
        {document && <DocumentPanel document={document} template={template} values={values} onSave={saveDraft} />}
      </div>

      <section className="card stack">
        <h2 className="h2">{t('customTitle')}</h2>
        <p className="muted">{t('customBody')}</p>
        <FilteredField entryKey="title" label={t('name')} value={ownTitle} onChange={setOwnTitle} />
        <label className="field">
          <span>{t('customBody')}</span>
          <textarea value={ownBody} onChange={(event) => setOwnBody(event.target.value)} style={{ minHeight: 140 }} />
        </label>
        <button type="button" className="btn secondary" onClick={() => void saveOwnModel()}>
          {t('customSave')}
        </button>
        {customs.length === 0 && <p className="muted">{t('customEmpty')}</p>}
      </section>
    </div>
  );
}

function CostNote({
  templateId,
  values,
  vatPayer,
}: {
  templateId: string;
  values: Record<string, string>;
  vatPayer: boolean;
}) {
  const { t } = useI18n();
  if (templateId === 'procura') {
    const fixed = FIXED_FEES.find((fee) => fee.id === (values.fel === 'pensie' ? 'procura-pensie' : 'procura-reprezentare'));
    if (!fixed) return null;
    const totals = withVat(fixed.onorariu + fixed.arhivare, vatPayer);
    return (
      <div className="issue info">
        <strong>
          {formatLei(fixed.onorariu)} + {t('archive')} {formatLei(fixed.arhivare)}
          {vatPayer ? ` · ${t('vat')} ${formatLei(totals.vat)}` : ''}
        </strong>
        <div>{fixed.sursa}</div>
        {values.pret === 'da' && (
          <div>
            Dacă prețul a fost deja încasat, onorariul poate trece la anexa nr. 2 pct. XIV. Suma acelui punct nu este
            introdusă în aplicație.
          </div>
        )}
      </div>
    );
  }
  if (templateId !== 'vanzare-imobil' && templateId !== 'antecontract') return null;
  const price = amount(values, 'pret') ?? 0;
  const grid = amount(values, 'grila') ?? 0;
  if (!price && !grid) return <p className="muted">{t('declared')}</p>;
  const tax = transferTax({
    declaredValue: price,
    gridValue: grid,
    acquiredOn: values.dobandire ?? '',
    transferredOn: values.dataAct ?? '',
    exemption: 'none',
  });
  const fee = feeImobil(Math.max(price, grid));
  const totals = withVat(fee.onorariu + fee.arhivare, vatPayer);
  return (
    <div className="issue info">
      <div>
        Impozit art. 111: {formatLei(tax.tax)}. {tax.notes[tax.notes.length - 1]}
      </div>
      <div>
        {t('minimumFee')}: {formatLei(fee.onorariu)} + {t('archive')} {formatLei(fee.arhivare)}
        {vatPayer ? ` · ${t('vat')} ${formatLei(totals.vat)} · ${t('total')} ${formatLei(totals.total)}` : ''}
      </div>
      <div className="muted">{fee.sursa}</div>
    </div>
  );
}
