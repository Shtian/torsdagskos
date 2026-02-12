import { afterEach, describe, expect, it, vi } from 'vitest';
import { MailgunEmailProvider } from './mailgun-provider';

const originalApiKey = process.env.MAILGUN_API_KEY;
const originalDomain = process.env.MAILGUN_DOMAIN;
const originalApiUrl = process.env.MAILGUN_API_URL;
const originalEmailFrom = process.env.EMAIL_FROM;

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.MAILGUN_API_KEY;
  } else {
    process.env.MAILGUN_API_KEY = originalApiKey;
  }

  if (originalDomain === undefined) {
    delete process.env.MAILGUN_DOMAIN;
  } else {
    process.env.MAILGUN_DOMAIN = originalDomain;
  }

  if (originalApiUrl === undefined) {
    delete process.env.MAILGUN_API_URL;
  } else {
    process.env.MAILGUN_API_URL = originalApiUrl;
  }

  if (originalEmailFrom === undefined) {
    delete process.env.EMAIL_FROM;
  } else {
    process.env.EMAIL_FROM = originalEmailFrom;
  }

  vi.restoreAllMocks();
});

describe('MailgunEmailProvider', () => {
  it('returns skipped when API key or domain is missing', async () => {
    delete process.env.MAILGUN_API_KEY;
    delete process.env.MAILGUN_DOMAIN;
    const provider = new MailgunEmailProvider();

    const result = await provider.send({
      to: 'user@example.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    });

    expect(result).toEqual({
      success: false,
      skipped: true,
      error: 'MAILGUN_API_KEY or MAILGUN_DOMAIN is not configured',
      provider: 'mailgun',
    });
  });

  it('returns success for a 2xx response', async () => {
    process.env.MAILGUN_API_KEY = 'mailgun-key';
    process.env.MAILGUN_DOMAIN = 'mg.example.com';
    process.env.MAILGUN_API_URL = 'https://api.mailgun.net/v3';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
    } as Response);
    const provider = new MailgunEmailProvider();

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
      provider: 'mailgun',
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('returns normalized failure for non-2xx responses', async () => {
    process.env.MAILGUN_API_KEY = 'mailgun-key';
    process.env.MAILGUN_DOMAIN = 'mg.example.com';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'rate limited',
    } as Response);
    const provider = new MailgunEmailProvider();

    const result = await provider.send({
      to: 'user@example.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    });

    expect(result.success).toBe(false);
    expect(result.skipped).toBe(false);
    expect(result.provider).toBe('mailgun');
    expect(result.error).toContain('Mailgun API request failed (429): rate limited');
  });
});
