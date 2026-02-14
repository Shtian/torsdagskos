import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from '../email-contract';

const DEFAULT_MAILGUN_API_URL = 'https://api.mailgun.net/v3';
const DEFAULT_FROM = 'Torsdagskos <onboarding@resend.dev>';

function toBasicAuth(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

export class MailgunEmailProvider implements EmailProvider {
  readonly name = 'mailgun' as const;

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;

    if (!apiKey || !domain) {
      return {
        success: false,
        skipped: true,
        error: 'MAILGUN_API_KEY or MAILGUN_DOMAIN is not configured',
        provider: this.name,
      };
    }

    const apiUrl = process.env.MAILGUN_API_URL || DEFAULT_MAILGUN_API_URL;
    const endpoint = `${apiUrl.replace(/\/$/, '')}/${domain}/messages`;
    const from = input.from || process.env.EMAIL_FROM || DEFAULT_FROM;

    const body = new URLSearchParams();
    body.set('from', from);
    body.set('to', input.to);
    body.set('subject', input.subject);
    body.set('html', input.html);
    body.set('text', input.text);

    if (input.replyTo) {
      body.set('h:Reply-To', input.replyTo);
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: toBasicAuth('api', apiKey),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          skipped: false,
          error: `Mailgun API request failed (${response.status}): ${errorText}`,
          provider: this.name,
        };
      }

      return {
        success: true,
        skipped: false,
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        skipped: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
        provider: this.name,
      };
    }
  }
}
