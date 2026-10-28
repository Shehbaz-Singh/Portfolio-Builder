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

const LLM_TIMEOUT_MS = 40_000;
// A page of real text is far more than this; less means a scan or an empty file.
const MIN_TEXT_CHARS = 80;

const unavailable = () =>
  new AppError(
    503,
    'RESUME_IMPORT_UNAVAILABLE',
    'Resume import is not available right now. You can fill in your details by hand.',
  );

// Turns a provider failure into an error the person can act on. Only the kind is logged, for
// whoever runs the server (a wrong API key shows up here): never the resume or the provider's body.
function failure(provider: string, err: unknown): unknown {
  if (!(err instanceof LlmError)) return err;
  switch (err.kind) {
    case 'busy':
      return new AppError(
        503,
        'RESUME_SERVICE_BUSY',
        'The reading service is busy. Please try again in a minute.',
      );
    case 'timeout':
      return new AppError(
        504,
        'RESUME_TIMEOUT',
        'Reading your resume took too long. Please try again.',
      );
    case 'bad_response':
      return new AppError(
        502,
        'RESUME_PARSE_FAILED',
        "We couldn't make sense of that resume. Please try again.",
      );
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
    throw new AppError(400, 'UNSUPPORTED_FILE_TYPE', 'Only PDF files are supported');
  }

  const text = await extractPdfText(pdf);
  if (text.length < MIN_TEXT_CHARS) {
    throw new AppError(
      422,
      'NO_TEXT_FOUND',
      'That PDF has no readable text. Scanned resumes are not supported; export a PDF with selectable text.',
    );
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
    throw new AppError(422, 'NOTHING_FOUND', "We couldn't find resume details in that file.");
  }
  return result;
}
