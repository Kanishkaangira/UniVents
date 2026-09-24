import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, shadow} from '../Constants/theme';

// marked: { [dayNumber]: true } -> shows a dot under days that have events
export default function MiniCalendar({year, month, marked, selected, today, onSelect}) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({length: days}, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {'SMTWTFS'.split('').map((d, i) => (
          <Text key={i} style={styles.week}>{d}</Text>
        ))}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((d, c) =>
            d ? (
              <TouchableOpacity
                key={c}
                onPress={() => onSelect(d)}
                style={[styles.cell, d === today && styles.today, d === selected && styles.sel]}>
                <Text style={[styles.num, d === selected && {color: '#fff'}]}>{d}</Text>
                {marked[d] && <View style={[styles.dot, d === selected && {backgroundColor: '#fff'}]} />}
              </TouchableOpacity>
            ) : (
              <View key={c} style={styles.cell} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {backgroundColor: '#fff', borderRadius: 24, padding: 12, marginBottom: 18, ...shadow, shadowOpacity: 0.08},
  row: {flexDirection: 'row'},
  week: {flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.mute, paddingBottom: 6},
  cell: {flex: 1, height: 38, margin: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center'},
  num: {fontSize: 13, fontWeight: '600', color: colors.ink},
  today: {borderWidth: 1.5, borderColor: colors.primary},
  sel: {backgroundColor: colors.primary},
  dot: {position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent},
});
