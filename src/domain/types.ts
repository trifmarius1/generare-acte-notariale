export type Lang = 'ro' | 'en' | 'hu';

export interface Localized {
  ro: string;
  en: string;
  hu: string;
}

export interface OfficeProfile {
  notaryName: string;
  chamber: string;
  address: string;
  license: string;
  circumscription: string;
  vatPayer: boolean;
}

export interface LegalCitation {
  label: string;
  url: string;
  note: string;
}

export interface ActSection {
  heading: string;
  paragraphs: string[];
}

export interface ActDocument {
  title: string;
  kind: string;
  banner: string[];
  sections: ActSection[];
  closing: string[];
  citations: LegalCitation[];
  plainText: string;
}

export interface FieldDef {
  key: string;
  label: Localized;
  type: 'text' | 'textarea' | 'date' | 'select' | 'checkbox';
  required?: boolean;
  options?: { value: string; label: Localized }[];
  group: Localized;
}

export interface ActMarker {
  pattern: RegExp;
  label: string;
}

export interface ActTemplate {
  id: string;
  title: Localized;
  summary: Localized;
  category: Localized;
  fields: FieldDef[];
  citations: LegalCitation[];
  markers: ActMarker[];
  generate: (values: Record<string, string>, office: OfficeProfile) => ActDocument;
}

export const PORTAL = 'https://legislatie.just.ro';
export const MONITOR = 'https://monitoruloficial.ro/';
export const UNNPR = 'https://www.uniuneanotarilor.ro';
export const LAW_CHECKED_ON = '2026-10-14';

export const emptyOffice = (): OfficeProfile => ({
  notaryName: '',
  chamber: '',
  address: '',
  license: '',
  circumscription: '',
  vatPayer: false,
});
