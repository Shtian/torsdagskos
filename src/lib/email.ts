interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface SendEmailResult {
  success: boolean;
  skipped: boolean;
  error?: string;
}

const DEFAULT_RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Torsdagskos <onboarding@resend.dev>';

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      skipped: true,
      error: 'RESEND_API_KEY is not configured',
    };
  }

  const apiUrl = process.env.RESEND_API_URL || DEFAULT_RESEND_API_URL;
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        skipped: false,
        error: `Resend API request failed (${response.status}): ${errorText}`,
      };
    }

    return {
      success: true,
      skipped: false,
    };
  } catch (error) {
    return {
      success: false,
      skipped: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}
