import React from 'react';
import {RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../Constants/theme';

// Common page wrapper: background, top glow, safe-area padding, space for the floating tab bar,
// optional pull-to-refresh
export default function Screen({children, refreshing, onRefresh}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <LinearGradient colors={['#DDD8FF', colors.bg]} style={styles.glow} />
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
  glow: {position: 'absolute', top: 0, left: 0, right: 0, height: 260},
});
