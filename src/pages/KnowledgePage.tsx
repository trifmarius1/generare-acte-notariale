import { useMemo, useState } from 'react';
import { knowledge, knowledgeCheckedOn, knowledgeSources } from '@/data/knowledge';
import { useI18n } from '@/hooks/useI18n';
import { matchesKnowledge } from '@/lib/knowledgeSearch';

export function KnowledgePage() {
  const { t, L } = useI18n();
  const [query, setQuery] = useState('');
  const entries = useMemo(() => knowledge.filter((entry) => matchesKnowledge(query, entry)), [query]);

  return (
    <div className="stack">
      <header>
        <p className="kicker">{t('lawDate')}</p>
        <h1 className="h1">{t('navKnowledge')}</h1>
        <p className="lead">
          {t('sources')} · {knowledgeCheckedOn}
        </p>
      </header>
      <div className="link-row">
        <a href={knowledgeSources.portal} target="_blank" rel="noreferrer">
          legislatie.just.ro
        </a>
        <a href={knowledgeSources.unnpr} target="_blank" rel="noreferrer">
          UNNPR
        </a>
        <a href={knowledgeSources.fees} target="_blank" rel="noreferrer">
          OMJ nr. 177/C/2024
        </a>
        <a href={knowledgeSources.law36} target="_blank" rel="noreferrer">
          Legea nr. 36/1995
        </a>
      </div>
      <label className="field">
        <span>{t('search')}</span>
        <input
          type="search"
          value={query}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setQuery(event.target.value)}
        />
        <small className="hint">{t('searchHint')}</small>
      </label>
      <div className="stack">
        {entries.length === 0 ? <p className="muted">{t('searchNone')}</p> : null}
        {entries.map((entry) => (
          <article key={entry.id} className="card stack">
            <p className="kicker">{entry.citation}</p>
            <h2 className="h2">{L(entry.title)}</h2>
            <p>{L(entry.summary)}</p>
            <p>{entry.body}</p>
            <a href={entry.url} target="_blank" rel="noreferrer">
              {entry.url}
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
