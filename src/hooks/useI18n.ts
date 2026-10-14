import { useAppStore } from '@/store/useAppStore';
import { translate, type MessageKey } from '@/i18n';
import type { Localized } from '@/domain/types';

export function useI18n() {
  const language = useAppStore((state) => state.language);
  return {
    language,
    t: (key: MessageKey) => translate(language, key),
    L: (value: Localized) => value[language],
  };
}
