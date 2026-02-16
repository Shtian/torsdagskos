import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';

type SettingsNotificationsProps = {
  initialNotificationsEnabled: boolean;
  vapidPublicKey: string;
};

type FeedbackType = 'idle' | 'loading' | 'success' | 'error';

type PushSubscriptionPayload = ReturnType<PushSubscription['toJSON']>;

const defaultButtonLabel = 'Be om varslingstillatelse';
const loadingButtonLabel = 'Oppdaterer...';

function getPermissionLabel(
  permission: NotificationPermission | string,
): string {
  if (!permission) {
    return 'Ukjent';
  }

  if (permission === 'default') {
    return 'Standard';
  }

  if (permission === 'granted') {
    return 'Tillatt';
  }

  if (permission === 'denied') {
    return 'Avvist';
  }

  return permission.charAt(0).toUpperCase() + permission.slice(1);
}

function getFeedbackClassName(type: FeedbackType): string {
  if (type === 'idle') {
    return 'hidden rounded-md border px-4 py-3';
  }

  const baseClasses = 'block rounded-md border px-4 py-3';
  if (type === 'success') {
    return `${baseClasses} border-emerald-200 bg-emerald-50`;
  }

  if (type === 'loading') {
    return `${baseClasses} border-border bg-muted/50`;
  }

  return `${baseClasses} border-destructive/30 bg-destructive/10`;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`
    .replaceAll('-', '+')
    .replaceAll('_', '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function savePreference(enabled: boolean): Promise<void> {
  const response = await fetch('/api/settings/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ enabled }),
  });

  if (!response.ok) {
    throw new Error('Kunne ikke lagre varslingspreferanse');
  }
}

async function savePushSubscription(
  subscription: PushSubscriptionPayload | null,
): Promise<void> {
  const response = await fetch('/api/settings/push-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscription }),
  });

  if (!response.ok) {
    throw new Error('Kunne ikke lagre push-abonnement');
  }
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  const existingRegistration =
    await navigator.serviceWorker.getRegistration('/service-worker.js');
  if (existingRegistration) {
    return existingRegistration;
  }

  return navigator.serviceWorker.register('/service-worker.js');
}

export default function SettingsNotifications({
  initialNotificationsEnabled,
  vapidPublicKey,
}: SettingsNotificationsProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedPreferenceEnabled, setSavedPreferenceEnabled] = useState(
    initialNotificationsEnabled,
  );
  const [permissionStatus, setPermissionStatus] = useState('Sjekker...');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('idle');
  const [notificationsSupported, setNotificationsSupported] = useState(true);

  const [supportsPush, setSupportsPush] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    if (!('Notification' in window)) {
      setNotificationsSupported(false);
      setPermissionStatus('Ikke støttet');
      setFeedbackMessage('Denne nettleseren støtter ikke varsler.');
      setFeedbackType('error');
      return;
    }

    setSupportsPush('serviceWorker' in navigator && 'PushManager' in window);
    setPermissionStatus(getPermissionLabel(Notification.permission));
  }, []);

  const syncPushSubscription = async (enabled: boolean): Promise<void> => {
    if (!supportsPush) {
      return;
    }

    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return;
    }

    const existingSubscription =
      await registration.pushManager.getSubscription();

    if (!enabled) {
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      }
      await savePushSubscription(null);
      return;
    }

    if (!vapidPublicKey) {
      return;
    }

    let subscription = existingSubscription;
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublicKey,
        ) as BufferSource,
      });
    }

    const serializedSubscription =
      typeof subscription.toJSON === 'function' ? subscription.toJSON() : null;

    await savePushSubscription(serializedSubscription);
  };

  const onRequestPermission = async () => {
    if (!('Notification' in window)) {
      setFeedbackMessage('Varsler støttes ikke i denne nettleseren.');
      setFeedbackType('error');
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage('Oppdaterer varslingsinnstillinger...');
    setFeedbackType('loading');

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(getPermissionLabel(permission));

      const enabled = permission === 'granted';
      await syncPushSubscription(enabled);
      await savePreference(enabled);

      setSavedPreferenceEnabled(enabled);
      setFeedbackMessage(
        enabled
          ? 'Nettleslervarsler aktivert.'
          : 'Nettleslervarsler er deaktivert i denne nettleseren.',
      );
      setFeedbackType('success');
    } catch (error) {
      setFeedbackMessage(
        error instanceof Error
          ? error.message
          : 'Kunne ikke oppdatere varslingsinnstillinger. Prøv igjen.',
      );
      setFeedbackType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-settings-notifications="true"
      data-hydrated={isHydrated ? 'true' : 'false'}
    >
      <div data-slot="card-content" className="space-y-6 px-6 py-6 sm:px-8">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div
            data-test-id="settings-permission-card"
            className="bg-muted/40 rounded-md border px-4 py-4"
          >
            <dt className="mb-1 text-sm text-muted-foreground">
              Tillatelsesstatus
            </dt>
            <dd
              id="permission-status"
              className="m-0 text-lg font-semibold text-(--color-accent-dark)"
            >
              {permissionStatus}
            </dd>
          </div>
          <div
            data-test-id="settings-preference-card"
            className="bg-muted/40 rounded-md border px-4 py-4"
          >
            <dt className="mb-1 text-sm text-muted-foreground">
              Lagret preferanse
            </dt>
            <dd
              id="saved-preference"
              className="m-0 text-lg font-semibold text-(--color-accent-dark)"
              data-enabled={savedPreferenceEnabled ? 'true' : 'false'}
            >
              {savedPreferenceEnabled ? 'Aktivert' : 'Deaktivert'}
            </dd>
          </div>
        </dl>

        <div
          id="settings-feedback-panel"
          data-test-id="settings-feedback-panel"
          className={getFeedbackClassName(feedbackType)}
          role={feedbackType === 'error' ? 'alert' : 'status'}
          aria-live={feedbackType === 'error' ? 'assertive' : 'polite'}
        >
          <p id="feedback" className="m-0 text-sm text-foreground">
            {feedbackMessage}
          </p>
        </div>
      </div>

      <div
        data-slot="card-footer"
        className="flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:px-8"
      >
        <Button
          type="button"
          id="request-permission"
          className="min-h-11 min-w-11 h-auto cursor-pointer px-6 py-3 text-base sm:w-auto"
          disabled={!notificationsSupported || isSubmitting}
          aria-busy={isSubmitting ? 'true' : undefined}
          onClick={onRequestPermission}
        >
          {isSubmitting ? loadingButtonLabel : defaultButtonLabel}
        </Button>
      </div>
    </div>
  );
}
