import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {colors, shadow} from '../Constants/theme';
import {MONTHS} from '../Services/mappers';

// marked: { [dayNumber]: true } -> dot under days that have events
// today: day number if the shown month is the current month, else null
export default function MiniCalendar({year, month, marked, selected, today, onSelect, onPrev, onNext}) {
  const eventDayCount = Object.keys(marked || {}).length;
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({length: days}, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <View style={styles.card}>
      <LinearGradient colors={['#4F46D8', '#7565F1', '#9378F5']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.headBanner}>
        <View pointerEvents="none" style={styles.bannerOrb} />
        <View style={styles.head}>
          <View style={styles.headingGroup}>
            <View style={styles.calendarIcon}><Icon name="calendar" size={18} color="#fff" /></View>
            <View>
              <Text style={styles.kicker}>YOUR CAMPUS PLAN</Text>
              <Text style={styles.month}>{MONTHS[month]} {year}</Text>
            </View>
          </View>
          <View style={styles.navigation}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous month" onPress={onPrev} style={styles.nav}><Icon name="chevron-back" size={18} color="#fff" /></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next month" onPress={onNext} style={styles.nav}><Icon name="chevron-forward" size={18} color="#fff" /></TouchableOpacity>
          </View>
        </View>
        <View style={styles.bannerFooter}>
          <Text style={styles.bannerHint}>Pick a day. Find your next thing.</Text>
          <View style={styles.eventCount}><View style={styles.eventCountDot} /><Text style={styles.eventCountText}>{eventDayCount} event {eventDayCount === 1 ? 'day' : 'days'}</Text></View>
        </View>
      </LinearGradient>
      <View style={styles.row}>
        {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((d, i) => <Text key={i} style={styles.week}>{d}</Text>)}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((d, c) =>
            d ? (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${MONTHS[month]} ${d}${d === today ? ', today' : ''}${marked[d] ? ', has events' : ''}`} accessibilityState={{selected: d === selected}} key={c} onPress={() => onSelect(d)} style={[styles.cell, d === today && styles.today, d === selected && styles.sel]}>
                <Text style={[styles.num, d === today && d !== selected && styles.todayNum, d === selected && styles.selectedNum]}>{d}</Text>
                {marked[d] && <View style={[styles.dot, d === selected && styles.selectedDot]} />}
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
  card: {backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 24, borderWidth: 1, borderColor: '#E8E7F5', padding: 7, marginBottom: 16, ...shadow, shadowOpacity: 0.09, shadowRadius: 13, elevation: 4},
  headBanner: {borderRadius: 18, paddingHorizontal: 11, paddingTop: 10, paddingBottom: 9, marginBottom: 8, overflow: 'hidden'},
  bannerOrb: {position: 'absolute', width: 135, height: 135, borderRadius: 68, right: -48, top: -74, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)'},
  head: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  headingGroup: {flexDirection: 'row', alignItems: 'center', gap: 10},
  calendarIcon: {width: 35, height: 35, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.19)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center'},
  kicker: {fontSize: 8, fontWeight: '900', letterSpacing: 1.15, color: 'rgba(255,255,255,0.78)', marginBottom: 2},
  month: {fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.25},
  bannerFooter: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8},
  bannerHint: {fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.85)'},
  eventCount: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.17)'},
  eventCountDot: {width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFD27A'},
  eventCountText: {fontSize: 8, fontWeight: '800', color: '#fff'},
  navigation: {flexDirection: 'row', gap: 7},
  nav: {width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center'},
  row: {flexDirection: 'row', paddingHorizontal: 3},
  week: {flex: 1, textAlign: 'center', fontSize: 8, fontWeight: '900', letterSpacing: 0.5, color: '#9295AE', paddingBottom: 5},
  cell: {flex: 1, height: 38, margin: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center'},
  num: {fontSize: 12, fontWeight: '700', color: colors.ink},
  today: {borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#F7F5FF'},
  todayNum: {color: colors.primary, fontWeight: '900'},
  sel: {backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: {width: 0, height: 2}, elevation: 2},
  selectedNum: {color: '#fff', fontWeight: '900'},
  dot: {position: 'absolute', bottom: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent},
  selectedDot: {backgroundColor: '#fff'},
});
