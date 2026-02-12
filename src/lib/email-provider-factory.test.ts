import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmailProviderFromEnv } from './email-provider-factory';
import { MailgunEmailProvider } from './email-providers/mailgun-provider';
import { ResendEmailProvider } from './email-providers/resend-provider';
import { sendEmail } from './email';

const originalEmailProvider = process.env.EMAIL_PROVIDER;
const originalResendApiKey = process.env.RESEND_API_KEY;

afterEach(() => {
  if (originalEmailProvider === undefined) {
    delete process.env.EMAIL_PROVIDER;
  } else {
    process.env.EMAIL_PROVIDER = originalEmailProvider;
  }

  if (originalResendApiKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = originalResendApiKey;
  }

  vi.restoreAllMocks();
});

describe('email provider factory', () => {
  it('returns resend provider by default when EMAIL_PROVIDER is missing', () => {
    delete process.env.EMAIL_PROVIDER;

    const provider = createEmailProviderFromEnv();

    expect(provider).toBeInstanceOf(ResendEmailProvider);
  });

  it('returns mailgun provider when EMAIL_PROVIDER=mailgun', () => {
    process.env.EMAIL_PROVIDER = 'mailgun';

    const provider = createEmailProviderFromEnv();

    expect(provider).toBeInstanceOf(MailgunEmailProvider);
  });

  it('falls back to resend and warns when EMAIL_PROVIDER is unknown', async () => {
    process.env.EMAIL_PROVIDER = 'unsupported-provider';
    delete process.env.RESEND_API_KEY;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'Unknown EMAIL_PROVIDER "unsupported-provider", defaulting to "resend"',
    );
    expect(result.provider).toBe('resend');
    expect(result.skipped).toBe(true);
  });
});
