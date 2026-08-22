export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash';

const TRANSIENT_ERROR_PATTERNS = [
  'fetch failed',
  'econnreset',
  'econnrefused',
  'enotfound',
  'etimedout',
  'network',
  '429',
  '500',
  '502',
  '503',
  '504',
];

function isTransientGeminiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error && error.cause ? String(error.cause) : '';
  const details = `${message} ${cause}`.toLowerCase();

  return TRANSIENT_ERROR_PATTERNS.some((pattern) => details.includes(pattern));
}

export async function withGeminiRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientGeminiError(error) || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = 500 * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
