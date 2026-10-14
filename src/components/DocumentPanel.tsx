import { useState } from 'react';
import type { ActDocument, ActTemplate } from '@/domain/types';
import { useI18n } from '@/hooks/useI18n';
import { documentToDocx } from '@/lib/docxExport';
import { saveBlob } from '@/lib/files';
import { slug } from '@/lib/id';
import { reviewText } from '@/lib/quality';

export function DocumentPanel({
  document,
  template,
  values,
  onSave,
}: {
  document: ActDocument;
  template?: ActTemplate;
  values?: Record<string, string>;
  onSave?: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<'docx' | 'pdf' | ''>('');
  const issues = reviewText(document.plainText, template, values);
  const baseName = slug(document.title) || 'proiect';

  async function exportDoc() {
    setBusy('docx');
    try {
      const blob = await documentToDocx(document);
      await saveBlob(blob, `${baseName}.docx`, 'docx');
      setNotice('');
    } catch (error) {
      setNotice(error instanceof DOMException && error.name === 'AbortError' ? t('aborted') : t('fileError'));
    } finally {
      setBusy('');
    }
  }

  async function exportPdf() {
    setBusy('pdf');
    try {
      const { documentToPdf } = await import('@/lib/pdfExport');
      const blob = await documentToPdf(document);
      await saveBlob(blob, `${baseName}.pdf`, 'pdf');
      setNotice('');
    } catch (error) {
      setNotice(error instanceof DOMException && error.name === 'AbortError' ? t('aborted') : t('fileError'));
    } finally {
      setBusy('');
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(document.plainText);
      setNotice(t('copied'));
    } catch {
      setNotice(t('fileError'));
    }
  }

  async function save() {
    if (!onSave) return;
    try {
      await onSave();
      setNotice(t('draftSaved'));
    } catch {
      setNotice(t('fileError'));
    }
  }

  return (
    <div className="stack">
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => void exportDoc()} disabled={busy !== ''}>
          {t('exportDocx')}
        </button>
        <button type="button" className="btn" onClick={() => void exportPdf()} disabled={busy !== ''}>
          {t('exportPdf')}
        </button>
        <button type="button" className="btn secondary" onClick={() => void copyText()} disabled={busy !== ''}>
          {t('copy')}
        </button>
        {onSave && (
          <button type="button" className="btn seal" onClick={() => void save()} disabled={busy !== ''}>
            {t('save')}
          </button>
        )}
      </div>
      {notice && <p className="toast">{notice}</p>}
      <section>
        <h2 className="h2">{t('checks')}</h2>
        <div className="list">
          {issues.map((issue) => (
            <p key={issue.message} className={`issue ${issue.level}`}>
              {issue.message}
            </p>
          ))}
        </div>
      </section>
      <section>
        <h2 className="h2">{t('laws')}</h2>
        <ul className="list">
          {document.citations.map((citation, index) => (
            <li key={`${citation.label}-${index}`}>
              <a href={citation.url} target="_blank" rel="noreferrer">
                {citation.label}
              </a>
              <div className="muted">{citation.note}</div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="h2">{t('preview')}</h2>
        <p className="muted">{t('actsStayRo')}</p>
        <pre className="paper">{document.plainText}</pre>
      </section>
    </div>
  );
}
