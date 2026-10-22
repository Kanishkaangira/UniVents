import {
  PermissionsAndroid,
  Platform,
  TurboModuleRegistry,
} from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidStyle,
} from '@notifee/react-native';
import { supabase } from './supabase';

const EVENT_NOTIFICATION_CHANNEL_ID = 'univents_event_updates_v2';

function getMessagingApi() {
  const appModule = TurboModuleRegistry.get('NativeRNFBTurboApp');
  const messagingModule = TurboModuleRegistry.get('NativeRNFBTurboMessaging');
  if (!appModule || !messagingModule) {
    throw new Error(
      'Firebase native modules are missing from this app build. Rebuild the native app with React Native Firebase linked; updating the JavaScript bundle alone is not enough.',
    );
  }
  return require('@react-native-firebase/messaging');
}

async function fetchEventNotification(remoteMessage) {
  const notificationId = remoteMessage.data?.notification_id;
  if (!notificationId) {
    throw new Error('The event push did not include a notification_id.');
  }

  const { data, error } = await supabase
    .from('event_notifications')
    .select('id, event_id, title, message, image_url')
    .eq('id', notificationId)
    .maybeSingle();

  if (error)
    throw new Error(`Could not load the event notification: ${error.message}`);
  if (!data)
    throw new Error(`Event notification ${notificationId} was not found.`);
  return data;
}

export function listenForForegroundEventPushNotifications() {
  let active = true;
  let unsubscribe = () => {};

  Promise.resolve()
    .then(async () => {
      const messagingApi = getMessagingApi();
      const messaging = messagingApi.getMessaging();

      await notifee.createChannel({
        id: EVENT_NOTIFICATION_CHANNEL_ID,
        name: 'UniVents event updates',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      const stopListening = messagingApi.onMessage(
        messaging,
        async remoteMessage => {
          let notification;
          try {
            notification = await fetchEventNotification(remoteMessage);
          } catch (error) {
            console.warn(
              'Could not load push content from event_notifications:',
              error?.message,
            );
            notification = {
              title:
                remoteMessage.notification?.title || remoteMessage.data?.title,
              message:
                remoteMessage.notification?.body || remoteMessage.data?.body,
              image_url: null,
            };
          }

          if (!notification.title || !notification.message) {
            console.warn(
              'Could not display the push because its title or message is missing.',
            );
            return;
          }

          try {
            const androidStyle = notification.image_url
              ? {
                  type: AndroidStyle.BIGPICTURE,
                  picture: notification.image_url,
                  title: notification.title,
                  summary: 'New event on UniVents',
                }
              : {
                  type: AndroidStyle.BIGTEXT,
                  text: notification.message,
                  title: notification.title,
                  summary: 'New event on UniVents',
                };

            await notifee.displayNotification({
              title: notification.title,
              body: notification.message,
              data: remoteMessage.data,
              android: {
                channelId: EVENT_NOTIFICATION_CHANNEL_ID,
                smallIcon: 'ic_stat_univents',
                largeIcon: 'ic_launcher',
                color: '#5B4BFF',
                style: androidStyle,
                pressAction: { id: 'default' },
              },
              ios: { sound: 'default' },
            });
          } catch (error) {
            console.warn(
              'Could not display the foreground event notification:',
              error?.message,
            );
          }
        },
      );

      if (active) unsubscribe = stopListening;
      else stopListening();
    })
    .catch(error =>
      console.warn(
        'Could not start foreground push notifications:',
        error?.message,
      ),
    );

  return () => {
    active = false;
    unsubscribe();
  };
}

async function ensureNotificationPermission(messagingApi, messaging) {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: EVENT_NOTIFICATION_CHANNEL_ID,
      name: 'UniVents event updates',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    if (Platform.Version >= 33) {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Notification permission was not granted.');
      }
    }
  } else if (Platform.OS === 'ios') {
    const status = await messagingApi.requestPermission(messaging);
    const authorized =
      status === messagingApi.AuthorizationStatus.AUTHORIZED ||
      status === messagingApi.AuthorizationStatus.PROVISIONAL;
    if (!authorized) {
      throw new Error('Notification permission was not granted.');
    }
  }
}

async function saveDeviceToken(userId, token) {
  const { error } = await supabase.from('device_tokens').upsert(
    {
      user_id: userId,
      fcm_token: token,
      platform: Platform.OS,
      last_seen: new Date().toISOString(),
    },
    { onConflict: 'fcm_token' },
  );
  if (error) {
    throw new Error(
      `Could not save the push notification device token: ${error.message}`,
    );
  }
}

export async function registerForEventPushNotifications(userId, userType) {
  if (!userId || !['student', 'faculty'].includes(userType)) return () => {};

  const messagingApi = getMessagingApi();
  const messaging = messagingApi.getMessaging();
  await ensureNotificationPermission(messagingApi, messaging);

  await Promise.all(
    ['all', 'student', 'faculty'].map(async topic => {
      try {
        await messagingApi.unsubscribeFromTopic(messaging, topic);
      } catch (error) {
        console.warn(
          `Could not remove the old ${topic} push topic subscription:`,
          error?.message,
        );
      }
    }),
  );

  const token = await messagingApi.getToken(messaging);
  if (!token) throw new Error('Firebase did not return a device token.');
  await saveDeviceToken(userId, token);
  let currentToken = token;

  return messagingApi.onTokenRefresh(messaging, async refreshedToken => {
    try {
      await saveDeviceToken(userId, refreshedToken);
      const previousToken = currentToken;
      currentToken = refreshedToken;
      if (refreshedToken !== previousToken) {
        const { error } = await supabase
          .from('device_tokens')
          .delete()
          .eq('user_id', userId)
          .eq('fcm_token', previousToken);
        if (error) {
          throw new Error(
            `Could not remove the old push notification token: ${error.message}`,
          );
        }
      }
    } catch (error) {
      console.warn(
        'Could not update the push notification device token:',
        error?.message,
      );
    }
  });
}

export async function removeRegisteredDeviceToken(userId) {
  if (!userId) return;

  const messagingApi = getMessagingApi();
  const messaging = messagingApi.getMessaging();
  const token = await messagingApi.getToken(messaging);
  if (!token) return;

  const { error } = await supabase
    .from('device_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('fcm_token', token);
  if (error) {
    throw new Error(
      `Could not remove the push notification device token: ${error.message}`,
    );
  }
}
