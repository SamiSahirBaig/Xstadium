import { messaging, db } from '../config/firebase.js';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Initializes Firebase Cloud Messaging streams directly for active authenticated users.
 * Secures tokens tracking into Firestore boundaries accurately.
 */
export const initNotifications = async (userId) => {
  if (!messaging || !userId) return;

  try {
    // Requires VAPID key mapped in .env (or naturally executing limits across FCM Web Configurations)
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permissions denied by user.');
      return;
    }

    // Execute safe FCM Token Pull parsing VAPID mapping keys if available safely
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });

    if (currentToken) {
      // Securely map physical tokens onto active Firestore nodes implicitly binding backend routing limits.
      await updateDoc(doc(db, 'users', userId), { fcmToken: currentToken });
      console.info('[FCM] Target Stream Subscribed securely natively:', currentToken);
    } else {
      console.warn('[FCM] No registration token available natively.');
    }

    // Bind physical active foreground loop execution boundaries parsing payloads efficiently into global Window scopes natively.
    onMessage(messaging, (payload) => {
      console.log('[FCM] Active foreground payload executed:', payload);
      // Ideally trigger generic toast loops utilizing React configurations natively
      if (window && window.__triggerToast) {
         window.__triggerToast(payload.notification.title, payload.notification.body);
      }
    });

  } catch (err) {
    console.error('[FCM] Execution hooks severely failing:', err);
  }
};
