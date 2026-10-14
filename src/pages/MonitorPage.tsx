import { MONITOR, PORTAL } from '@/domain/types';
import { useI18n } from '@/hooks/useI18n';

export function MonitorPage() {
  const { t } = useI18n();

  return (
    <div className="stack">
      <header>
        <p className="kicker">{t('lawDate')}</p>
        <h1 className="h1">Monitorul Oficial al României</h1>
        <p className="lead">{t('monitorLead')}</p>
      </header>
      <section className="card stack">
        <div className="btn-row">
          <a className="btn seal" href={MONITOR} target="_blank" rel="noreferrer">
            {t('monitorOpen')}
          </a>
          <a className="btn secondary" href={PORTAL} target="_blank" rel="noreferrer">
            {t('monitorPortal')}
          </a>
        </div>
        <p>{t('monitorAddress')}</p>
        <p className="muted">{t('monitorNote')}</p>
      </section>
    </div>
  );
}
