import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../Constants/theme';

const ICONS = {
  Home: ['home-outline', 'home'],
  Events: ['calendar-outline', 'calendar'],
  Notice: ['document-text-outline', 'document-text'],
  Profile: ['person-outline', 'person'],
};

// Custom floating bottom bar – plugged in via <Tab.Navigator tabBar={...} />
export default function FloatingTabBar({state, navigation}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, {bottom: Math.max(insets.bottom, 12) + 4}]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const [off, on] = ICONS[route.name];
        const onPress = () => {
          const e = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
          if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
        };
        const content = (
          <>
            <Icon name={focused ? on : off} size={22} color={focused ? '#fff' : '#9AA0BE'} />
            {focused && <Text style={styles.label}>{route.name}</Text>}
          </>
        );
        return (
          <TouchableOpacity key={route.key} activeOpacity={0.85} onPress={onPress}>
            {focused ? (
              <LinearGradient colors={[colors.primary, colors.primary2]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={[styles.pill, styles.active]}>
                {content}
              </LinearGradient>
            ) : (
              <View style={styles.pill}>
                {content}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: 8, shadowColor: '#3C3296', shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: {width: 0, height: 12}, elevation: 14},
  pill: {height: 46, paddingHorizontal: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 7},
  active: {shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width: 0, height: 6}, elevation: 6},
  label: {color: '#fff', fontSize: 13, fontWeight: '700'},
});
