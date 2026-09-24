import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors} from '../Constants/theme';

// items: [{key, label}]  – horizontal selectable chips (faculties, clubs ...)
export default function ChipRow({items, value, onChange}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 14, marginHorizontal: -18}} contentContainerStyle={{paddingHorizontal: 18, gap: 8}}>
      {items.map(item => {
        const on = item.key === value;
        return (
          <TouchableOpacity key={item.key} activeOpacity={0.85} onPress={() => onChange(item.key)}>
            {on ? (
              <LinearGradient colors={[colors.primary, colors.primary2]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.chip}>
                <Text style={[styles.txt, {color: '#fff'}]}>{item.label}</Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.chip, styles.off, styles.txt]}>{item.label}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {paddingHorizontal: 15, paddingVertical: 8, borderRadius: 99, overflow: 'hidden'},
  off: {backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.line},
  txt: {fontSize: 12.5, fontWeight: '700', color: colors.ink},
});
