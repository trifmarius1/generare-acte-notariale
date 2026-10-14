import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from '@/components/Shell';
import { CalculatorsPage } from '@/pages/CalculatorsPage';
import { CreatePage } from '@/pages/CreatePage';
import { HomePage } from '@/pages/HomePage';
import { KnowledgePage } from '@/pages/KnowledgePage';
import { ManualPage } from '@/pages/ManualPage';
import { MonitorPage } from '@/pages/MonitorPage';
import { ModelsPage } from '@/pages/ModelsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SuccessionPage } from '@/pages/SuccessionPage';
import { VerifyPage } from '@/pages/VerifyPage';

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="nou" element={<CreatePage />} />
        <Route path="verifica" element={<VerifyPage />} />
        <Route path="succesiune" element={<SuccessionPage />} />
        <Route path="calcule" element={<CalculatorsPage />} />
        <Route path="modele" element={<ModelsPage />} />
        <Route path="manual" element={<ManualPage />} />
        <Route path="legi" element={<KnowledgePage />} />
        <Route path="monitor" element={<MonitorPage />} />
        <Route path="ai" element={<Navigate to="/" replace />} />
        <Route path="birou" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
