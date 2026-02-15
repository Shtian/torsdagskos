import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useState } from 'react';
import {
  createEmptyEventFormErrors,
  getEventFormFeedbackClassName,
  type EventFormFeedbackType,
  type EventFormFieldName,
} from '@/components/event-form-controller';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { buttonVariants } from '@/components/ui/button';
import { validateUpdateEventForm } from '@/lib/event-form-validation';
import { parseOsloDateTimeInput } from '@/lib/oslo-datetime';

type FormSubmitEvent = Parameters<
  NonNullable<ComponentPropsWithoutRef<'form'>['onSubmit']>
>[0];

type EditEventFormProps = {
  cancelHref: string;
  eventId: number;
  prefillDate: string;
  prefillDescription: string;
  prefillLocation: string;
  prefillMapLink: string;
  prefillTime: string;
  prefillTitle: string;
};

const defaultSubmitLabel = 'Lagre endringer';
const loadingSubmitLabel = 'Lagrer...';

export default function EditEventForm({
  cancelHref,
  eventId,
  prefillDate,
  prefillDescription,
  prefillLocation,
  prefillMapLink,
  prefillTime,
  prefillTitle,
}: EditEventFormProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<EventFormFeedbackType>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<EventFormFieldName, string>>(
    createEmptyEventFormErrors(),
  );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const clearFieldErrors = () => {
    setFieldErrors(createEmptyEventFormErrors());
  };

  const setFeedback = (message: string, type: EventFormFeedbackType) => {
    setFeedbackMessage(message);
    setFeedbackType(type);
  };

  const onSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const parsedForm = validateUpdateEventForm({
      date: formData.get('date'),
      description: formData.get('description'),
      eventId: formData.get('eventId'),
      location: formData.get('location'),
      mapLink: formData.get('mapLink'),
      time: formData.get('time'),
      title: formData.get('title'),
    });

    clearFieldErrors();
    setFeedback('', 'idle');

    if (!parsedForm.success) {
      const nextErrors = createEmptyEventFormErrors();

      (Object.keys(nextErrors) as EventFormFieldName[]).forEach((fieldName) => {
        nextErrors[fieldName] = parsedForm.error.fieldErrors[fieldName]?.[0] ?? '';
      });

      setFieldErrors(nextErrors);
      setFeedback('Rett feltene som er markert og prøv igjen.', 'error');
      return;
    }

    const { eventId, title, description, date, time, location, mapLink } = parsedForm.data;
    const dateTime = parseOsloDateTimeInput(date, time);

    setIsSubmitting(true);
    setFeedback('Lagrer endringer i arrangement...', 'loading');

    try {
      const response = await fetch('/api/events/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          title,
          description: description || '',
          dateTime: dateTime.toISOString(),
          location,
          mapLink: mapLink || null,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error || 'Kunne ikke oppdatere arrangement');
      }

      const result = (await response.json()) as { eventId?: number | string };

      setFeedback('Arrangement oppdatert. Videresender til detaljer...', 'success');

      const updatedEventId = result.eventId;
      if (updatedEventId) {
        setTimeout(() => {
          window.location.href = `/events/${updatedEventId}`;
        }, 1000);
      }
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Kunne ikke oppdatere arrangement. Prøv igjen.',
        'error',
      );
      setIsSubmitting(false);
    }
  };

  const feedbackClassName = getEventFormFeedbackClassName(feedbackType);

  return (
    <form
      id="event-form"
      data-slot="card"
      className="bg-card text-card-foreground rounded-xl border shadow-sm"
      noValidate
      onSubmit={onSubmit}
      data-edit-event-form="true"
      data-hydrated={isHydrated ? 'true' : 'false'}
    >
      <input type="hidden" id="eventId" name="eventId" value={eventId} />

      <div data-slot="card-header" className="space-y-2 border-b px-6 py-5 sm:px-8">
        <h1 className="m-0 text-3xl text-(--color-accent-dark) sm:text-4xl">Rediger arrangement</h1>
        <p className="m-0 text-sm text-muted-foreground">
          Oppdater arrangementsdetaljene nedenfor. Felt merket med * er påkrevd.
        </p>
      </div>

      <div data-slot="card-content" className="space-y-6 px-6 py-6 sm:px-8">
        <div className="space-y-2">
          <Label htmlFor="title">
            Arrangementstittel <span className="text-destructive">*</span>
          </Label>
          <Input
            type="text"
            id="title"
            name="title"
            className="h-auto px-3 py-3"
            defaultValue={prefillTitle}
            aria-invalid={fieldErrors.title ? 'true' : undefined}
            aria-describedby={fieldErrors.title ? 'title-error' : undefined}
          />
          <p
            id="title-error"
            data-test-id="field-error-title"
            className={fieldErrors.title ? 'block text-sm text-destructive' : 'hidden text-sm text-destructive'}
            role="alert"
          >
            {fieldErrors.title}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Beskrivelse</Label>
          <Textarea
            id="description"
            name="description"
            className="min-h-[120px] resize-y px-3 py-3"
            rows={5}
            defaultValue={prefillDescription}
            aria-invalid={fieldErrors.description ? 'true' : undefined}
            aria-describedby={fieldErrors.description ? 'description-error' : undefined}
          />
          <p
            id="description-error"
            data-test-id="field-error-description"
            className={
              fieldErrors.description
                ? 'block text-sm text-destructive'
                : 'hidden text-sm text-destructive'
            }
            role="alert"
          >
            {fieldErrors.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date">
              Dato <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              id="date"
              name="date"
              className="h-auto px-3 py-3"
              defaultValue={prefillDate}
              aria-invalid={fieldErrors.date ? 'true' : undefined}
              aria-describedby={fieldErrors.date ? 'date-error' : undefined}
            />
            <p
              id="date-error"
              data-test-id="field-error-date"
              className={fieldErrors.date ? 'block text-sm text-destructive' : 'hidden text-sm text-destructive'}
              role="alert"
            >
              {fieldErrors.date}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">
              Tid <span className="text-destructive">*</span>
            </Label>
            <Input
              type="time"
              id="time"
              name="time"
              className="h-auto px-3 py-3"
              defaultValue={prefillTime}
              aria-invalid={fieldErrors.time ? 'true' : undefined}
              aria-describedby={fieldErrors.time ? 'time-error' : undefined}
            />
            <p
              id="time-error"
              data-test-id="field-error-time"
              className={fieldErrors.time ? 'block text-sm text-destructive' : 'hidden text-sm text-destructive'}
              role="alert"
            >
              {fieldErrors.time}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">
            Sted <span className="text-destructive">*</span>
          </Label>
          <Input
            type="text"
            id="location"
            name="location"
            className="h-auto px-3 py-3"
            defaultValue={prefillLocation}
            aria-invalid={fieldErrors.location ? 'true' : undefined}
            aria-describedby={fieldErrors.location ? 'location-error' : undefined}
          />
          <p
            id="location-error"
            data-test-id="field-error-location"
            className={fieldErrors.location ? 'block text-sm text-destructive' : 'hidden text-sm text-destructive'}
            role="alert"
          >
            {fieldErrors.location}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mapLink">
            Kartlenke <span className="text-sm font-normal text-muted-foreground">(valgfritt)</span>
          </Label>
          <Input
            type="url"
            id="mapLink"
            name="mapLink"
            className="h-auto px-3 py-3"
            placeholder="https://maps.google.com/..."
            defaultValue={prefillMapLink}
            aria-invalid={fieldErrors.mapLink ? 'true' : undefined}
            aria-describedby={fieldErrors.mapLink ? 'mapLink-error' : undefined}
          />
          <p
            id="mapLink-error"
            data-test-id="field-error-mapLink"
            className={fieldErrors.mapLink ? 'block text-sm text-destructive' : 'hidden text-sm text-destructive'}
            role="alert"
          >
            {fieldErrors.mapLink}
          </p>
        </div>

        <div
          id="form-feedback-panel"
          data-test-id="form-feedback-panel"
          className={feedbackClassName}
          role={feedbackType === 'error' ? 'alert' : 'status'}
          aria-live={feedbackType === 'error' ? 'assertive' : 'polite'}
        >
          <p id="form-feedback" className="m-0 text-sm text-foreground">
            {feedbackMessage}
          </p>
        </div>
      </div>

      <div data-slot="card-footer" className="flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:px-8">
        <Button
          type="submit"
          id="submit-button"
          data-test-id="submit-edit-event-button"
          className="min-h-11 min-w-11 h-auto cursor-pointer px-6 py-3 text-base sm:w-auto"
          disabled={isSubmitting}
          aria-busy={isSubmitting ? 'true' : undefined}
        >
          {isSubmitting ? loadingSubmitLabel : defaultSubmitLabel}
        </Button>
        <a
          href={cancelHref}
          className={`${buttonVariants({ variant: 'outline', size: 'default' })} min-h-11 min-w-11 px-6 py-3 text-base no-underline sm:w-auto`}
        >
          Avbryt
        </a>
      </div>
    </form>
  );
}
