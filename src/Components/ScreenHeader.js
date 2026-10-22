import React, {useRef} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppLogo from './AppLogo';
import {colors, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

// brand=true -> logo + app name + bell (Home). Otherwise -> small title block (other screens)
export default function ScreenHeader({title, subtitle, brand, feed, onBellPress}) {
  const {unreadCount} = useApp();
  const bellMotion = useRef(new Animated.Value(1)).current;
  const animateBell = toValue => Animated.spring(bellMotion, {
    toValue,
    speed: 28,
    bounciness: 5,
    useNativeDriver: true,
  }).start();
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
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : 'Open notifications'}
          activeOpacity={1}
          onPressIn={() => animateBell(0.9)}
          onPressOut={() => animateBell(1)}
          style={styles.bellTouch}
          onPress={onBellPress}>
          <Animated.View style={[styles.bell, {transform: [{scale: bellMotion}]}]}>
            <Icon name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={20} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  }
  if (feed) {
    return (
      <View style={styles.feedRow}>
        <View style={styles.feedCopy}>
          <Text style={styles.feedSubtitle}>{subtitle}</Text>
          <Text style={styles.feedTitle}>{title}</Text>
        </View>
        <AppLogo size={42} />
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
  feedRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 2},
  feedCopy: {gap: 2, paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: colors.primary},
  feedSubtitle: {fontSize: 9, fontWeight: '800', color: colors.primary, letterSpacing: 1.1, textTransform: 'uppercase'},
  feedTitle: {fontSize: 27, lineHeight: 32, fontWeight: '900', color: colors.ink, letterSpacing: -0.8},
  brand: {flexDirection: 'row', alignItems: 'center', gap: 10},
  name: {fontSize: 19, fontWeight: '800', color: colors.ink, letterSpacing: -0.4},
  tagline: {fontSize: 11, fontWeight: '600', color: colors.mute},
  bellTouch: {borderRadius: 17},
  bell: {width: 46, height: 46, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E4FF', alignItems: 'center', justifyContent: 'center', ...shadow, shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: {width: 0, height: 3}, elevation: 3},
  badge: {position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#F05C78', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  badgeText: {fontSize: 8, lineHeight: 10, fontWeight: '900', color: '#fff'},
  sub: {fontSize: 13, fontWeight: '600', color: colors.mute},
  title: {fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.5},
});
