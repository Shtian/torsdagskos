import type { EmailProvider, SendEmailInput, SendEmailResult } from '../email-contract';

const DEFAULT_RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Torsdagskos <onboarding@resend.dev>';

export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend' as const;

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        skipped: true,
        error: 'RESEND_API_KEY is not configured',
        provider: this.name,
      };
    }

    const apiUrl = process.env.RESEND_API_URL || DEFAULT_RESEND_API_URL;
    const from = input.from || process.env.EMAIL_FROM || DEFAULT_FROM;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
          reply_to: input.replyTo,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          skipped: false,
          error: `Resend API request failed (${response.status}): ${errorText}`,
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
