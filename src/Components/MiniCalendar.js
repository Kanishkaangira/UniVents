import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, shadow} from '../Constants/theme';
import {MONTHS} from '../Services/mappers';

// marked: { [dayNumber]: true } -> dot under days that have events
// today: day number if the shown month is the current month, else null
export default function MiniCalendar({year, month, marked, selected, today, onSelect, onPrev, onNext}) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({length: days}, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headingGroup}>
          <View style={styles.calendarIcon}><Icon name="calendar" size={18} color={colors.primary} /></View>
          <View>
            <Text style={styles.kicker}>EVENT CALENDAR</Text>
            <Text style={styles.month}>{MONTHS[month]} {year}</Text>
          </View>
        </View>
        <View style={styles.navigation}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous month" onPress={onPrev} style={styles.nav}><Icon name="chevron-back" size={18} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next month" onPress={onNext} style={styles.nav}><Icon name="chevron-forward" size={18} color={colors.primary} /></TouchableOpacity>
        </View>
      </View>
      <View style={styles.row}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => <Text key={i} style={styles.week}>{d}</Text>)}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((d, c) =>
            d ? (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${MONTHS[month]} ${d}`} key={c} onPress={() => onSelect(d)} style={[styles.cell, d === today && styles.today, d === selected && styles.sel]}>
                <Text style={[styles.num, d === today && d !== selected && styles.todayNum, d === selected && styles.selectedNum]}>{d}</Text>
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
  card: {backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 24, borderWidth: 1, borderColor: '#E7E3FA', padding: 14, marginBottom: 18, ...shadow, shadowOpacity: 0.09, shadowRadius: 13, elevation: 4},
  head: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15},
  headingGroup: {flexDirection: 'row', alignItems: 'center', gap: 10},
  calendarIcon: {width: 40, height: 40, borderRadius: 13, backgroundColor: '#F0EDFF', alignItems: 'center', justifyContent: 'center'},
  kicker: {fontSize: 8, fontWeight: '900', letterSpacing: 1, color: '#77729A', marginBottom: 2},
  month: {fontSize: 15, fontWeight: '900', color: colors.ink},
  navigation: {flexDirection: 'row', gap: 7},
  nav: {width: 34, height: 34, borderRadius: 12, backgroundColor: '#F4F2FF', borderWidth: 1, borderColor: '#E8E4FA', alignItems: 'center', justifyContent: 'center'},
  row: {flexDirection: 'row'},
  week: {flex: 1, textAlign: 'center', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.3, color: '#898DA7', paddingBottom: 7},
  cell: {flex: 1, height: 42, margin: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  num: {fontSize: 12.5, fontWeight: '700', color: colors.ink},
  today: {borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#F7F5FF'},
  todayNum: {color: colors.primary, fontWeight: '900'},
  sel: {backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.24, shadowRadius: 5, shadowOffset: {width: 0, height: 2}, elevation: 3},
  selectedNum: {color: '#fff', fontWeight: '900'},
  dot: {position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent},
});
