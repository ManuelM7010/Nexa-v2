export interface NotificationPreferences {
  enabled: boolean;
  notifyCardCutoff: boolean;
  notifyPaymentDue: boolean;
  notifyNegativeBalance: boolean;
}

const PREF_KEY = 'nexa_notification_prefs';
const LAST_NOTIFIED_KEY = 'nexa_last_notified_timestamp';

export const getNotificationPreferences = (): NotificationPreferences => {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      notifyCardCutoff: true,
      notifyPaymentDue: true,
      notifyNegativeBalance: true,
    };
  }
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading notification prefs', e);
  }
  return {
    enabled: typeof Notification !== 'undefined' && Notification.permission === 'granted',
    notifyCardCutoff: true,
    notifyPaymentDue: true,
    notifyNegativeBalance: true,
  };
};

export const saveNotificationPreferences = (prefs: NotificationPreferences): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Error saving notification prefs', e);
  }
};

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    const prefs = getNotificationPreferences();
    saveNotificationPreferences({ ...prefs, enabled: granted });
    return granted;
  } catch (e) {
    console.error('Error requesting notification permission', e);
    return false;
  }
};

export const sendLocalNotification = (
  title: string,
  body: string,
  tag?: string
): boolean => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Standard Notification
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: tag || 'nexa-finance-alert',
    });
    return true;
  } catch (e) {
    console.warn('Web notification delivery error:', e);
    return false;
  }
};

export const sendTestNotification = async (): Promise<{ success: boolean; message: string }> => {
  if (!isNotificationSupported()) {
    return {
      success: false,
      message: 'Las notificaciones no están soportadas en este navegador o entorno.',
    };
  }

  let perm = Notification.permission;
  if (perm !== 'granted') {
    perm = await Notification.requestPermission();
  }

  if (perm === 'granted') {
    const sent = sendLocalNotification(
      'NexaFinance • Notificación de Prueba',
      '¡Funciona correctamente! Recibirás avisos locales de cortes y vencimientos sin costo.',
      'test-notification'
    );
    if (sent) {
      return {
        success: true,
        message: '¡Notificación enviada con éxito a tu dispositivo!',
      };
    }
  }

  return {
    success: false,
    message: 'Permiso denegado. Activa los permisos de notificación en el navegador.',
  };
};
