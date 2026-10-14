import Dexie, { type Table } from 'dexie';

export interface DraftRecord {
  id: string;
  kind: 'act' | 'succession';
  title: string;
  updatedAt: string;
  payload: unknown;
}

export interface CustomTemplateRecord {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
}

class NotaryDatabase extends Dexie {
  drafts!: Table<DraftRecord, string>;
  templates!: Table<CustomTemplateRecord, string>;

  constructor() {
    super('notariat-local');
    this.version(1).stores({
      drafts: 'id, kind, updatedAt',
      templates: 'id, updatedAt',
    });
  }
}

export const db = new NotaryDatabase();
