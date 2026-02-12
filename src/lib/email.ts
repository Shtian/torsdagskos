import { createEmailProviderFromEnv } from './email-provider-factory';
import type { SendEmailInput, SendEmailResult } from './email-contract';

export type { SendEmailInput, SendEmailResult } from './email-contract';

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const provider = createEmailProviderFromEnv();
  return provider.send(input);
}
