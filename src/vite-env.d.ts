/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ShowFilePickerType {
  description?: string;
  accept: Record<string, string[]>;
}

interface Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: ShowFilePickerType[];
  }) => Promise<FileSystemFileHandle>;
}
