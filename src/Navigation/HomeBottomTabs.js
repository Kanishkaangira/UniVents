import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import FloatingTabBar from '../Components/FloatingTabBar';
import Home from '../Screens/Home';
import Events from '../Screens/Events';
import Notice from '../Screens/Notice';
import Profile from '../Screens/Profile';

const Tab = createBottomTabNavigator();

export default function HomeBottomTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Events" component={Events} />
      <Tab.Screen name="Notice" component={Notice} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
