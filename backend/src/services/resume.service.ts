import type { ResumeResponse } from '@parichay/shared';
import { AppError } from '../lib/errors';
import { getLlmProvider, LlmError } from '../lib/llm';
import { extractPdfText, looksLikePdf } from '../lib/pdf';
import {
  buildUserMessage,
  hasContent,
  parseModelReply,
  sanitizeResume,
  SYSTEM_PROMPT,
} from '../lib/resume-parse';
import { ERRORS } from '../lib/messages';
import { ERROR_CODES } from '@parichay/shared';

const LLM_TIMEOUT_MS = 40_000;
// A page of real text is far more than this; less means a scan or an empty file.
const MIN_TEXT_CHARS = 80;

const unavailable = () =>
  new AppError(503, ERROR_CODES.RESUME_IMPORT_UNAVAILABLE, ERRORS.resumeUnavailable);

// Turns a provider failure into an error the person can act on. Only the kind is logged, for
// whoever runs the server (a wrong API key shows up here): never the resume or the provider's body.
function failure(provider: string, err: unknown): unknown {
  if (!(err instanceof LlmError)) return err;
  switch (err.kind) {
    case 'busy':
      return new AppError(503, 'RESUME_SERVICE_BUSY', ERRORS.resumeBusy);
    case 'timeout':
      return new AppError(504, 'RESUME_TIMEOUT', ERRORS.resumeTimeout);
    case 'bad_response':
      return new AppError(502, 'RESUME_PARSE_FAILED', ERRORS.resumeParseFailed);
    default:
      console.error(`Resume import: ${provider} ${err.kind}: ${err.message}`);
      return unavailable();
  }
}

// Reads a resume PDF and returns what it says. Nothing is saved, and the file lives only in
// this request's memory: it is not written to disk or kept.
export async function parseResume(pdf: Buffer): Promise<ResumeResponse> {
  const provider = getLlmProvider();
  if (!provider) throw unavailable();
  if (!looksLikePdf(pdf)) {
    throw new AppError(400, 'UNSUPPORTED_FILE_TYPE', ERRORS.pdfOnly);
  }

  const text = await extractPdfText(pdf);
  if (text.length < MIN_TEXT_CHARS) {
    throw new AppError(422, 'NO_TEXT_FOUND', ERRORS.pdfNoText);
  }

  let reply: string;
  try {
    reply = await provider.completeJson({
      system: SYSTEM_PROMPT,
      user: buildUserMessage(text),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
  } catch (err) {
    throw failure(provider.name, err);
  }

  let raw: unknown;
  try {
    raw = parseModelReply(reply);
  } catch {
    throw failure(provider.name, new LlmError('bad_response', 'Reply was not JSON'));
  }

  const result = sanitizeResume(raw);
  if (!hasContent(result)) {
    throw new AppError(422, ERROR_CODES.NOTHING_FOUND, ERRORS.resumeNothingFound);
  }
  return result;
}
