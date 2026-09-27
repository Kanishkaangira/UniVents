import React, {useEffect, useRef} from 'react';
import {ActivityIndicator, Animated, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppLogo from './AppLogo';
import {colors} from '../Constants/theme';

export default function SplashScreen() {
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [appear]);

  return (
    <LinearGradient colors={['#FFFFFF', colors.bg]} style={styles.root}>
      <View pointerEvents="none" style={styles.orb} />
      <Animated.View
        style={[
          styles.brand,
          {
            opacity: appear,
            transform: [{scale: appear.interpolate({inputRange: [0, 1], outputRange: [0.92, 1]})}],
          },
        ]}>
        <AppLogo size={92} />
        <Text style={styles.title}>UniVents</Text>
        <Text style={styles.tagline}>Your campus, connected.</Text>
      </Animated.View>
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Getting things ready</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  orb: {position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#E7E8FF', opacity: 0.55, top: -150, right: -125},
  brand: {alignItems: 'center', marginTop: -28},
  title: {fontSize: 34, fontWeight: '800', color: colors.ink, marginTop: 18, letterSpacing: -0.8},
  tagline: {fontSize: 14, fontWeight: '500', color: colors.mute, marginTop: 5},
  loading: {position: 'absolute', bottom: 62, alignItems: 'center', gap: 10},
  loadingText: {fontSize: 12, fontWeight: '600', color: colors.mute, letterSpacing: 0.2},
});
