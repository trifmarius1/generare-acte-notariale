import { useEffect, useRef, useState } from 'react';
import type { Lang } from '@/domain/types';
import { useI18n } from '@/hooks/useI18n';
import { useAppStore } from '@/store/useAppStore';

const languages: ReadonlyArray<{ id: Lang; code: string; name: string }> = [
  { id: 'ro', code: 'RO', name: 'Română' },
  { id: 'en', code: 'EN', name: 'English' },
  { id: 'hu', code: 'HU', name: 'Magyar' },
];

function Flag({ id }: { id: Lang }) {
  if (id === 'en') {
    return (
      <svg className="lang-flag" viewBox="0 0 60 36" aria-hidden="true">
        <rect width="60" height="36" fill="#012169" />
        <path d="M0 0 L60 36 M60 0 L0 36" stroke="#fff" strokeWidth="8" />
        <path d="M0 0 L60 36 M60 0 L0 36" stroke="#C8102E" strokeWidth="4" />
        <path d="M30 0 V36 M0 18 H60" stroke="#fff" strokeWidth="14" />
        <path d="M30 0 V36 M0 18 H60" stroke="#C8102E" strokeWidth="8" />
      </svg>
    );
  }
  if (id === 'hu') {
    return (
      <svg className="lang-flag" viewBox="0 0 22 16" aria-hidden="true">
        <rect width="22" height="5.34" fill="#CE2939" />
        <rect y="5.34" width="22" height="5.33" fill="#fff" />
        <rect y="10.67" width="22" height="5.33" fill="#477050" />
      </svg>
    );
  }
  return (
    <svg className="lang-flag" viewBox="0 0 22 16" aria-hidden="true">
      <rect width="7.34" height="16" fill="#002B7F" />
      <rect x="7.34" width="7.33" height="16" fill="#FCD116" />
      <rect x="14.67" width="7.33" height="16" fill="#CE1126" />
    </svg>
  );
}

export function LanguageSwitch() {
  const { t } = useI18n();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = languages.find((item) => item.id === language) ?? languages[0];

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="lang-corner" ref={root}>
      <button
        type="button"
        className="lang-switch"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language')}
        onClick={() => setOpen((value) => !value)}
      >
        <Flag id={current.id} />
        <span>{current.code}</span>
      </button>
      {open && (
        <ul className="lang-menu" role="listbox" aria-label={t('language')}>
          {languages.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={item.id === language}
                className={item.id === language ? 'is-current' : undefined}
                onClick={() => {
                  setLanguage(item.id);
                  setOpen(false);
                }}
              >
                <Flag id={item.id} />
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
