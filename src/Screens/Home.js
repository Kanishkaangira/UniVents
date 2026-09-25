import React, {useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../Components/Screen';
import ScreenHeader from '../Components/ScreenHeader';
import SectionHeader from '../Components/SectionHeader';
import StatTile from '../Components/StatTile';
import MiniCalendar from '../Components/MiniCalendar';
import EventCard from '../Components/EventCard';
import EventDetailSheet from '../Components/EventDetailSheet';
import {colors, gradients, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

const pad = n => String(n).padStart(2, '0');

export default function Home({navigation}) {
  const {profile, events, registered, saved, toggleSave, loading, refresh} = useApp();
  const now = new Date();
  const [cursor, setCursor] = useState({year: now.getFullYear(), month: now.getMonth()});
  const [day, setDay] = useState(now.getDate());
  const [selected, setSelected] = useState(null);

  const active = useMemo(() => events.filter(e => e.status === 'upcoming' || e.status === 'live'), [events]);
  const live = active.find(e => e.status === 'live');            // status = 'live'
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const upcomingEvents = active.filter(event => event.dateISO && event.dateISO >= todayKey);
  const registeredEvents = events.filter(event => registered[event.id]);

  // { 24: [events], 28: [events] ... } for the month shown in the calendar
  const byDay = useMemo(() => {
    const prefix = `${cursor.year}-${pad(cursor.month + 1)}-`;
    const map = {};
    events.forEach(e => {
      if (e.dateISO && e.dateISO.startsWith(prefix)) (map[+e.dateISO.slice(8, 10)] = map[+e.dateISO.slice(8, 10)] || []).push(e);
    });
    return map;
  }, [events, cursor]);
  const marked = useMemo(() => Object.fromEntries(Object.keys(byDay).map(d => [d, true])), [byDay]);
  const dayEvents = byDay[day] || [];
  const isThisMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth();

  const move = delta => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({year: d.getFullYear(), month: d.getMonth()});
    setDay(1);
  };

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <Screen refreshing={loading} onRefresh={refresh} bubbles>
        <ScreenHeader brand />

        <Text style={styles.hi}>{greeting},</Text>
        <Text style={styles.name}>{profile?.user_name || 'there'}</Text>

        {loading && !events.length && <ActivityIndicator color={colors.primary} style={{marginVertical: 20}} />}

        {live && (
          <LinearGradient colors={gradients.brand} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.hero}>
            <View style={styles.circle} />
            <View style={styles.live}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTxt}>HAPPENING NOW</Text>
            </View>
            <Text style={styles.heroTitle}>{live.title}</Text>
            <Text style={styles.heroSub}>{live.org} · {live.venue} · {live.time}</Text>
            <TouchableOpacity style={styles.heroBtn} onPress={() => setSelected(live)}>
              <Text style={styles.heroBtnTxt}>View details</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        <View style={styles.tiles}>
          <StatTile
            value={upcomingEvents.length}
            label="Upcoming Events"
            detail={upcomingEvents.length ? 'Open campus events to explore' : 'New events will appear here'}
            icon="calendar-outline"
            tint="#342078"
            tintBackground="#D5CBF4"
            onPress={() => navigation.getParent()?.navigate('Events')}
          />
          <StatTile
            value={registeredEvents.length}
            label="Registered Events"
            detail={registeredEvents.length ? 'Your event schedule' : 'Events you join will show here'}
            icon="ticket-outline"
            tint="#342078"
            tintBackground="#D5CBF4"
            onPress={() => registeredEvents[0] && setSelected(registeredEvents[0])}
          />
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Ask UniVents AI"
          activeOpacity={0.88}
          style={styles.aiPrompt}
          onPress={() => navigation.getParent()?.navigate('AIChat')}>
          <View style={styles.aiIcon}><Icon name="sparkles" size={19} color={colors.primary} /></View>
          <Text style={styles.aiPromptText}>Ask UniVents AI anything…</Text>
          <View style={styles.aiArrow}><Icon name="arrow-forward" size={17} color="#fff" /></View>
        </TouchableOpacity>

        <SectionHeader title="Calendar" />
        <MiniCalendar
          year={cursor.year}
          month={cursor.month}
          today={isThisMonth ? now.getDate() : null}
          selected={day}
          marked={marked}
          onSelect={setDay}
          onPrev={() => move(-1)}
          onNext={() => move(1)}
        />

        <SectionHeader title={isThisMonth && day === now.getDate() ? 'Today' : `${day} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][cursor.month]}`} note={`${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}`} />
        {dayEvents.length ? (
          dayEvents.map(item => (
            <EventCard key={item.id} item={item} large saved={!!saved[item.id]} onToggleSave={() => toggleSave(item.id)} onPress={() => setSelected(item)} />
          ))
        ) : (
          <View style={styles.empty}><Text style={styles.emptyTxt}>No events on this day 🎉</Text></View>
        )}
      </Screen>

      <EventDetailSheet event={selected} visible={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  hi: {fontSize: 13, fontWeight: '600', color: colors.mute},
  name: {fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.5, marginBottom: 14},
  hero: {borderRadius: 26, padding: 20, marginBottom: 20, overflow: 'hidden', ...shadow, shadowColor: colors.primary, shadowOpacity: 0.35},
  circle: {position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.13)', right: -40, top: -40},
  live: {flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99},
  liveDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent},
  liveTxt: {color: '#fff', fontSize: 11, fontWeight: '700'},
  heroTitle: {color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 14, marginBottom: 4},
  heroSub: {color: 'rgba(255,255,255,0.92)', fontSize: 13, marginBottom: 16},
  heroBtn: {alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14},
  heroBtnTxt: {color: colors.primary, fontSize: 13, fontWeight: '800'},
  tiles: {flexDirection: 'row', gap: 10, marginBottom: 20},
  aiPrompt: {flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E4E1FF', borderRadius: 18, padding: 10, marginBottom: 22, ...shadow, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3},
  aiIcon: {width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft},
  aiPromptText: {flex: 1, fontSize: 13, fontWeight: '600', color: '#9297B0'},
  aiArrow: {width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary},
  empty: {backgroundColor: '#fff', borderRadius: 18, padding: 18, alignItems: 'center'},
  emptyTxt: {color: colors.mute, fontWeight: '600'},
});
