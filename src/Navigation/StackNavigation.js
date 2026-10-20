import React, {useEffect, useState} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeBottomTabs from './HomeBottomTabs';
import Login from '../Screens/Login';
import ProfileSetup from '../Screens/ProfileSetup';
import AIChat from '../Screens/AIChat';
import SplashScreen from '../Components/SplashScreen';
import Welcome from '../Screens/Welcome';
import Notifications from '../Screens/Notifications';
import {useApp} from '../Context/AppContext';

const Stack = createNativeStackNavigator();

export default function StackNavigation() {
  const {session, booting, profileStatus} = useApp();
  const [splashMinimumElapsed, setSplashMinimumElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashMinimumElapsed(true), 1300);
    return () => clearTimeout(timer);
  }, []);

  const startupReady = !booting && (!session || ['complete', 'missing', 'error'].includes(profileStatus));
  if (!splashMinimumElapsed || !startupReady) return <SplashScreen />;

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!session ? (
        <Stack.Screen name="Login" component={Login} />
      ) : profileStatus !== 'complete' ? (
        <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
      ) : (
        <Stack.Group>
          <Stack.Screen name="Welcome" component={Welcome} options={{animation: 'fade'}} />
          <Stack.Screen name="Main" component={HomeBottomTabs} options={{animation: 'none'}} />
          <Stack.Screen name="Notifications" component={Notifications} options={{animation: 'slide_from_right'}} />
          <Stack.Screen name="AIChat" component={AIChat} options={{animation: 'slide_from_right'}} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
