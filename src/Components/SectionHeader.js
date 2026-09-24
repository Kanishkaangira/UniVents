import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../Constants/theme';

export default function SectionHeader({title, note, onPress}) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {!!note && (
        <TouchableOpacity disabled={!onPress} onPress={onPress}>
          <Text style={[styles.note, onPress && {color: colors.primary}]}>{note}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 12},
  title: {fontSize: 17, fontWeight: '800', color: colors.ink},
  note: {fontSize: 12, fontWeight: '700', color: colors.mute},
});
