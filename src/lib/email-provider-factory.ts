import type { EmailProvider } from './email-contract';
import { MailgunEmailProvider } from './email-providers/mailgun-provider';
import { ResendEmailProvider } from './email-providers/resend-provider';

function parseProviderName(): string {
  return (process.env.EMAIL_PROVIDER || 'resend').trim().toLowerCase();
}

export function createEmailProviderFromEnv(): EmailProvider {
  const provider = parseProviderName();

  if (provider === 'mailgun') {
    return new MailgunEmailProvider();
  }

  if (provider !== 'resend') {
    console.warn(
      `Unknown EMAIL_PROVIDER "${provider}", defaulting to "resend"`,
    );
  }

  return new ResendEmailProvider();
}
