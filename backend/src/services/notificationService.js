import admin from 'firebase-admin';
import { getDoc, addToSubcollection, Collections } from '../db/firestore.js';

/**
 * sendToUser
 * Fetches the user's FCM token from Firestore and transmits a direct notification.
 */
export const sendToUser = async (userId, title, body, data = {}) => {
  try {
    const userSnap = await getDoc(Collections.USERS, userId);
    const token = userSnap?.fcmToken;

    if (!token) {
      console.warn(`[FCM] No valid fcmToken found for User ${userId}, aborting direct message.`);
      return false;
    }

    const payload = {
      notification: { title, body },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        ...data
      },
      token
    };

    const response = await admin.messaging().send(payload);
    
    // Store persistently inside the User's explicit database boundary strictly parsing UI renders mapping Issue 32 natively.
    await addToSubcollection(Collections.USERS, userId, 'notifications', {
       title,
       body,
       read: false,
       type: data.type || 'SYSTEM',
       payload: data,
       timestamp: new Date().toISOString()
    });

    console.info(`[FCM] Successfully delivered direct FCM to User ${userId}:`, response);
    return true;
  } catch (error) {
    console.error(`[FCM] Delivery failed to User ${userId}:`, error.message);
    return false;
  }
};

/**
 * sendToTopic
 * Broadcasts a notification immediately to a Pub/Sub identical topic ring globally.
 */
export const sendToTopic = async (topic, title, body, data = {}) => {
  try {
    // Sanitize topic formatting ensuring FCM rules
    const targetTopic = topic.replace(/[^\w-]/g, '_');
    
    const payload = {
      notification: { title, body },
      data: { ...data },
      topic: targetTopic
    };

    const response = await admin.messaging().send(payload);
    console.info(`[FCM] Broadcast complete for topic ${targetTopic}:`, response);
    return true;
  } catch (error) {
    console.error(`[FCM] Topic broadcast failed for ${topic}:`, error.message);
    return false;
  }
};
