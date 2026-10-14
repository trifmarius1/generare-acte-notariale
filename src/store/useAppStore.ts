import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { emptyOffice, type Lang, type OfficeProfile } from '@/domain/types';

interface AppState {
  language: Lang;
  theme: 'light' | 'dark';
  office: OfficeProfile;
  setLanguage: (language: Lang) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setOffice: (office: OfficeProfile) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'ro',
      theme: 'light',
      office: emptyOffice(),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setOffice: (office) => set({ office }),
    }),
    { name: 'notariat-preferinte' },
  ),
);
