import path from 'path';

export const MAX_PDF_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_UPLOAD_REQUEST_SIZE = MAX_PDF_FILE_SIZE + 1024 * 1024;

const STORED_PDF_FILENAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$/i;

type HeaderSource = Headers | Record<string, string | string[] | undefined>;

function headerValue(headers: HeaderSource, name: string) {
  if (headers instanceof Headers) return headers.get(name);

  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(',') : value ?? null;
}

export function isSafeStoredPdfFilename(filename: string) {
  return STORED_PDF_FILENAME.test(filename);
}

export function resolveStoredDocumentPaths(
  filename: string,
  uploadRoot = path.resolve(process.cwd(), 'uploads'),
) {
  if (!isSafeStoredPdfFilename(filename)) {
    throw new Error('Invalid stored PDF filename');
  }

  const root = path.resolve(uploadRoot);
  const pdfPath = path.resolve(root, filename);
  const textPath = path.resolve(root, `${filename}.txt`);
  const indexPath = path.resolve(root, `${filename}.index.json`);
  const rootPrefix = `${root}${path.sep}`;

  if (
    !pdfPath.startsWith(rootPrefix) ||
    !textPath.startsWith(rootPrefix) ||
    !indexPath.startsWith(rootPrefix)
  ) {
    throw new Error('Resolved document path is outside the upload directory');
  }

  return { root, pdfPath, textPath, indexPath };
}

export function getClientAddress(
  headers: HeaderSource,
  options: { trustProxy?: boolean; trustedProxyHops?: number } = {},
) {
  const trustProxy = options.trustProxy ?? process.env.TRUST_PROXY === 'true';
  if (!trustProxy) return 'direct-client';

  const forwarded = headerValue(headers, 'x-forwarded-for')
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (!forwarded?.length) return 'trusted-proxy-unknown';

  const trustedProxyHops = Math.max(
    1,
    options.trustedProxyHops ?? Number(process.env.TRUSTED_PROXY_HOPS || 1),
  );
  const clientIndex = Math.max(0, forwarded.length - trustedProxyHops);
  return forwarded[clientIndex];
}

export function exceedsUploadRequestLimit(headers: Headers) {
  const rawLength = headers.get('content-length');
  if (!rawLength) return false;

  const contentLength = Number(rawLength);
  return Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_REQUEST_SIZE;
}
