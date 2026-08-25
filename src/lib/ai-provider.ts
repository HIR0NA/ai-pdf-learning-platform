import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { GEMINI_MODEL, withGeminiRetry } from '@/lib/gemini';

export type AIProvider = 'groq' | 'bazaarlink' | 'gemini';

export const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b';
export const BAZAARLINK_MODEL = process.env.BAZAARLINK_MODEL?.trim() || 'qwen/qwen3.7-flash';
export const GROQ_BASE_URL = process.env.GROQ_BASE_URL?.trim() || 'https://api.groq.com/openai/v1';
export const BAZAARLINK_BASE_URL = process.env.BAZAARLINK_BASE_URL?.trim() || 'https://api.bazaarlink.ai/v1';

// Groq's free/on-demand tier currently enforces a low tokens-per-minute limit.
// Thai text can tokenize more densely than English, so keep a conservative
// character budget and retain both the beginning (instructions) and the end
// (conversation/question) of the prompt.
const GROQ_PROMPT_CHAR_LIMIT = Number(process.env.GROQ_PROMPT_CHAR_LIMIT || 12000);
const DEFAULT_MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS || 1200);

export function limitPromptForProvider(prompt: string, provider: AIProvider) {
  if (provider !== 'groq' || prompt.length <= GROQ_PROMPT_CHAR_LIMIT) return prompt;

  const headLength = Math.floor(GROQ_PROMPT_CHAR_LIMIT * 0.68);
  const tailLength = GROQ_PROMPT_CHAR_LIMIT - headLength;
  return `${prompt.slice(0, headLength)}\n\n[เนื้อหาตรงกลางถูกย่อเนื่องจากข้อจำกัดโควตาโทเคนของโมเดล กรุณาตอบจากส่วนที่แสดงเท่านั้น]\n\n${prompt.slice(-tailLength)}`;
}

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

export function getAIProvider(override?: string): AIProvider {
  const requested = override?.trim().toLowerCase()
    || process.env.AI_PROVIDER?.trim().toLowerCase()
    || 'auto';

  if (requested === 'groq') {
    if (!hasValue(process.env.GROQ_API_KEY)) throw new Error('ยังไม่ได้ตั้งค่า GROQ_API_KEY');
    return 'groq';
  }
  if (requested === 'gemini') {
    if (!hasValue(process.env.GEMINI_API_KEY)) throw new Error('ยังไม่ได้ตั้งค่า GEMINI_API_KEY');
    return 'gemini';
  }
  if (requested === 'bazaarlink') {
    if (!hasValue(process.env.BAZAARLINK_API_KEY)) throw new Error('ยังไม่ได้ตั้งค่า BAZAARLINK_API_KEY');
    return 'bazaarlink';
  }
  if (requested !== 'auto') {
    throw new Error('AI_PROVIDER ต้องเป็น auto, groq, bazaarlink หรือ gemini');
  }

  if (hasValue(process.env.GROQ_API_KEY)) return 'groq';
  if (hasValue(process.env.BAZAARLINK_API_KEY)) return 'bazaarlink';
  if (hasValue(process.env.GEMINI_API_KEY)) return 'gemini';
  throw new Error('ยังไม่ได้ตั้งค่า API key สำหรับ AI provider');
}

export function getAIProviderOptions() {
  return [
    { id: 'gemini' as const, name: 'Google Gemini', model: GEMINI_MODEL, configured: hasValue(process.env.GEMINI_API_KEY) },
    { id: 'groq' as const, name: 'Groq GPT-OSS', model: GROQ_MODEL, configured: hasValue(process.env.GROQ_API_KEY) },
    { id: 'bazaarlink' as const, name: 'Qwen via BazaarLink', model: BAZAARLINK_MODEL, configured: hasValue(process.env.BAZAARLINK_API_KEY) },
  ];
}

function getGroqClient() {
  return new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: GROQ_BASE_URL });
}

function getBazaarLinkClient() {
  return new OpenAI({ apiKey: process.env.BAZAARLINK_API_KEY, baseURL: BAZAARLINK_BASE_URL });
}

async function withProviderRetry<T>(operation: () => Promise<T>, maxAttempts = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 0;
      const retryable = status === 408 || status === 409 || status === 429 || status >= 500;
      if (!retryable || attempt === maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    }
  }
  throw lastError;
}

/**
 * Extract valid JSON from AI responses that may be wrapped in markdown
 * code fences or contain extra text around the JSON payload.
 */
export function extractJSON(raw: string): string {
  // 1. Try to strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    try {
      JSON.parse(fenceMatch[1].trim());
      return fenceMatch[1].trim();
    } catch { /* fall through */ }
  }

  // 2. Try parsing the raw string directly
  try {
    JSON.parse(raw.trim());
    return raw.trim();
  } catch { /* fall through */ }

  // 3. Find the first [ or { and match to the last ] or }
  const startArray = raw.indexOf('[');
  const startObj = raw.indexOf('{');
  let start = -1;
  let endChar = '';

  if (startArray >= 0 && (startObj < 0 || startArray < startObj)) {
    start = startArray;
    endChar = ']';
  } else if (startObj >= 0) {
    start = startObj;
    endChar = '}';
  }

  if (start >= 0) {
    const end = raw.lastIndexOf(endChar);
    if (end > start) {
      const candidate = raw.slice(start, end + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch { /* fall through */ }
    }
  }

  // 4. Return raw — caller will handle the parse error
  return raw.trim();
}

export async function generateAIText(prompt: string, options?: { json?: boolean; provider?: string }) {
  const provider = getAIProvider(options?.provider);

  // For JSON mode, append explicit instruction to ensure AI returns pure JSON
  let finalPrompt = options?.json
    ? `${prompt}\n\nIMPORTANT: ตอบกลับเป็น JSON เท่านั้น ห้ามใส่ข้อความอธิบายหรือ markdown code fence ส่ง raw JSON เท่านั้น`
    : prompt;
  finalPrompt = limitPromptForProvider(finalPrompt, provider);

  if (provider === 'groq' || provider === 'bazaarlink') {
    const isGroq = provider === 'groq';
    const model = isGroq ? GROQ_MODEL : BAZAARLINK_MODEL;
    const client = isGroq ? getGroqClient() : getBazaarLinkClient();

    // Only use response_format for BazaarLink; Groq's gpt-oss models
    // often reject it with a 400 "failed_generation" error.
    const useJsonFormat = options?.json && !isGroq;

    const response = await withProviderRetry(() => client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: finalPrompt }],
      max_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
      response_format: useJsonFormat ? { type: 'json_object' } : undefined,
    }));
    let text = response.choices[0]?.message.content;
    if (!text) throw new Error(`${isGroq ? 'Groq' : 'BazaarLink'} ไม่ส่งข้อความตอบกลับ`);

    // Post-process: extract JSON if json mode was requested
    if (options?.json) {
      text = extractJSON(text);
    }
    return { text, provider, model };
  }

  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '').getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: options?.json ? { responseMimeType: 'application/json' } : undefined,
  });
  const result = await withGeminiRetry(() => model.generateContent(finalPrompt));
  let text = result.response.text();
  if (options?.json) {
    text = extractJSON(text);
  }
  return { text, provider, model: GEMINI_MODEL };
}

export async function createAITextStream(prompt: string, providerOverride?: string) {
  const provider = getAIProvider(providerOverride);
  const boundedPrompt = limitPromptForProvider(prompt, provider);

  if (provider === 'groq' || provider === 'bazaarlink') {
    const isGroq = provider === 'groq';
    const model = isGroq ? GROQ_MODEL : BAZAARLINK_MODEL;
    const client = isGroq ? getGroqClient() : getBazaarLinkClient();
    const response = await withProviderRetry(() => client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: boundedPrompt }],
      max_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
      stream: true,
    }));
    const chunks = (async function* () {
      for await (const event of response) {
        const text = event.choices[0]?.delta.content;
        if (text) yield text;
      }
    })();
    return { chunks, provider, model };
  }

  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '').getGenerativeModel({ model: GEMINI_MODEL });
  const result = await withGeminiRetry(() => model.generateContentStream(boundedPrompt));
  const chunks = (async function* () {
    for await (const chunk of result.stream) yield chunk.text();
  })();
  return { chunks, provider, model: GEMINI_MODEL };
}
