export async function saveBlob(blob: Blob, filename: string, kind: 'docx' | 'pdf' = 'docx'): Promise<'picker' | 'download'> {
  const picker = window.showSaveFilePicker;
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: filename,
        types: [
          kind === 'pdf'
            ? { description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }
            : {
                description: 'Document Word',
                accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
              },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return 'picker';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return 'download';
}

export async function readTextFile(file: File): Promise<string> {
  return file.text();
}
