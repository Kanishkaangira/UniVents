import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import {colors, shadow} from '../Constants/theme';

export default function StatTile({value, label, onPress}) {
  return (
    <TouchableOpacity activeOpacity={0.85} disabled={!onPress} onPress={onPress} style={styles.tile}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {flex: 1, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 12, alignItems: 'center', ...shadow, shadowOpacity: 0.09},
  value: {fontSize: 22, fontWeight: '800', color: colors.primary},
  label: {fontSize: 11, fontWeight: '700', color: colors.mute, marginTop: 2},
});
