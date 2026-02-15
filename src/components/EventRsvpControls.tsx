import { useEffect, useState } from 'react';
import { Check, CircleHelp, Minus, X } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

type RsvpStatus = 'going' | 'maybe' | 'not_going';
type FeedbackType = 'idle' | 'loading' | 'success' | 'error';

type RsvpCounts = {
  going: number;
  maybe: number;
  noResponse: number;
  notGoing: number;
};

type EventRsvpControlsProps = {
  eventId: number;
  initialCounts: RsvpCounts;
  initialStatus: RsvpStatus | null;
  isUpcoming: boolean;
};

const statusLabelMap: Record<RsvpStatus, string> = {
  going: 'Kommer',
  maybe: 'Kanskje',
  not_going: 'Kommer ikke',
};

const statusToCountKey: Record<RsvpStatus, keyof RsvpCounts> = {
  going: 'going',
  maybe: 'maybe',
  not_going: 'notGoing',
};

function getFeedbackClassName(type: FeedbackType): string {
  if (type === 'idle') {
    return 'hidden rounded-md border px-4 py-3';
  }

  const baseClasses = 'block rounded-md border px-4 py-3';
  if (type === 'loading') {
    return `${baseClasses} border-border bg-muted/50`;
  }

  if (type === 'success') {
    return `${baseClasses} border-emerald-200 bg-emerald-50`;
  }

  return `${baseClasses} border-destructive/30 bg-destructive/10`;
}

function getNextCounts(
  previousCounts: RsvpCounts,
  previousStatus: RsvpStatus | null,
  nextStatus: RsvpStatus,
): RsvpCounts {
  if (previousStatus === nextStatus) {
    return previousCounts;
  }

  const nextCounts = { ...previousCounts };

  if (previousStatus) {
    const previousKey = statusToCountKey[previousStatus];
    nextCounts[previousKey] = Math.max(0, nextCounts[previousKey] - 1);
  } else {
    nextCounts.noResponse = Math.max(0, nextCounts.noResponse - 1);
  }

  const nextKey = statusToCountKey[nextStatus];
  nextCounts[nextKey] += 1;
  return nextCounts;
}

export default function EventRsvpControls({
  eventId,
  initialCounts,
  initialStatus,
  isUpcoming,
}: EventRsvpControlsProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<RsvpStatus | null>(initialStatus);
  const [counts, setCounts] = useState<RsvpCounts>(initialCounts);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('idle');
  const [submittingStatus, setSubmittingStatus] = useState<RsvpStatus | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isSubmitting = submittingStatus !== null;

  const handleSubmit = async (nextStatus: RsvpStatus) => {
    if (!isUpcoming || isSubmitting) {
      return;
    }

    const previousStatus = currentStatus;
    const previousCounts = counts;
    const optimisticCounts = getNextCounts(previousCounts, previousStatus, nextStatus);

    setCurrentStatus(nextStatus);
    setCounts(optimisticCounts);
    setSubmittingStatus(nextStatus);
    setFeedbackMessage('Lagrer svar...');
    setFeedbackType('loading');

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          status: nextStatus,
        }),
        signal: controller.signal,
      }).finally(() => {
        window.clearTimeout(timeoutId);
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
          message?: string;
        } | null;
        throw new Error(
          errorPayload?.message ||
            errorPayload?.error ||
            'Kunne ikke oppdatere svar. Prøv igjen.',
        );
      }

      setFeedbackMessage('Svar oppdatert.');
      setFeedbackType('success');
    } catch {
      setCurrentStatus(previousStatus);
      setCounts(previousCounts);
      setFeedbackMessage('Kunne ikke oppdatere svar. Prøv igjen.');
      setFeedbackType('error');
    } finally {
      setSubmittingStatus(null);
    }
  };

  return (
    <div data-event-rsvp="true" data-hydrated={isHydrated ? 'true' : 'false'} className="space-y-5">
      <section
        data-test-id="current-user-rsvp"
        className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Ditt svar
            </p>
            <p className="mt-1 mb-0 text-sm font-medium text-foreground">Velg status:</p>
          </div>
        </div>

        {isUpcoming && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <button
              type="button"
              className={`${buttonVariants({ variant: 'outline', size: 'default' })} min-h-11 min-w-11 cursor-pointer px-3 py-2.5 text-sm sm:text-base ${
                currentStatus === 'going'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : ''
              }`}
              data-slot="button"
              data-rsvp-button="true"
              data-status="going"
              data-active={currentStatus === 'going' ? 'true' : 'false'}
              data-event-id={eventId}
              aria-label={statusLabelMap.going}
              disabled={isSubmitting}
              aria-busy={isSubmitting ? 'true' : undefined}
              onClick={() => handleSubmit('going')}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {submittingStatus === 'going' ? 'Lagrer...' : statusLabelMap.going}
            </button>
            <button
              type="button"
              className={`${buttonVariants({ variant: 'outline', size: 'default' })} min-h-11 min-w-11 cursor-pointer px-3 py-2.5 text-sm sm:text-base ${
                currentStatus === 'maybe'
                  ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : ''
              }`}
              data-slot="button"
              data-rsvp-button="true"
              data-status="maybe"
              data-active={currentStatus === 'maybe' ? 'true' : 'false'}
              data-event-id={eventId}
              aria-label={statusLabelMap.maybe}
              disabled={isSubmitting}
              aria-busy={isSubmitting ? 'true' : undefined}
              onClick={() => handleSubmit('maybe')}
            >
              <CircleHelp className="h-4 w-4" aria-hidden="true" />
              {submittingStatus === 'maybe' ? 'Lagrer...' : statusLabelMap.maybe}
            </button>
            <button
              type="button"
              className={`${buttonVariants({ variant: 'outline', size: 'default' })} min-h-11 min-w-11 cursor-pointer px-3 py-2.5 text-sm sm:text-base ${
                currentStatus === 'not_going'
                  ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : ''
              }`}
              data-slot="button"
              data-rsvp-button="true"
              data-status="not_going"
              data-active={currentStatus === 'not_going' ? 'true' : 'false'}
              data-event-id={eventId}
              aria-label={statusLabelMap.not_going}
              disabled={isSubmitting}
              aria-busy={isSubmitting ? 'true' : undefined}
              onClick={() => handleSubmit('not_going')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              {submittingStatus === 'not_going'
                ? 'Lagrer...'
                : statusLabelMap.not_going}
            </button>
          </div>
        )}
      </section>

      <div
        id="rsvp-feedback-panel"
        data-test-id="rsvp-feedback-panel"
        className={getFeedbackClassName(feedbackType)}
        role={feedbackType === 'error' ? 'alert' : 'status'}
        aria-live={feedbackType === 'error' ? 'assertive' : 'polite'}
      >
        <p id="rsvp-feedback" className="m-0 text-sm text-foreground">
          {feedbackMessage}
        </p>
      </div>

      <div data-test-id="rsvp-counts" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          data-test-id="rsvp-count-item"
          data-rsvp-type="going"
          className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center"
        >
          <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
          <span
            data-test-id="rsvp-count-value"
            className="mb-1 block text-2xl font-semibold text-(--color-accent-dark)"
          >
            {counts.going}
          </span>
          <span className="block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
            Kommer
          </span>
        </div>

        <div
          data-test-id="rsvp-count-item"
          data-rsvp-type="maybe"
          className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center"
        >
          <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
          </span>
          <span
            data-test-id="rsvp-count-value"
            className="mb-1 block text-2xl font-semibold text-(--color-accent-dark)"
          >
            {counts.maybe}
          </span>
          <span className="block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
            Kanskje
          </span>
        </div>

        <div
          data-test-id="rsvp-count-item"
          data-rsvp-type="not_going"
          className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center"
        >
          <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700">
            <X className="h-4 w-4" aria-hidden="true" />
          </span>
          <span
            data-test-id="rsvp-count-value"
            className="mb-1 block text-2xl font-semibold text-(--color-accent-dark)"
          >
            {counts.notGoing}
          </span>
          <span className="block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
            Kommer ikke
          </span>
        </div>

        <div
          data-test-id="rsvp-count-item"
          data-rsvp-type="no_response"
          className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center"
        >
          <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border bg-muted text-muted-foreground">
            <Minus className="h-4 w-4" aria-hidden="true" />
          </span>
          <span
            data-test-id="rsvp-count-value"
            className="mb-1 block text-2xl font-semibold text-(--color-accent-dark)"
          >
            {counts.noResponse}
          </span>
          <span className="block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
            Ingen respons
          </span>
        </div>
      </div>
    </div>
  );
}
