import { useI18n } from '@/hooks/useI18n';
import { useAppStore } from '@/store/useAppStore';

export function ThemeSwitch() {
  const { t } = useI18n();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const dark = theme === 'dark';
  const label = `${t('themeSite')}: ${dark ? t('dark') : t('light')}`;

  return (
    <button
      type="button"
      className={dark ? 'theme-corner is-dark' : 'theme-corner'}
      aria-pressed={dark}
      aria-label={label}
      title={label}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 3.8a8.2 8.2 0 0 0 0 16.4z" fill="currentColor" />
      </svg>
    </button>
  );
}
