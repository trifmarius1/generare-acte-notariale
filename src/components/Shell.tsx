import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import { MONITOR } from '@/domain/types';
import { useI18n } from '@/hooks/useI18n';
import { useAppStore } from '@/store/useAppStore';

const links = [
  ['/', 'navHome'],
  ['/nou', 'navCreate'],
  ['/verifica', 'navVerify'],
  ['/succesiune', 'navSuccession'],
  ['/calcule', 'navCalc'],
  ['/modele', 'navModels'],
  ['/manual', 'navManual'],
  ['/legi', 'navKnowledge'],
  ['/monitor', 'navMonitor'],
  ['/birou', 'navSettings'],
] as const;

export function Shell() {
  const { t } = useI18n();
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  const [more, setMore] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.lang = language;
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#e7f7f4');
  }, [theme, language]);

  return (
    <div className="app-shell">
      <ThemeSwitch />
      <LanguageSwitch />
      <aside className="side">
        <div className="brand">
          <img className="brand-mark" src="/icon.svg" alt="" width={46} height={46} />
          <div>
            <strong>{t('appName')}</strong>
            <span>{t('lawDate')}</span>
          </div>
        </div>
        {links.map(([to, key]) => (
          to === '/monitor' ? (
            <a key={to} className="nav-btn" href={MONITOR} target="_blank" rel="noreferrer" title={t('monitorNewWindow')}>
              {t(key)}
            </a>
          ) : (
            <NavLink key={to} to={to} end={to === '/'} className="nav-btn">
              {t(key)}
            </NavLink>
          )
        ))}
      </aside>
      <div className="main">
        <p className="banner disclaimer">{t('disclaimer')}</p>
        <Outlet />
      </div>
      <nav className="bottom-nav">
        <NavLink to="/" end>{t('navHome')}</NavLink>
        <NavLink to="/nou">{t('navCreate')}</NavLink>
        <NavLink to="/verifica">{t('navVerify')}</NavLink>
        <NavLink to="/succesiune">{t('navSuccession')}</NavLink>
        <button type="button" aria-expanded={more} onClick={() => setMore((value) => !value)}>{t('navMore')}</button>
      </nav>
      {more && (
        <div className="more-menu" role="menu">
          <p className="muted" style={{ margin: 0 }}>{t('moreMenu')}</p>
          <NavLink to="/calcule" onClick={() => setMore(false)}>{t('navCalc')}</NavLink>
          <NavLink to="/modele" onClick={() => setMore(false)}>{t('navModels')}</NavLink>
          <NavLink to="/manual" onClick={() => setMore(false)}>{t('navManual')}</NavLink>
          <NavLink to="/legi" onClick={() => setMore(false)}>{t('navKnowledge')}</NavLink>
          <a href={MONITOR} target="_blank" rel="noreferrer" title={t('monitorNewWindow')} onClick={() => setMore(false)}>{t('navMonitor')}</a>
          <NavLink to="/birou" onClick={() => setMore(false)}>{t('navSettings')}</NavLink>
        </div>
      )}
    </div>
  );
}
