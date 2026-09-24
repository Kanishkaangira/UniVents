import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeBottomTabs from './HomeBottomTabs';

const Stack = createNativeStackNavigator();

export default function StackNavigation() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {/* Add <Stack.Screen name="Login" component={Login} /> above when you build login */}
      <Stack.Screen name="Main" component={HomeBottomTabs} />
    </Stack.Navigator>
  );
}
