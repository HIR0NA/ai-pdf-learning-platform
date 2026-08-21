/**
 * Sanitizes input text to prevent basic prompt injections and payloads.
 * @param input The raw input string
 * @param maxLength Maximum allowed length to prevent abuse (default 50000 for large docs)
 * @returns Sanitized string
 */
export function sanitizeInput(input: string, maxLength: number = 50000): string {
  if (!input) return '';

  // 1. Trim whitespace
  let sanitized = input.trim();

  // 2. Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // 3. Strip HTML tags to prevent XSS or payload injection inside HTML structures
  sanitized = sanitized.replace(/<\/?[^>]+(>|$)/g, "");

  // 4. Remove control characters (excluding newline, carriage return, and tab)
  // This prevents weird Unicode control characters from altering AI behavior
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return sanitized;
}
