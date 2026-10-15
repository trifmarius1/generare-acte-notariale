import { useMemo, useState } from 'react';
import { codeManuals, codesCheckedOn, repealedManual, type CodeManual } from '@/data/codes';
import { knowledge, knowledgeCheckedOn, knowledgeSources } from '@/data/knowledge';
import { useI18n } from '@/hooks/useI18n';
import { matchesKnowledge, matchesText } from '@/lib/knowledgeSearch';

function codeParts(code: CodeManual): string[] {
  return [
    code.title.ro,
    code.title.en,
    code.title.hu,
    code.summary.ro,
    code.summary.en,
    code.summary.hu,
    code.secondLabel.ro,
    code.secondLabel.en,
    code.secondLabel.hu,
    code.citation,
    code.body,
  ];
}

export function KnowledgePage() {
  const { t, L } = useI18n();
  const [query, setQuery] = useState('');
  const codes = useMemo(() => codeManuals.filter((code) => matchesText(query, codeParts(code))), [query]);
  const showRepealed = useMemo(
    () =>
      matchesText(query, [
        repealedManual.title.ro,
        repealedManual.title.en,
        repealedManual.title.hu,
        repealedManual.body,
      ]),
    [query],
  );
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
      <section className="stack" id="coduri">
        <p className="kicker">{t('codesChecked')}</p>
        <h2 className="h2">{t('codesTitle')}</h2>
        <p className="lead">{t('codesLead')}</p>
        <p>{t('codesHonest')}</p>
        <p className="muted">{t('legalNotesRo')}</p>
        {codes.length === 0 && !showRepealed ? null : (
          <div className="stack">
            {codes.map((code) => (
              <article key={code.id} className="card stack" id={`cod-${code.id}`}>
                <p className="kicker">{code.citation}</p>
                <h3 className="h2">{L(code.title)}</h3>
                <p>{L(code.summary)}</p>
                <p>{code.body}</p>
                <div className="link-row">
                  <a href={code.portalUrl} target="_blank" rel="noreferrer">
                    {t('codesOpen')}
                  </a>
                  <a href={code.secondUrl} target="_blank" rel="noreferrer">
                    {L(code.secondLabel)}
                  </a>
                </div>
              </article>
            ))}
            {showRepealed ? (
              <article className="card stack" id="cod-abrogate">
                <p className="kicker">{codesCheckedOn}</p>
                <h3 className="h2">{L(repealedManual.title)}</h3>
                <p>{repealedManual.body}</p>
              </article>
            ) : null}
          </div>
        )}
      </section>
      <div className="stack">
        {entries.length === 0 && codes.length === 0 && !showRepealed ? (
          <p className="muted">{t('searchNone')}</p>
        ) : null}
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
