export const PDF_MIME_TYPE = 'application/pdf';
export const MD_MIME_TYPE = 'text/markdown';
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 10;

export const uploadPolicy = {
  acceptedExtensions: ['.pdf', '.md', '.markdown'],
  acceptedMimeTypes: [PDF_MIME_TYPE, MD_MIME_TYPE, 'text/plain'], // some OS send .md as text/plain
  maxFileSizeBytes: MAX_FILE_SIZE,
  maxFileSizeMb: MAX_FILE_SIZE_MB,
} as const;

export function isAcceptedFile(file: Pick<File, 'name' | 'type'>) {
  const isPdf = file.type === PDF_MIME_TYPE && file.name.toLowerCase().endsWith('.pdf');
  const isMd = file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.markdown');
  return isPdf || isMd;
}
