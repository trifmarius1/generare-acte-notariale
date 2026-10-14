import { useEffect, useMemo, useRef, useState } from 'react';
import { ActField } from '@/components/ActField';
import { DocumentPanel } from '@/components/DocumentPanel';
import { useI18n } from '@/hooks/useI18n';
import { uid } from '@/lib/id';
import { extractDocumentText } from '@/lib/parseFile';
import { detectTemplate, matchLaws, reviewText, type QualityIssue } from '@/lib/quality';
import { extractActValues } from '@/lib/rebuildAct';
import { templateById, templates } from '@/modules/templates';
import { db } from '@/store/db';
import { useAppStore } from '@/store/useAppStore';

export function VerifyPage() {
  const { t, L } = useI18n();
  const office = useAppStore((state) => state.office);
  const [text, setText] = useState('');
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [notice, setNotice] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [draftOn, setDraftOn] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [scrollTick, setScrollTick] = useState(0);
  const scrollId = useRef('proiect-corectat');
  const [reading, setReading] = useState('');

  const template = templateById(selectedId);
  const laws = analyzed ? matchLaws(text) : [];
  const act = useMemo(
    () => (draftOn && template ? template.generate(values, office) : null),
    [draftOn, office, template, values],
  );

  useEffect(() => {
    if (!scrollTick) return;
    document.getElementById(scrollId.current)?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [scrollTick]);

  function analyze(source: string) {
    const found = detectTemplate(source, templates);
    const structural: QualityIssue[] = found
      ? found.template.markers
          .filter((marker) => !marker.pattern.test(source))
          .map((marker) =>
            /^art\./i.test(marker.label)
              ? { level: 'info' as const, message: `Textul nu citează ${marker.label}. Proiectul corectat îl scrie la temeiuri.` }
              : { level: 'error' as const, message: `Lipsește elementul de structură: ${marker.label}.` },
          )
      : [];
    setIssues([...structural, ...reviewText(source)]);
    setAnalyzed(true);
    setSavedNote('');
    setDraftId(null);
    if (found) {
      setSelectedId(found.template.id);
      setValues(extractActValues(source, found.template));
      setDraftOn(true);
      scrollId.current = 'proiect-corectat';
      setScrollTick((tick) => tick + 1);
    } else {
      setSelectedId('');
      setValues({});
      setDraftOn(false);
    }
  }

  function openDraft(id: string, source: string) {
    const chosen = templateById(id);
    if (!chosen) return;
    setSelectedId(id);
    setValues(extractActValues(source, chosen));
    setDraftOn(true);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setReading(t('readingScan'));
    setNotice('');
    try {
      const extracted = await extractDocumentText(file, {
        onProgress: ({ page, total }) => setReading(`${t('readingScan')} ${page}/${total}`),
      });
      setText(extracted);
      setReading('');
      analyze(extracted);
    } catch (error) {
      setReading('');
      const code = error instanceof Error ? error.message : '';
      if (code === 'unsupported') setNotice(t('fileUnsupported'));
      else if (code === 'empty-scan') setNotice(t('fileEmpty'));
      else setNotice(t('fileError'));
    }
  }

  async function persistDraft(chosen: NonNullable<typeof template>, next: Record<string, string>) {
    const id = draftId ?? uid();
    await db.drafts.put({
      id,
      kind: 'act',
      title: chosen.title.ro,
      updatedAt: new Date().toISOString(),
      payload: { templateId: chosen.id, values: next },
    });
    setDraftId(id);
  }

  async function saveDraft() {
    if (!template || !act) return;
    await persistDraft(template, values);
  }

  async function generateCorrected() {
    const chosen = templateById(selectedId);
    if (!chosen) {
      setSavedNote(t('chooseModel'));
      return;
    }
    const next = draftOn && template?.id === chosen.id ? values : extractActValues(text, chosen);
    setSelectedId(chosen.id);
    setValues(next);
    setDraftOn(true);
    try {
      await persistDraft(chosen, next);
      setSavedNote(t('draftSaved'));
      scrollId.current = 'act-corectat';
      setScrollTick((tick) => tick + 1);
    } catch {
      setSavedNote(t('fileError'));
    }
  }

  return (
    <div className="stack">
      <header>
        <p className="kicker">{t('navVerify')}</p>
        <h1 className="h1">{t('openVerify')}</h1>
        <p className="lead">{t('uploadHint')}</p>
      </header>
      <label className="field">
        <span>{t('uploadLabel')}</span>
        <input
          type="file"
          accept=".txt,.docx,.pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tif,.tiff,.heic,.heif,image/*,application/pdf,text/plain"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </label>
      {reading && <p className="toast" role="status">{reading}</p>}
      <label className="field">
        <span>{t('paste')}</span>
        <textarea value={text} onChange={(event) => setText(event.target.value)} style={{ minHeight: 220 }} />
      </label>
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => analyze(text)} disabled={!text.trim() || reading !== ''}>
          {t('analyze')}
        </button>
      </div>
      {notice && <p className="issue error">{notice}</p>}
      {analyzed && (
        <section className="card stack" id="proiect-corectat">
          <h2 className="h2">{t('regenerate')}</h2>
          <p>{t('regenerateHint')}</p>
          <label className="field">
            <span>{t('modelForDraft')}</span>
            <select
              value={selectedId}
              onChange={(event) => {
                const id = event.target.value;
                setSelectedId(id);
                if (id) openDraft(id, text);
                else setDraftOn(false);
              }}
            >
              <option value="">—</option>
              {templates.map((item) => (
                <option key={item.id} value={item.id}>
                  {L(item.title)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn seal" onClick={() => void generateCorrected()}>
            {t('regenerate')}
          </button>
          {savedNote && savedNote !== t('draftSaved') && (
            <p className="toast" role="status">
              {savedNote}
            </p>
          )}
        </section>
      )}
      {draftOn && template && (
        <section className="card stack">
          <h2 className="h2">{t('data')}</h2>
          <p className="muted">{t('takenFromAct')}</p>
          <div className="fields">
            {template.fields.map((field) => (
              <ActField
                key={field.key}
                field={field}
                value={values[field.key] ?? ''}
                onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
              />
            ))}
          </div>
        </section>
      )}
      {act && template && (
        <div id="act-corectat" className="stack">
          {savedNote === t('draftSaved') && (
            <p className="toast" role="status">
              {savedNote}
            </p>
          )}
          <DocumentPanel document={act} template={template} values={values} onSave={saveDraft} />
        </div>
      )}
      {analyzed && (
        <div className="grid-2">
          <section className="card stack">
            <h2 className="h2">{t('detected')}</h2>
            {template ? (
              <>
                <strong>{L(template.title)}</strong>
                <p className="muted">{L(template.summary)}</p>
              </>
            ) : (
              <p>{t('unknownType')}</p>
            )}
            <h2 className="h2">{t('checks')}</h2>
            <div className="list">
              {issues.map((issue) => (
                <p key={issue.message} className={`issue ${issue.level}`}>
                  {issue.message}
                </p>
              ))}
            </div>
          </section>
          <section className="card stack">
            <h2 className="h2">{t('laws')}</h2>
            {laws.length === 0 ? (
              <p className="muted">{t('unknownType')}</p>
            ) : (
              <ul className="list">
                {laws.map((hit) => (
                  <li key={hit.citation}>
                    <a href={hit.url} target="_blank" rel="noreferrer">
                      {hit.citation}
                    </a>
                    <div className={hit.known ? 'ok' : 'bad'}>{hit.title}</div>
                  </li>
                ))}
              </ul>
            )}
            {template && (
              <>
                <h2 className="h2">{t('modelLaws')}</h2>
                <ul className="list">
                  {template.citations.map((citation, index) => (
                    <li key={`${citation.label}-${index}`}>
                      <a href={citation.url} target="_blank" rel="noreferrer">
                        {citation.label}
                      </a>
                      <div className="muted">{citation.note}</div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

