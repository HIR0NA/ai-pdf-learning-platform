export const PDF_MIME_TYPE = 'application/pdf';
export const MAX_PDF_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_PDF_FILE_SIZE_MB = 10;

export const uploadPolicy = {
  acceptedExtensions: ['.pdf'],
  acceptedMimeTypes: [PDF_MIME_TYPE],
  maxFileSizeBytes: MAX_PDF_FILE_SIZE,
  maxFileSizeMb: MAX_PDF_FILE_SIZE_MB,
} as const;

export function isAcceptedPdf(file: Pick<File, 'name' | 'type'>) {
  return file.type === PDF_MIME_TYPE && file.name.toLowerCase().endsWith('.pdf');
}
