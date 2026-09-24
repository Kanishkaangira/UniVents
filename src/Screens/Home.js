import React, {useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Screen from '../Components/Screen';
import ScreenHeader from '../Components/ScreenHeader';
import SectionHeader from '../Components/SectionHeader';
import StatTile from '../Components/StatTile';
import FeaturedCard from '../Components/FeaturedCard';
import MiniCalendar from '../Components/MiniCalendar';
import EventCard from '../Components/EventCard';
import EventDetailSheet from '../Components/EventDetailSheet';
import {DEMO_MONTH, EVENTS, flatten} from '../Data/data';
import {colors, gradients, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

export default function Home({navigation}) {
  const {profile, registered, saved, toggleSave, unreadCount, count} = useApp();
  const [day, setDay] = useState(DEMO_MONTH.today);
  const [selected, setSelected] = useState(null);

  const events = useMemo(() => flatten(EVENTS), []);
  const live = events.find(e => e.live);
  const featured = useMemo(() => ['u1', 'f2', 'u2', 'f8', 'c2'].map(id => events.find(e => e.id === id)), [events]);

  // { 24: [events], 28: [events] ... } for the demo month
  const byDay = useMemo(() => {
    const map = {};
    events.forEach(e => {
      const [d, mon] = e.date.split(' ');
      if (mon === 'Sep') (map[+d] = map[+d] || []).push(e);
    });
    return map;
  }, [events]);
  const marked = useMemo(() => Object.fromEntries(Object.keys(byDay).map(d => [d, true])), [byDay]);
  const dayEvents = byDay[day] || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <Screen>
        <ScreenHeader brand />

        <Text style={styles.hi}>{greeting},</Text>
        <Text style={styles.name}>{profile.name} 👋</Text>

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
          <StatTile value={events.length} label="📅 Upcoming" onPress={() => navigation.navigate('Events')} />
          <StatTile value={unreadCount} label="📢 Unread" onPress={() => navigation.navigate('Notice')} />
          <StatTile value={count(registered)} label="🎟️ Registered" onPress={() => navigation.navigate('Profile')} />
        </View>

        <SectionHeader title="Featured events" note="See all" onPress={() => navigation.navigate('Events')} />
        <FlatList
          horizontal
          data={featured}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          style={{marginHorizontal: -18, marginBottom: 18}}
          contentContainerStyle={{paddingHorizontal: 18, paddingVertical: 6, gap: 12}}
          renderItem={({item}) => <FeaturedCard item={item} onPress={() => setSelected(item)} />}
        />

        <SectionHeader title="Calendar" note={DEMO_MONTH.label} />
        <MiniCalendar
          year={DEMO_MONTH.year}
          month={DEMO_MONTH.month}
          today={DEMO_MONTH.today}
          selected={day}
          marked={marked}
          onSelect={setDay}
        />

        <SectionHeader title={day === DEMO_MONTH.today ? 'Today' : `${day} Sep`} note={`${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}`} />
        {dayEvents.length ? (
          dayEvents.map(item => (
            <EventCard key={item.id} item={item} saved={!!saved[item.id]} onToggleSave={() => toggleSave(item.id)} onPress={() => setSelected(item)} />
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
  empty: {backgroundColor: '#fff', borderRadius: 18, padding: 18, alignItems: 'center'},
  emptyTxt: {color: colors.mute, fontWeight: '600'},
});
