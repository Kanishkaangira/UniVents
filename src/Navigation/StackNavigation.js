import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeBottomTabs from './HomeBottomTabs';
import Login from '../Screens/Login';
import ProfileSetup from '../Screens/ProfileSetup';
import AIChat from '../Screens/AIChat';
import {useApp} from '../Context/AppContext';
import {colors} from '../Constants/theme';

const Stack = createNativeStackNavigator();

export default function StackNavigation() {
  const {session, booting, profileStatus} = useApp();

  if (booting) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg}}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (session && !['complete', 'missing', 'error'].includes(profileStatus)) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg}}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!session ? (
        <Stack.Screen name="Login" component={Login} />
      ) : profileStatus !== 'complete' ? (
        <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
      ) : (
        <Stack.Group>
          <Stack.Screen name="Main" component={HomeBottomTabs} />
          <Stack.Screen name="AIChat" component={AIChat} options={{animation: 'slide_from_right'}} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
