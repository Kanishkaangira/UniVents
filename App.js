import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppProvider} from './src/Context/AppContext';
import StackNavigation from './src/Navigation/StackNavigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <NavigationContainer>
          <StackNavigation />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
