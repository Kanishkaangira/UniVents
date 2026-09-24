import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppLogo from './AppLogo';
import {colors, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

// brand=true -> logo + app name + bell (Home). Otherwise -> small title block (other screens)
export default function ScreenHeader({title, subtitle, brand}) {
  const {unreadCount} = useApp();
  if (brand) {
    return (
      <View style={styles.row}>
        <View style={styles.brand}>
          <AppLogo size={44} />
          <View>
            <Text style={styles.name}>UniVents</Text>
            <Text style={styles.tagline}>Every event. Every notice.</Text>
          </View>
        </View>
        <View style={styles.bell}>
          <Icon name="notifications-outline" size={20} color={colors.ink} />
          {unreadCount > 0 && <View style={styles.dot} />}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.sub}>{subtitle}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <AppLogo size={40} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18},
  brand: {flexDirection: 'row', alignItems: 'center', gap: 10},
  name: {fontSize: 19, fontWeight: '800', color: colors.ink, letterSpacing: -0.4},
  tagline: {fontSize: 11, fontWeight: '600', color: colors.mute},
  bell: {width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow},
  dot: {position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent, borderWidth: 2, borderColor: '#fff'},
  sub: {fontSize: 13, fontWeight: '600', color: colors.mute},
  title: {fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.5},
});
