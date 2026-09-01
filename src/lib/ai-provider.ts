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

function escapeControlCharactersInJsonStrings(value: string) {
  let inString = false;
  let escaped = false;
  let result = '';

  for (const character of value) {
    if (escaped) {
      result += character;
      escaped = false;
      continue;
    }
    if (character === '\\') {
      result += character;
      escaped = true;
      continue;
    }
    if (character === '"') {
      inString = !inString;
      result += character;
      continue;
    }
    if (inString && character === '\n') {
      result += '\\n';
    } else if (inString && character === '\r') {
      result += '\\r';
    } else if (inString && character === '\t') {
      result += '\\t';
    } else {
      result += character;
    }
  }
  return result;
}

function closeTruncatedJson(value: string) {
  const stack: Array<'{' | '['> = [];
  let inString = false;
  let escaped = false;

  for (const character of value) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\' && inString) {
      escaped = true;
    } else if (character === '"') {
      inString = !inString;
    } else if (!inString && (character === '{' || character === '[')) {
      stack.push(character);
    } else if (!inString && character === '}') {
      if (stack[stack.length - 1] === '{') stack.pop();
    } else if (!inString && character === ']') {
      if (stack[stack.length - 1] === '[') stack.pop();
    }
  }

  let repaired = value.trim();
  if (inString) repaired += '"';
  while (stack.length) repaired += stack.pop() === '{' ? '}' : ']';
  return repaired;
}

/**
 * Parses provider JSON defensively. Some OpenAI-compatible models emit literal
 * newlines in a JSON string or finish at the token limit before the final quote.
 * Both cases are repaired before the data reaches the learning-tool UI.
 */
export function parseAIJson(raw: string): unknown {
  const candidate = extractJSON(raw);
  const attempts = [candidate, escapeControlCharactersInJsonStrings(candidate)];
  attempts.push(closeTruncatedJson(attempts[1]));

  for (const value of attempts) {
    try {
      return JSON.parse(value);
    } catch { /* try the next safe repair */ }
  }

  throw new Error('AI ส่งข้อมูลในรูปแบบไม่สมบูรณ์ กรุณาลองสร้างใหม่อีกครั้ง');
}

export async function generateAIText(prompt: string, options?: { json?: boolean; provider?: string; filePath?: string; mimeType?: string; maxOutputTokens?: number }) {
  const provider = getAIProvider(options?.provider);

  // For JSON mode, append explicit instruction to ensure AI returns pure JSON
  let finalPrompt = options?.json
    ? `${prompt}\n\nIMPORTANT: คำตอบต้องเป็น JSON เท่านั้น ห้ามมีคำอธิบายอื่น ห้ามครอบด้วย markdown code fence เด็ดขาด`
    : prompt;
  finalPrompt = limitPromptForProvider(finalPrompt, provider);

  if (provider === 'groq' || provider === 'bazaarlink') {
    const isGroq = provider === 'groq';
    const model = isGroq ? GROQ_MODEL : BAZAARLINK_MODEL;
    const client = isGroq ? getGroqClient() : getBazaarLinkClient();

    // Only use response_format for BazaarLink; Groq's gpt-oss models
    // often reject it with a 400 "failed_generation" error.
    const useJsonFormat = options?.json && !isGroq;

    const request: any = {
      model,
      messages: [{ role: 'user', content: finalPrompt }],
      max_tokens: options?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      response_format: useJsonFormat ? { type: 'json_object' } : undefined,
    };
    if (isGroq && model.includes('gpt-oss')) request.reasoning_effort = 'low';
    const response = await withProviderRetry(() => client.chat.completions.create(request));
    let text = response.choices[0]?.message.content;
    if (!text) throw new Error(`${isGroq ? 'Groq' : 'BazaarLink'} ไม่ส่งข้อมูลกลับมา`);

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

  const parts: any[] = [{ text: finalPrompt }];
  if (options?.filePath && options?.mimeType) {
    const fs = require('fs');
    if (fs.existsSync(options.filePath)) {
      const base64 = fs.readFileSync(options.filePath, 'base64');
      parts.push({
        inlineData: {
          data: base64,
          mimeType: options.mimeType
        }
      });
    }
  }

  const result = await withGeminiRetry(() => model.generateContent(parts));
  let text = result.response.text();
  if (options?.json) {
    text = extractJSON(text);
  }
  return { text, provider, model: GEMINI_MODEL };
}

export async function createAITextStream(prompt: string, providerOverride?: string, filePath?: string, mimeType?: string) {
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
  
  const parts: any[] = [{ text: boundedPrompt }];
  if (filePath && mimeType) {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      const base64 = fs.readFileSync(filePath, 'base64');
      parts.push({
        inlineData: {
          data: base64,
          mimeType: mimeType
        }
      });
    }
  }

  const result = await withGeminiRetry(() => model.generateContentStream(parts));
  const chunks = (async function* () {
    for await (const chunk of result.stream) yield chunk.text();
  })();
  return { chunks, provider, model: GEMINI_MODEL };
}
