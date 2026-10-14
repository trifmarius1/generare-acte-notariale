import { useState } from 'react';
import { FilteredField } from '@/components/ActField';
import { useI18n } from '@/hooks/useI18n';
import { db } from '@/store/db';
import { useAppStore } from '@/store/useAppStore';

export function SettingsPage() {
  const { t } = useI18n();
  const office = useAppStore((state) => state.office);
  const setOffice = useAppStore((state) => state.setOffice);
  const [notice, setNotice] = useState('');

  async function clearDrafts() {
    if (!window.confirm(t('clearDrafts'))) return;
    await db.drafts.clear();
    setNotice(t('cleared'));
  }

  return (
    <div className="stack">
      <header>
        <p className="kicker">{t('navSettings')}</p>
        <h1 className="h1">{t('officeTitle')}</h1>
        <p className="lead">{t('localOnly')}</p>
      </header>
      <section className="card stack">
        <div className="field">
          <span>{t('theme')}</span>
          <span className="muted">{t('themeWhere')}</span>
        </div>
      </section>
      <section className="card">
        <h2 className="h2">{t('officeTitle')}</h2>
        <div className="fields">
          <FilteredField
            entryKey="notaryName"
            label={t('notaryName')}
            value={office.notaryName}
            onChange={(notaryName) => setOffice({ ...office, notaryName })}
          />
          <FilteredField
            entryKey="chamber"
            label={t('chamber')}
            value={office.chamber}
            onChange={(chamber) => setOffice({ ...office, chamber })}
          />
          <FilteredField
            entryKey="address"
            label={t('address')}
            value={office.address}
            onChange={(address) => setOffice({ ...office, address })}
            wide
          />
          <FilteredField
            entryKey="license"
            label={t('license')}
            value={office.license}
            onChange={(license) => setOffice({ ...office, license })}
          />
          <FilteredField
            entryKey="circumscription"
            label={t('circumscription')}
            value={office.circumscription}
            onChange={(circumscription) => setOffice({ ...office, circumscription })}
          />
          <label className="field wide">
            <span>{t('vatPayer')}</span>
            <input
              type="checkbox"
              checked={office.vatPayer}
              onChange={(event) => setOffice({ ...office, vatPayer: event.target.checked })}
            />
          </label>
        </div>
      </section>
      <section className="card stack">
        <p className="muted">{t('myDrafts')}</p>
        <button type="button" className="btn secondary" onClick={() => void clearDrafts()}>
          {t('clearDrafts')}
        </button>
        {notice && <p className="toast">{notice}</p>}
      </section>
    </div>
  );
}
