import { config } from './config';

// The one thing the resume feature needs from a language model: text in, JSON text out.
// To add a provider, write one more function like `gemini` below and register it in `providers`.
export interface LlmProvider {
  readonly name: string;
  // Returns the model's reply, which is expected to be a JSON document.
  completeJson(input: { system: string; user: string; signal: AbortSignal }): Promise<string>;
}

// Why a call failed, in terms the caller can act on, without provider-specific details.
export type LlmErrorKind =
  | 'busy' // rate limited or quota used up: worth retrying later
  | 'timeout'
  | 'auth' // bad or missing API key, or no access to the model
  | 'unavailable' // network failure, provider outage, or a rejected request
  | 'bad_response'; // answered, but with nothing usable (empty, blocked, wrong shape)

export class LlmError extends Error {
  constructor(
    readonly kind: LlmErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

const pick = (value: unknown, ...path: (string | number)[]): unknown =>
  path.reduce<unknown>(
    (node, key) =>
      node !== null && typeof node === 'object'
        ? (node as Record<string, unknown>)[key]
        : undefined,
    value,
  );

// POSTs JSON and returns the parsed reply. Every failure becomes an LlmError. Messages carry
// the HTTP status only: provider error bodies are not passed on, and the request (which holds
// the resume text) is never logged or attached to an error.
async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  signal: AbortSignal,
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    const timedOut =
      err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    throw new LlmError(
      timedOut ? 'timeout' : 'unavailable',
      timedOut ? 'Request timed out' : 'Network error',
    );
  }

  if (res.status === 429) throw new LlmError('busy', 'Rate limited (429)');
  if (res.status === 401 || res.status === 403)
    throw new LlmError('auth', `Rejected (${res.status})`);
  if (!res.ok) throw new LlmError('unavailable', `Provider error (${res.status})`);

  try {
    return await res.json();
  } catch {
    throw new LlmError('bad_response', 'Reply was not JSON');
  }
}

interface Options {
  apiKey: string;
  model: string;
  baseUrl: string;
}

// Google's Gemini API. JSON mode makes the model reply with valid JSON only. The key goes in a
// header, not the URL, so it cannot end up in logs or error messages.
const gemini = ({ apiKey, model, baseUrl }: Options): LlmProvider => ({
  name: 'gemini',
  async completeJson({ system, user, signal }) {
    const reply = await postJson(
      `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      { 'x-goog-api-key': apiKey },
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      },
      signal,
    );
    const parts = pick(reply, 'candidates', 0, 'content', 'parts');
    const text = Array.isArray(parts)
      ? parts
          .map((part) => pick(part, 'text'))
          .filter((t) => typeof t === 'string')
          .join('')
      : '';
    if (!text) throw new LlmError('bad_response', 'Empty or blocked reply');
    return text;
  },
});

// Any server that speaks the OpenAI chat-completions protocol: OpenAI itself, and also Groq,
// OpenRouter, Together, or a local Ollama / LM Studio, by pointing LLM_BASE_URL at it.
const openAi = ({ apiKey, model, baseUrl }: Options): LlmProvider => ({
  name: 'openai',
  async completeJson({ system, user, signal }) {
    const reply = await postJson(
      `${baseUrl}/chat/completions`,
      { authorization: `Bearer ${apiKey}` },
      {
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      },
      signal,
    );
    const text = pick(reply, 'choices', 0, 'message', 'content');
    if (typeof text !== 'string' || !text) throw new LlmError('bad_response', 'Empty reply');
    return text;
  },
});

// Which provider to use is configuration (LLM_PROVIDER). Each has its own default model and
// address, so the minimum setup is LLM_API_KEY.
const providers = {
  gemini: {
    model: 'gemini-3.5-flash-lite', // fast and on the free tier; the Flash models "think" for ~50 s here
    baseUrl: 'https://generativelanguage.googleapis.com',
    create: gemini,
  },
  openai: { model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1', create: openAi },
};

let cached: LlmProvider | null | undefined;

// null when no API key is set: the app still runs, only resume import is unavailable.
export function getLlmProvider(): LlmProvider | null {
  if (cached !== undefined) return cached;
  if (!config.LLM_API_KEY) return (cached = null);

  const entry = providers[config.LLM_PROVIDER];
  return (cached = entry.create({
    apiKey: config.LLM_API_KEY,
    model: config.LLM_MODEL ?? entry.model,
    baseUrl: (config.LLM_BASE_URL ?? entry.baseUrl).replace(/\/+$/, ''),
  }));
}
