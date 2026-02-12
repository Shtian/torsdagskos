export type EmailProviderName = 'resend' | 'mailgun';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  skipped: boolean;
  error?: string;
  provider: EmailProviderName;
}

export interface EmailProvider {
  readonly name: EmailProviderName;
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
