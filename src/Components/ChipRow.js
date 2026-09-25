import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors} from '../Constants/theme';

// items: [{key, label}]  – horizontal selectable chips (faculties, clubs ...)
export default function ChipRow({items, value, onChange, flush = false}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.row, flush && styles.flushRow]} contentContainerStyle={[styles.content, flush && styles.flushContent]}>
      {items.map(item => {
        const on = item.key === value;
        return (
          <TouchableOpacity
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{selected: on}}
            hitSlop={4}
            activeOpacity={0.75}
            onPress={() => onChange(item.key)}>
            {on ? (
              <LinearGradient colors={[colors.primary, colors.primary2]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.chip}>
                <Text style={[styles.txt, {color: '#fff'}]}>{item.label}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.chip, styles.off]}>
                <Text style={styles.txt}>{item.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {marginBottom: 14, marginHorizontal: -18},
  content: {paddingHorizontal: 18, gap: 8, alignItems: 'center'},
  flushRow: {marginHorizontal: 0, marginBottom: 0},
  flushContent: {paddingHorizontal: 0, paddingVertical: 2},
  chip: {minHeight: 38, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 11, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'},
  off: {backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line},
  txt: {fontSize: 11.5, fontWeight: '700', color: colors.ink},
});
