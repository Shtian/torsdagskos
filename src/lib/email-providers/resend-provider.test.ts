import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResendEmailProvider } from './resend-provider';

const originalApiKey = process.env.RESEND_API_KEY;
const originalApiUrl = process.env.RESEND_API_URL;
const originalEmailFrom = process.env.EMAIL_FROM;

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = originalApiKey;
  }

  if (originalApiUrl === undefined) {
    delete process.env.RESEND_API_URL;
  } else {
    process.env.RESEND_API_URL = originalApiUrl;
  }

  if (originalEmailFrom === undefined) {
    delete process.env.EMAIL_FROM;
  } else {
    process.env.EMAIL_FROM = originalEmailFrom;
  }

  vi.restoreAllMocks();
});

describe('ResendEmailProvider', () => {
  it('returns skipped when API key is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const provider = new ResendEmailProvider();

    const result = await provider.send({
      to: 'user@example.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    });

    expect(result).toEqual({
      success: false,
      skipped: true,
      error: 'RESEND_API_KEY is not configured',
      provider: 'resend',
    });
  });

  it('returns success for a 2xx response', async () => {
    process.env.RESEND_API_KEY = 'resend-key';
    process.env.RESEND_API_URL = 'https://api.resend.com/emails';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
    } as Response);
    const provider = new ResendEmailProvider();

    const result = await provider.send({
      to: 'user@example.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
      replyTo: 'reply@example.com',
    });

    expect(result).toEqual({
      success: true,
      skipped: false,
      provider: 'resend',
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('returns normalized failure for non-2xx responses', async () => {
    process.env.RESEND_API_KEY = 'resend-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'provider-error',
    } as Response);
    const provider = new ResendEmailProvider();

    const result = await provider.send({
      to: 'user@example.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    });

    expect(result.success).toBe(false);
    expect(result.skipped).toBe(false);
    expect(result.provider).toBe('resend');
    expect(result.error).toContain(
      'Resend API request failed (500): provider-error',
    );
  });
});
