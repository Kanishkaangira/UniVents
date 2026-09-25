import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, gradients} from '../Constants/theme';
import LinearGradient from 'react-native-linear-gradient';

const TAB_ICONS = {University: 'globe-outline', Departments: 'business-outline', Clubs: 'people-outline'};

export default function SegmentTabs({tabs, value, onChange}) {
  return (
    <View style={styles.wrap}>
      {tabs.map(tab => {
        const on = tab === value;
        return (
          <TouchableOpacity
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{selected: on}}
            hitSlop={3}
            activeOpacity={0.78}
            style={styles.tab}
            onPress={() => onChange(tab)}>
            {on ? (
              <LinearGradient colors={gradients.brand} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.tabFace}>
                <View style={styles.activeIcon}><Icon name={TAB_ICONS[tab] || 'apps-outline'} size={14} color="#fff" /></View>
                <Text style={[styles.txt, styles.activeTxt]} numberOfLines={1}>{tab}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabFace}>
                <View style={styles.inactiveIcon}><Icon name={TAB_ICONS[tab] || 'apps-outline'} size={14} color={colors.mute} /></View>
                <Text style={styles.txt} numberOfLines={1}>{tab}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flexDirection: 'row', backgroundColor: 'rgba(242,240,255,0.85)', borderRadius: 17, padding: 4, marginBottom: 10},
  tab: {flex: 1, minWidth: 0, minHeight: 46, paddingHorizontal: 2},
  tabFace: {flex: 1, minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 4},
  activeIcon: {width: 23, height: 23, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center'},
  inactiveIcon: {width: 23, height: 23, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  txt: {fontSize: 10, fontWeight: '700', color: colors.mute, flexShrink: 1},
  activeTxt: {color: '#fff'},
});
