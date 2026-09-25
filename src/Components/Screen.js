import React from 'react';
import {RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../Constants/theme';

// Common page wrapper: background, top glow, safe-area padding, space for the floating tab bar,
// optional pull-to-refresh
export default function Screen({children, refreshing, onRefresh, bubbles = true}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#E6E2FF', '#F0F0FC', colors.bg]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      {bubbles && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.bubble, styles.bubbleOne]} />
          <View style={[styles.bubble, styles.bubbleTwo]} />
          <View style={[styles.bubble, styles.bubbleThree]} />
        </View>
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
        contentContainerStyle={{paddingTop: insets.top + 12, paddingHorizontal: 18, paddingBottom: 130}}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  bubble: {position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)'},
  bubbleOne: {width: 235, height: 235, top: 78, right: -125, backgroundColor: '#E1DCFF'},
  bubbleTwo: {width: 185, height: 185, top: 340, left: -103, backgroundColor: '#DDF5F1'},
  bubbleThree: {width: 250, height: 250, bottom: 45, right: -140, backgroundColor: '#FFE9DD'},
});
