import { languageOf, type LanguageStatus } from '@parichay/shared';
import { Badge } from '../../ui';

// What a language still needs, in words (the bar only backs it up).
export function statusSummary(status: LanguageStatus) {
  return {
    publicText: status.publishable ? 'Public' : 'Not public yet: translate the tagline and about',
    reviewText: status.needsReview > 0 ? `${status.needsReview} need review` : null,
  };
}

// How complete one language is: a bar, the numbers, and whether visitors can open it yet.
export function LanguageProgress({
  status,
  showName = false,
}: {
  status: LanguageStatus;
  showName?: boolean;
}) {
  const { name } = languageOf(status.locale);
  const { publicText, reviewText } = statusSummary(status);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span>
          {showName && <span className="font-medium">{name}: </span>}
          {status.translated} of {status.total} texts
          <span className="sr-only"> translated, {status.percent} percent</span>
        </span>
        <span aria-hidden="true" className="text-muted">
          {status.percent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${name} translation progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={status.percent}
        aria-valuetext={`${status.translated} of ${status.total} texts translated`}
        className="h-2 overflow-hidden rounded-full bg-surface ring-1 ring-line"
      >
        <div className="h-full bg-accent" style={{ width: `${status.percent}%` }} />
      </div>
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <Badge tone={status.publishable ? 'accent' : 'warning'}>{publicText}</Badge>
        {reviewText && <Badge tone="warning">{reviewText}</Badge>}
      </p>
    </div>
  );
}
