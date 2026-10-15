import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActField } from '@/components/ActField';
import { DocumentPanel } from '@/components/DocumentPanel';
import type { ActDocument, FieldDef, OfficeProfile } from '@/domain/types';
import { useI18n } from '@/hooks/useI18n';
import { documentToDocx } from '@/lib/docxExport';
import { saveBlob } from '@/lib/files';
import { uid } from '@/lib/id';
import { otherModels } from '@/modules/otherActs';
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

function readyAct(model: LibraryModel, office: OfficeProfile, edited?: Record<string, string>): ActDocument | null {
  if (model.kind === 'act') {
    const template = templateById(model.templateId);
    return template ? template.generate(edited ?? model.values, office) : null;
  }
  return model.build(office);
}

function DocxCatalog({
  label,
  models,
  openId,
  busyId,
  onSave,
  onOpen,
}: {
  label: string;
  models: LibraryModel[];
  openId: string;
  busyId: string;
  onSave: (model: LibraryModel) => void;
  onOpen: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="stack">
      <h2 className="h2">{label}</h2>
      <div className="docx-list">
        {models.map((item) => (
          <article key={item.id} className={item.id === openId ? 'docx-row is-open' : 'docx-row'}>
            <div>
              <strong>{item.title}</strong>
              <p className="muted">{item.blurb}</p>
            </div>
            <div className="docx-actions">
              <button
                type="button"
                className="btn"
                disabled={busyId !== ''}
                aria-busy={busyId === item.id}
                onClick={() => onSave(item)}
              >
                {t('saveDocxLocal')}
              </button>
              <button type="button" className="btn secondary" onClick={() => onOpen(item.id)}>
                {t('viewDraft')}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ModelsPage() {
  const { t } = useI18n();
  const office = useAppStore((state) => state.office);
  const [modelId, setModelId] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [draftId, setDraftId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const editorRef = useRef<HTMLElement>(null);

  const model: LibraryModel | undefined =
    actModels.find((item) => item.id === modelId) ??
    successionModels.find((item) => item.id === modelId) ??
    otherModels.find((item) => item.id === modelId);
  const template = model?.kind === 'act' ? templateById(model.templateId) : undefined;
  const act = useMemo(() => (model ? readyAct(model, office, model.kind === 'act' ? values : undefined) : null), [model, office, values]);

  useEffect(() => {
    if (!modelId) return;
    editorRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [modelId]);

  function choose(nextId: string) {
    setModelId(nextId);
    setDraftId(null);
    const next = actModels.find((item) => item.id === nextId);
    setValues(next ? { ...next.values } : {});
  }

  async function saveDocx(item: LibraryModel) {
    setBusyId(item.id);
    setNotice('');
    try {
      const edited = item.kind === 'act' && item.id === modelId ? values : undefined;
      const built = readyAct(item, office, edited);
      if (!built) {
        setNotice(t('saveError'));
        return;
      }
      const blob = await documentToDocx(built);
      const where = await saveBlob(blob, `${item.id}.docx`, 'docx');
      setNotice(`${item.title}. ${where === 'picker' ? t('docxSaved') : t('docxDownloaded')}`);
    } catch (error) {
      setNotice(error instanceof DOMException && error.name === 'AbortError' ? t('aborted') : t('saveError'));
    } finally {
      setBusyId('');
    }
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
      {notice && (
        <p className="toast" role="status">
          {notice}
        </p>
      )}
      <DocxCatalog
        label={t('modelsActs')}
        models={actModels}
        openId={modelId}
        busyId={busyId}
        onSave={(item) => void saveDocx(item)}
        onOpen={choose}
      />
      <DocxCatalog
        label={t('modelsSuccessions')}
        models={successionModels}
        openId={modelId}
        busyId={busyId}
        onSave={(item) => void saveDocx(item)}
        onOpen={choose}
      />
      <DocxCatalog
        label={t('modelsOther')}
        models={otherModels}
        openId={modelId}
        busyId={busyId}
        onSave={(item) => void saveDocx(item)}
        onOpen={choose}
      />
      {model && (
        <section className="stack" id="model-deschis" ref={editorRef}>
          <h2 className="h2">{model.title}</h2>
          <p className="muted">{model.blurb}</p>
          {model.kind === 'act' && template && (
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
          {model.kind === 'succession' && (
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
              values={model.kind === 'act' ? values : undefined}
              onSave={model.kind === 'act' ? saveDraft : undefined}
            />
          )}
        </section>
      )}
    </div>
  );
}
