import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActField } from '@/components/ActField';
import { DocumentPanel } from '@/components/DocumentPanel';
import type { FieldDef } from '@/domain/types';
import { useI18n } from '@/hooks/useI18n';
import { uid } from '@/lib/id';
import { actModels, successionModels, type LibraryModel } from '@/modules/sampleActs';
import { templateById } from '@/modules/templates';
import { db } from '@/store/db';
import { useAppStore } from '@/store/useAppStore';

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
  return order.map((key) => ({ title: key, fields: map.get(key) ?? [] }));
}

export function ModelsPage() {
  const { t } = useI18n();
  const office = useAppStore((state) => state.office);
  const [modelId, setModelId] = useState(actModels[0]?.id ?? '');
  const [values, setValues] = useState<Record<string, string>>({ ...(actModels[0]?.values ?? {}) });
  const [draftId, setDraftId] = useState<string | null>(null);

  const model: LibraryModel | undefined =
    actModels.find((item) => item.id === modelId) ?? successionModels.find((item) => item.id === modelId);
  const template = model?.kind === 'act' ? templateById(model.templateId) : undefined;
  const act = useMemo(() => {
    if (!model) return null;
    if (model.kind === 'act') return template ? template.generate(values, office) : null;
    return model.build(office);
  }, [model, office, template, values]);

  function choose(nextId: string) {
    setModelId(nextId);
    setDraftId(null);
    const next = actModels.find((item) => item.id === nextId);
    if (next) setValues({ ...next.values });
  }

  async function saveDraft() {
    if (!template || model?.kind !== 'act') return;
    const id = draftId ?? uid();
    await db.drafts.put({
      id,
      kind: 'act',
      title: model.title,
      updatedAt: new Date().toISOString(),
      payload: { templateId: template.id, values },
    });
    setDraftId(id);
  }

  const officeReady = office.notaryName.trim().length > 0;

  return (
    <div className="stack">
      <header>
        <p className="kicker">{t('navModels')}</p>
        <h1 className="h1">{t('openModels')}</h1>
        <p className="lead">{t('modelsLead')}</p>
      </header>
      <p className="banner">{t('modelsSampleNotice')}</p>
      {!officeReady && (
        <p className="issue warn">
          {t('modelsOfficeHint')} <Link to="/birou">{t('navSettings')}</Link>
        </p>
      )}
      <label className="field">
        <span>{t('choose')}</span>
        <select className="model-pick" value={modelId} onChange={(event) => choose(event.target.value)}>
          <optgroup label={t('modelsActs')}>
            {actModels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </optgroup>
          <optgroup label={t('modelsSuccessions')}>
            {successionModels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      {model && <p className="muted">{model.blurb}</p>}
      {model?.kind === 'act' && template && (
        <section className="card stack">
          <h2 className="h2">{t('data')}</h2>
          <p className="muted">{t('editThenSave')}</p>
          {groupsOf(template.fields).map((group) => (
            <div key={group.title} className="stack">
              <h2 className="h2">{group.title}</h2>
              <div className="fields">
                {group.fields.map((field) => (
                  <ActField
                    key={field.key}
                    field={field}
                    value={values[field.key] ?? ''}
                    onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      {model?.kind === 'succession' && (
        <div className="btn-row">
          <Link className="btn secondary" to="/succesiune">
            {t('successionOpen')}
          </Link>
        </div>
      )}
      {act && (
        <DocumentPanel
          document={act}
          template={template}
          values={model?.kind === 'act' ? values : undefined}
          onSave={model?.kind === 'act' ? saveDraft : undefined}
        />
      )}
    </div>
  );
}
