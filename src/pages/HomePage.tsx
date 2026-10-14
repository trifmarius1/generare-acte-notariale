import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { liveQuery } from 'dexie';
import { useI18n } from '@/hooks/useI18n';
import type { MessageKey } from '@/i18n';
import { db, type DraftRecord } from '@/store/db';

const entries: ReadonlyArray<{ to: string; title: MessageKey; hint: MessageKey; wide?: boolean; door?: boolean }> = [
  { to: '/nou', title: 'openCreate', hint: 'homeCreate', wide: true, door: true },
  { to: '/verifica', title: 'openVerify', hint: 'homeVerify', wide: true, door: true },
  { to: '/succesiune', title: 'openSuccession', hint: 'homeSuccession' },
  { to: '/modele', title: 'openModels', hint: 'homeModels' },
  { to: '/manual', title: 'openManual', hint: 'homeManual' },
  { to: '/monitor', title: 'openMonitor', hint: 'homeMonitor' },
];

export function HomePage() {
  const { t, language } = useI18n();
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);

  useEffect(() => {
    const subscription = liveQuery(() => db.drafts.orderBy('updatedAt').reverse().toArray()).subscribe({
      next: setDrafts,
      error: () => setDrafts([]),
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="stack">
      <header>
        <p className="kicker">{t('lawDate')}</p>
        <div className="masthead">
          <img className="brand-mark mast-mark" src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={56} height={56} />
          <h1 className="h1 brand-name">{t('appName')}</h1>
        </div>
        <p className="lead">{t('tagline')}</p>
        <p className="home-note">{t('localOnly')}</p>
      </header>
      <section className="stack">
        <h2 className="h2">{t('homeAsk')}</h2>
        <div className="home-board">
          {entries.map((entry) => (
            <Link
              key={entry.to}
              className={`home-card${entry.wide ? ' span-3' : ''}${entry.door ? ' door' : ''}`}
              to={entry.to}
            >
              <strong>{t(entry.title)}</strong>
              <span>{t(entry.hint)}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="card">
        <h2 className="h2">{t('myDrafts')}</h2>
        {drafts.length === 0 ? (
          <p className="muted">{t('noDrafts')}</p>
        ) : (
          <ul className="list">
            {drafts.map((draft) => (
              <li key={draft.id} className="row-card">
                <strong>{draft.title}</strong>
                <span className="muted">
                  {draft.kind === 'act' ? t('navCreate') : t('navSuccession')} · {t('savedOn')}{' '}
                  {new Date(draft.updatedAt).toLocaleString(language)}
                </span>
                <Link className="btn secondary" to={draft.kind === 'act' ? `/nou?ciorna=${draft.id}` : `/succesiune?ciorna=${draft.id}`}>
                  {t('open')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
