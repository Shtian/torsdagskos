import { z } from 'zod';
import { parseWithSchema } from './validation';

const urlSchema = z.url();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isValidMapLink(value: string): boolean {
  if (value.length === 0) {
    return true;
  }

  return urlSchema.safeParse(value).success;
}

const baseEventFormSchema = z.object({
  date: z
    .string()
    .trim()
    .min(1, 'Dato er påkrevd.')
    .regex(datePattern, 'Dato må være på formatet ÅÅÅÅ-MM-DD.'),
  description: z
    .string()
    .trim()
    .max(4000, 'Beskrivelsen kan ikke være lengre enn 4000 tegn.'),
  location: z
    .string()
    .trim()
    .min(2, 'Sted må være minst 2 tegn.')
    .max(150, 'Sted kan ikke være lengre enn 150 tegn.'),
  mapLink: z
    .string()
    .trim()
    .refine(isValidMapLink, 'Kartlenke må være en gyldig URL.'),
  time: z
    .string()
    .trim()
    .min(1, 'Tid er påkrevd.')
    .regex(timePattern, 'Tid må være på formatet TT:MM.'),
  title: z
    .string()
    .trim()
    .min(3, 'Arrangementstittel må være minst 3 tegn.')
    .max(120, 'Arrangementstittel kan ikke være lengre enn 120 tegn.'),
});

export const createEventFormSchema = baseEventFormSchema;
export const updateEventFormSchema = baseEventFormSchema.extend({
  eventId: z.coerce.number().int().positive('Ugyldig arrangement-ID.'),
});

export type CreateEventFormInput = z.infer<typeof createEventFormSchema>;
export type UpdateEventFormInput = z.infer<typeof updateEventFormSchema>;

export function validateCreateEventForm(input: unknown) {
  return parseWithSchema(createEventFormSchema, input);
}

export function validateUpdateEventForm(input: unknown) {
  return parseWithSchema(updateEventFormSchema, input);
}
