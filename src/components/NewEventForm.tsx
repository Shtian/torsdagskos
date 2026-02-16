import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useState } from 'react';
import { validateCreateEventForm } from '@/lib/event-form-validation';
import { parseOsloDateTimeInput } from '@/lib/oslo-datetime';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { buttonVariants } from '@/components/ui/button';
import {
  createEmptyEventFormErrors,
  getEventFormFeedbackClassName,
  type EventFormFeedbackType,
  type EventFormFieldName,
} from '@/components/event-form-controller';

type NewEventFormProps = {
  prefillDescription: string;
  prefillLocation: string;
  prefillMapLink: string;
  prefillTitle: string;
};

type FormSubmitEvent = Parameters<
  NonNullable<ComponentPropsWithoutRef<'form'>['onSubmit']>
>[0];

const defaultSubmitLabel = 'Opprett arrangement';
const loadingSubmitLabel = 'Oppretter...';

export default function NewEventForm({
  prefillDescription,
  prefillLocation,
  prefillMapLink,
  prefillTitle,
}: NewEventFormProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] =
    useState<EventFormFeedbackType>('idle');
  const [fieldErrors, setFieldErrors] = useState<
    Record<EventFormFieldName, string>
  >(createEmptyEventFormErrors());

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

    const parsedForm = validateCreateEventForm({
      date: formData.get('date'),
      description: formData.get('description'),
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
        nextErrors[fieldName] =
          parsedForm.error.fieldErrors[fieldName]?.[0] ?? '';
      });

      setFieldErrors(nextErrors);
      setFeedback('Rett feltene som er markert og prøv igjen.', 'error');
      return;
    }

    const { title, description, date, time, location, mapLink } =
      parsedForm.data;

    const dateTime = parseOsloDateTimeInput(date, time);

    setIsSubmitting(true);
    setFeedback('Oppretter arrangement...', 'loading');

    try {
      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: description || '',
          dateTime: dateTime.toISOString(),
          location,
          mapLink: mapLink || null,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(
          errorPayload?.error || 'Kunne ikke opprette arrangement',
        );
      }

      const result = (await response.json()) as { eventId?: number | string };

      setFeedback(
        'Arrangement opprettet. Videresender til detaljer...',
        'success',
      );

      const eventId = result.eventId;
      if (eventId) {
        setTimeout(() => {
          window.location.href = `/events/${eventId}`;
        }, 1000);
      }
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Kunne ikke opprette arrangement. Prøv igjen.',
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
      data-new-event-form="true"
      data-hydrated={isHydrated ? 'true' : 'false'}
    >
      <div
        data-slot="card-header"
        className="space-y-2 border-b px-6 py-5 sm:px-8"
      >
        <h1 className="m-0 text-3xl text-(--color-accent-dark) sm:text-4xl">
          Opprett nytt arrangement
        </h1>
        <p className="m-0 text-sm text-muted-foreground">
          Fyll ut arrangementsdetaljene nedenfor. Felt merket med * er påkrevd.
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
            placeholder="f.eks. Torsdagskos hos Ola"
            defaultValue={prefillTitle}
            aria-invalid={fieldErrors.title ? 'true' : undefined}
            aria-describedby={fieldErrors.title ? 'title-error' : undefined}
          />
          <p
            id="title-error"
            data-test-id="field-error-title"
            className={
              fieldErrors.title
                ? 'block text-sm text-destructive'
                : 'hidden text-sm text-destructive'
            }
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
            placeholder="Hva er planen? Noen spesielle detaljer?"
            defaultValue={prefillDescription}
            aria-invalid={fieldErrors.description ? 'true' : undefined}
            aria-describedby={
              fieldErrors.description ? 'description-error' : undefined
            }
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
              aria-invalid={fieldErrors.date ? 'true' : undefined}
              aria-describedby={fieldErrors.date ? 'date-error' : undefined}
            />
            <p
              id="date-error"
              data-test-id="field-error-date"
              className={
                fieldErrors.date
                  ? 'block text-sm text-destructive'
                  : 'hidden text-sm text-destructive'
              }
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
              aria-invalid={fieldErrors.time ? 'true' : undefined}
              aria-describedby={fieldErrors.time ? 'time-error' : undefined}
            />
            <p
              id="time-error"
              data-test-id="field-error-time"
              className={
                fieldErrors.time
                  ? 'block text-sm text-destructive'
                  : 'hidden text-sm text-destructive'
              }
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
            placeholder="f.eks. Olas leilighet, Oslo sentrum"
            defaultValue={prefillLocation}
            aria-invalid={fieldErrors.location ? 'true' : undefined}
            aria-describedby={
              fieldErrors.location ? 'location-error' : undefined
            }
          />
          <p
            id="location-error"
            data-test-id="field-error-location"
            className={
              fieldErrors.location
                ? 'block text-sm text-destructive'
                : 'hidden text-sm text-destructive'
            }
            role="alert"
          >
            {fieldErrors.location}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mapLink">
            Kartlenke{' '}
            <span className="text-sm font-normal text-muted-foreground">
              (valgfritt)
            </span>
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
            className={
              fieldErrors.mapLink
                ? 'block text-sm text-destructive'
                : 'hidden text-sm text-destructive'
            }
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

      <div
        data-slot="card-footer"
        className="flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:px-8"
      >
        <Button
          type="submit"
          id="submit-button"
          data-test-id="submit-event-button"
          className="min-h-11 min-w-11 h-auto cursor-pointer px-6 py-3 text-base sm:w-auto"
          disabled={isSubmitting}
          aria-busy={isSubmitting ? 'true' : undefined}
        >
          {isSubmitting ? loadingSubmitLabel : defaultSubmitLabel}
        </Button>
        <a
          href="/"
          className={`${buttonVariants({ variant: 'outline', size: 'default' })} min-h-11 min-w-11 px-6 py-3 text-base no-underline sm:w-auto`}
        >
          Avbryt
        </a>
      </div>
    </form>
  );
}
