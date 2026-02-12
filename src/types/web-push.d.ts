declare module 'web-push' {
  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string,
  ): void;

  export function sendNotification(
    subscription: unknown,
    payload?: string,
    options?: { TTL?: number },
  ): Promise<void>;
}
