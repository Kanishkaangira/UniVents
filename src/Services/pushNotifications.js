import {PermissionsAndroid, Platform, TurboModuleRegistry} from 'react-native';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {supabase} from './supabase';

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

  const {data, error} = await supabase
    .from('event_notifications')
    .select('id, event_id, title, message, image_url')
    .eq('id', notificationId)
    .maybeSingle();

  if (error) throw new Error(`Could not load the event notification: ${error.message}`);
  if (!data) throw new Error(`Event notification ${notificationId} was not found.`);
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

      const stopListening = messagingApi.onMessage(messaging, async remoteMessage => {
        let notification;
        try {
          notification = await fetchEventNotification(remoteMessage);
        } catch (error) {
          console.warn('Could not load push content from event_notifications:', error?.message);
          notification = {
            title: remoteMessage.notification?.title || remoteMessage.data?.title,
            message: remoteMessage.notification?.body || remoteMessage.data?.body,
            image_url: null,
          };
        }

        if (!notification.title || !notification.message) {
          console.warn('Could not display the push because its title or message is missing.');
          return;
        }

        try {
          await notifee.displayNotification({
            title: notification.title,
            body: notification.message,
            data: remoteMessage.data,
            android: {
              channelId: EVENT_NOTIFICATION_CHANNEL_ID,
              smallIcon: 'ic_stat_univents',
              color: '#5B4BFF',
              pressAction: {id: 'default'},
            },
            ios: {sound: 'default'},
          });
        } catch (error) {
          console.warn('Could not display the foreground event notification:', error?.message);
        }
      });

      if (active) unsubscribe = stopListening;
      else stopListening();
    })
    .catch(error => console.warn('Could not start foreground push notifications:', error?.message));

  return () => {
    active = false;
    unsubscribe();
  };
}

export async function subscribeToEventPushNotifications(userType) {
  if (!['student', 'faculty'].includes(userType)) return;

  let messagingApi;
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
      console.warn('Event push notifications are disabled because notification permission was not granted.');
      return;
    }
  } else if (Platform.OS === 'ios') {
    messagingApi = getMessagingApi();
    const messaging = messagingApi.getMessaging();
    const status = await messagingApi.requestPermission(messaging);
    const authorized =
      status === messagingApi.AuthorizationStatus.AUTHORIZED ||
      status === messagingApi.AuthorizationStatus.PROVISIONAL;
    if (!authorized) {
      console.warn('Event push notifications are disabled because notification permission was not granted.');
      return;
    }
  }

  if (!messagingApi) messagingApi = getMessagingApi();
  const messaging = messagingApi.getMessaging();
  await messagingApi.subscribeToTopic(messaging, 'all');
  await messagingApi.subscribeToTopic(messaging, userType);
  console.info(`Subscribed to UniVents event push topics: all, ${userType}`);
}

export async function unsubscribeFromEventPushNotifications(userType) {
  if (!['student', 'faculty'].includes(userType)) return;
  const messagingApi = getMessagingApi();
  const messaging = messagingApi.getMessaging();
  await Promise.all([
    messagingApi.unsubscribeFromTopic(messaging, 'all'),
    messagingApi.unsubscribeFromTopic(messaging, userType),
  ]);
}
