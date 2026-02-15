export type EventFormFieldName =
  | 'title'
  | 'description'
  | 'date'
  | 'time'
  | 'location'
  | 'mapLink';

export type EventFormFeedbackType = 'idle' | 'loading' | 'success' | 'error';

export function createEmptyEventFormErrors(): Record<EventFormFieldName, string> {
  return {
    date: '',
    description: '',
    location: '',
    mapLink: '',
    time: '',
    title: '',
  };
}

export function getEventFormFeedbackClassName(feedbackType: EventFormFeedbackType): string {
  if (feedbackType === 'idle') {
    return 'hidden rounded-md border px-4 py-3';
  }

  if (feedbackType === 'loading') {
    return 'block rounded-md border border-border bg-muted/50 px-4 py-3';
  }

  if (feedbackType === 'success') {
    return 'block rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3';
  }

  return 'block rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3';
}
