import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, shadow} from '../Constants/theme';

export default function StatTile({value, label, detail, icon, tint = colors.primary, tintBackground = colors.soft, onPress}) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      accessible
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}. ${detail || ''}`}
      activeOpacity={0.86}
      onPress={onPress}
      style={[styles.tile, {borderColor: tintBackground, backgroundColor: tintBackground}]}
    >
      <View style={styles.top}>
        <View style={[styles.iconBox, {backgroundColor: tintBackground}]}>
          <Icon name={icon} size={17} color={tint} />
        </View>
        <View style={styles.countPill}>
          <Text style={[styles.value, {color: tint}]}>{value}</Text>
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <Text style={styles.detail} numberOfLines={2}>{detail || 'View your campus activity'}</Text>
      </View>
      <View style={[styles.accent, {backgroundColor: tint}]} />
    </Container>
  );
}

const styles = StyleSheet.create({
  tile: {flex: 1, minHeight: 126, borderRadius: 20, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 12, justifyContent: 'space-between', overflow: 'hidden', ...shadow, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3},
  top: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  iconBox: {width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  countPill: {minWidth: 38, height: 34, paddingHorizontal: 9, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  value: {fontSize: 20, lineHeight: 24, fontWeight: '900'},
  copy: {marginTop: 10},
  label: {fontSize: 12, lineHeight: 16, fontWeight: '900', color: colors.ink},
  detail: {fontSize: 10, lineHeight: 14, fontWeight: '600', color: colors.mute, marginTop: 3},
  accent: {position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, borderTopRightRadius: 4, borderBottomRightRadius: 4},
});
