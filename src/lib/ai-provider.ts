import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { GEMINI_MODEL, withGeminiRetry } from '@/lib/gemini';

export type AIProvider = 'groq' | 'bazaarlink' | 'gemini';

export const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b';
export const BAZAARLINK_MODEL = process.env.BAZAARLINK_MODEL?.trim() || 'qwen/qwen3.7-flash';
export const GROQ_BASE_URL = process.env.GROQ_BASE_URL?.trim() || 'https://api.groq.com/openai/v1';
export const BAZAARLINK_BASE_URL = process.env.BAZAARLINK_BASE_URL?.trim() || 'https://api.bazaarlink.ai/v1';

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

export async function generateAIText(prompt: string, options?: { json?: boolean; provider?: string }) {
  const provider = getAIProvider(options?.provider);

  if (provider === 'groq' || provider === 'bazaarlink') {
    const isGroq = provider === 'groq';
    const model = isGroq ? GROQ_MODEL : BAZAARLINK_MODEL;
    const client = isGroq ? getGroqClient() : getBazaarLinkClient();
    const response = await withProviderRetry(() => client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: options?.json ? { type: 'json_object' } : undefined,
    }));
    const text = response.choices[0]?.message.content;
    if (!text) throw new Error(`${isGroq ? 'Groq' : 'BazaarLink'} ไม่ส่งข้อความตอบกลับ`);
    return { text, provider, model };
  }

  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '').getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: options?.json ? { responseMimeType: 'application/json' } : undefined,
  });
  const result = await withGeminiRetry(() => model.generateContent(prompt));
  return { text: result.response.text(), provider, model: GEMINI_MODEL };
}

export async function createAITextStream(prompt: string, providerOverride?: string) {
  const provider = getAIProvider(providerOverride);

  if (provider === 'groq' || provider === 'bazaarlink') {
    const isGroq = provider === 'groq';
    const model = isGroq ? GROQ_MODEL : BAZAARLINK_MODEL;
    const client = isGroq ? getGroqClient() : getBazaarLinkClient();
    const response = await withProviderRetry(() => client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
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
  const result = await withGeminiRetry(() => model.generateContentStream(prompt));
  const chunks = (async function* () {
    for await (const chunk of result.stream) yield chunk.text();
  })();
  return { chunks, provider, model: GEMINI_MODEL };
}
