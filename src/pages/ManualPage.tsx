import { useMemo } from 'react';
import { DocumentPanel } from '@/components/DocumentPanel';
import { manualChapters, manualDocument } from '@/data/manual';
import { useI18n } from '@/hooks/useI18n';
import { useAppStore } from '@/store/useAppStore';

export function ManualPage() {
  const { t } = useI18n();
  const office = useAppStore((state) => state.office);
  const document = useMemo(() => manualDocument(office), [office]);

  return (
    <div className="stack">
      <header>
        <p className="kicker">{t('navManual')}</p>
        <h1 className="h1">{t('openManual')}</h1>
        <p className="lead">{t('manualLead')}</p>
      </header>
      <p className="muted">{t('manualInRomanian')}</p>
      <div className="manual-layout">
        <nav className="card manual-nav" aria-label={t('navManual')}>
          {manualChapters.map((chapter) => (
            <a key={chapter.id} href={`#${chapter.id}`}>
              {chapter.kicker}. {chapter.title}
            </a>
          ))}
        </nav>
        <div className="stack">
          {manualChapters.map((chapter) => (
            <section key={chapter.id} id={chapter.id} className="card stack">
              <p className="kicker">{chapter.kicker}</p>
              <h2 className="h2">{chapter.title}</h2>
              {chapter.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <ul className="list">
                {chapter.citations.map((citation) => (
                  <li key={`${citation.label}-${citation.note}`}>
                    <a href={citation.url} target="_blank" rel="noreferrer">
                      {citation.label}
                    </a>
                    <div className="muted">{citation.note}</div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <DocumentPanel document={document} />
    </div>
  );
}
