import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Animated, Easing, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../Components/Screen';
import ScreenHeader from '../Components/ScreenHeader';
import SectionHeader from '../Components/SectionHeader';
import MiniCalendar from '../Components/MiniCalendar';
import EventCard from '../Components/EventCard';
import EventDetailSheet from '../Components/EventDetailSheet';
import {colors, gradients, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

const pad = n => String(n).padStart(2, '0');

export default function Home({navigation}) {
  const {profile, events, registered, saved, toggleSave, loading, refreshing, refresh} = useApp();
  const now = new Date();
  const [cursor, setCursor] = useState({year: now.getFullYear(), month: now.getMonth()});
  const [day, setDay] = useState(now.getDate());
  const [selected, setSelected] = useState(null);
  const welcomeMotion = useRef(new Animated.Value(0)).current;
  const welcomePulse = useRef(new Animated.Value(0)).current;
  const summaryMotions = useMemo(() => [new Animated.Value(0), new Animated.Value(0)], []);
  const livePulse = useRef(new Animated.Value(0)).current;
  const mascotMotion = useRef(new Animated.Value(0)).current;

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
  const displayName = profile?.user_name?.trim() || 'there';

  useEffect(() => {
    Animated.spring(welcomeMotion, {toValue: 1, tension: 58, friction: 9, useNativeDriver: true}).start();
    const summaryEntrance = Animated.stagger(105, summaryMotions.map(value => Animated.spring(value, {
      toValue: 1,
      speed: 16,
      bounciness: 8,
      useNativeDriver: true,
    })));
    summaryEntrance.start();
    return () => {
      welcomeMotion.stopAnimation();
      summaryEntrance.stop();
      summaryMotions.forEach(value => value.stopAnimation());
    };
  }, [welcomeMotion, summaryMotions]);

  useEffect(() => {
    const pulseLoop = live ? Animated.loop(Animated.sequence([
      Animated.timing(livePulse, {toValue: 1, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      Animated.timing(livePulse, {toValue: 0, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
    ])) : null;
    livePulse.setValue(0);
    pulseLoop?.start();
    return () => {
      pulseLoop?.stop();
      livePulse.stopAnimation();
    };
  }, [live, livePulse]);

  useEffect(() => {
    const orbLoop = Animated.loop(Animated.sequence([
      Animated.timing(welcomePulse, {toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      Animated.timing(welcomePulse, {toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
    ]));
    orbLoop.start();
    return () => {
      orbLoop.stop();
      welcomePulse.stopAnimation();
    };
  }, [welcomePulse]);

  useEffect(() => {
    const mascotLoop = Animated.loop(Animated.sequence([
      Animated.timing(mascotMotion, {toValue: 1, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      Animated.timing(mascotMotion, {toValue: 0, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
    ]));
    mascotLoop.start();
    return () => {
      mascotLoop.stop();
      mascotMotion.stopAnimation();
    };
  }, [mascotMotion]);

  const welcomeTranslate = welcomeMotion.interpolate({inputRange: [0, 1], outputRange: [22, 0]});
  const welcomeScale = welcomeMotion.interpolate({inputRange: [0, 1], outputRange: [0.975, 1]});
  const orbScale = welcomePulse.interpolate({inputRange: [0, 1], outputRange: [0.92, 1.12]});
  const liveScale = livePulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.65]});
  const liveDotOpacity = livePulse.interpolate({inputRange: [0, 1], outputRange: [1, 0.48]});
  const mascotTranslate = mascotMotion.interpolate({inputRange: [0, 1], outputRange: [1, -3]});

  return (
    <>
      <Screen refreshing={refreshing} onRefresh={refresh} bubbles>
        <ScreenHeader brand onBellPress={() => navigation.navigate('Notifications')} />

        <View style={styles.userGreeting}>
          <View style={styles.greetingMeta}>
            <Icon name="sunny-outline" size={13} color={colors.primary} />
            <Text style={styles.userGreetingLabel}>{greeting.toUpperCase()}</Text>
            <View style={styles.greetingMetaDot} />
            <Text style={styles.greetingMetaCaption}>WELCOME BACK</Text>
          </View>
          <Text style={styles.userGreetingName} numberOfLines={2}>{displayName}</Text>
          <View style={styles.greetingFooter}>
            <LinearGradient colors={['#5548D9', '#9D8BFF']} style={styles.nameAccent} />
            <Text style={styles.userGreetingHint}>Your campus day starts here.</Text>
          </View>
        </View>

        <Animated.View style={[styles.welcomeCard, {transform: [{translateY: welcomeTranslate}, {scale: welcomeScale}]}]}>
          <LinearGradient colors={['#4338CA', '#6257E9', '#8979F4']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.welcomeGradient}>
            <Animated.View pointerEvents="none" style={[styles.welcomeOrb, {transform: [{scale: orbScale}]}]} />
            <View style={styles.welcomeTop}>
              <View style={styles.greetingBadge}><Icon name="sparkles" size={13} color="#FFF0B8" /><Text style={styles.greetingBadgeText}>CAMPUS, CONNECTED</Text></View>
              <View style={styles.campusBadge}><Icon name="people-outline" size={15} color="#fff" /></View>
            </View>
            <View style={styles.welcomeBottom}>
              <Text style={styles.welcomeSubtitle}>Find events, notices and your campus community.</Text>
              <View style={styles.campusPill}><Icon name="arrow-forward" size={12} color="#FFE7A8" /><Text style={styles.campusPillText}>EXPLORE</Text></View>
            </View>
          </LinearGradient>
        </Animated.View>

        {loading && !events.length && <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />}

        {live && (
          <LinearGradient colors={gradients.brand} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.hero}>
            <View style={styles.circle} />
            <View style={styles.live}>
              <View style={styles.liveDotWrap}><Animated.View style={[styles.liveDotPulse, {opacity: liveDotOpacity, transform: [{scale: liveScale}]}]} /><View style={styles.liveDot} /></View>
              <Text style={styles.liveTxt}>HAPPENING NOW</Text>
            </View>
            <Text style={styles.heroTitle}>{live.title}</Text>
            <Text style={styles.heroSub}>{live.org} · {live.venue} · {live.time}</Text>
            <TouchableOpacity style={styles.heroBtn} onPress={() => setSelected(live)}>
              <Text style={styles.heroBtnTxt}>View details</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        <View style={styles.campusStats}>
          <Animated.View style={[styles.summaryCardWrap, {
            opacity: summaryMotions[0],
            transform: [
              {perspective: 700},
              {rotateY: summaryMotions[0].interpolate({inputRange: [0, 1], outputRange: ['-14deg', '0deg']})},
              {scale: summaryMotions[0].interpolate({inputRange: [0, 1], outputRange: [0.88, 1]})},
              {translateY: summaryMotions[0].interpolate({inputRange: [0, 1], outputRange: [14, 0]})},
            ],
          }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${upcomingEvents.length} upcoming events`}
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('Events')}
            style={[styles.countSummary, styles.eventCountCard]}>
            <LinearGradient pointerEvents="none" colors={['#F5F2FF', '#E8E4FF']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
            <View pointerEvents="none" style={styles.summaryOrb} />
            <View style={[styles.summaryIcon, styles.eventSummaryIcon]}><Icon name="calendar-outline" size={16} color="#5A50D6" /></View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryNumber}>{upcomingEvents.length}</Text>
              <Text style={styles.summaryLabel}>UPCOMING EVENTS</Text>
            </View>
          </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.summaryCardWrap, {
            opacity: summaryMotions[1],
            transform: [
              {perspective: 700},
              {rotateY: summaryMotions[1].interpolate({inputRange: [0, 1], outputRange: ['14deg', '0deg']})},
              {scale: summaryMotions[1].interpolate({inputRange: [0, 1], outputRange: [0.88, 1]})},
              {translateY: summaryMotions[1].interpolate({inputRange: [0, 1], outputRange: [14, 0]})},
            ],
          }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${registeredEvents.length} events you are going to`}
            activeOpacity={0.7}
            onPress={() => registeredEvents[0] ? setSelected(registeredEvents[0]) : navigation.getParent()?.navigate('Events')}
            style={[styles.countSummary, styles.registeredCountCard]}>
            <LinearGradient pointerEvents="none" colors={['#F3F0FF', '#E4E0FF']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
            <View pointerEvents="none" style={styles.summaryOrb} />
            <View style={[styles.summaryIcon, styles.registeredSummaryIcon]}><Icon name="ticket-outline" size={16} color="#5A50D6" /></View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryNumber}>{registeredEvents.length}</Text>
              <Text style={styles.summaryLabel}>REGISTERED EVENTS</Text>
            </View>
          </TouchableOpacity>
          </Animated.View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open UniVents AI chat and ask about campus events"
          activeOpacity={0.88}
          style={styles.aiPrompt}
          onPress={() => navigation.getParent()?.navigate('AIChat')}>
          <Animated.View style={[styles.aiMascotWrap, {transform: [{translateY: mascotTranslate}]}]}>
            <LinearGradient colors={['#6759E8', '#8E7AF3']} style={styles.aiMascotBody}>
              <View style={styles.aiMascotAntenna}><View style={styles.aiAntennaDot} /></View>
              <View style={styles.aiMascotFace}>
                <View style={styles.aiMascotEye} />
                <View style={styles.aiMascotEye} />
                <View style={styles.aiMascotSmile} />
              </View>
              <View style={styles.aiMascotCheekLeft} />
              <View style={styles.aiMascotCheekRight} />
              <View style={styles.aiMascotBadge}><Icon name="sparkles" size={9} color="#FFD477" /></View>
            </LinearGradient>
          </Animated.View>
          <View style={styles.aiChatContent}>
            <View style={styles.aiPromptHeader}><View style={styles.aiOnlineDot} /><Text style={styles.aiPromptEyebrow}>UNIVENTS AI</Text></View>
            <View style={styles.aiComposerPreview}>
              <Text style={styles.aiPlaceholder}>Ask AI about campus events...</Text>
              <View style={styles.aiSendPreview}><Icon name="arrow-up" size={14} color="#fff" /></View>
            </View>
          </View>
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
  userGreeting: {marginTop: 3, marginBottom: 15, paddingHorizontal: 3},
  greetingMeta: {flexDirection: 'row', alignItems: 'center', gap: 6},
  userGreetingLabel: {fontSize: 9, lineHeight: 13, fontWeight: '900', letterSpacing: 1.05, color: colors.primary},
  greetingMetaDot: {width: 3, height: 3, borderRadius: 2, backgroundColor: '#B2AECF', marginHorizontal: 1},
  greetingMetaCaption: {fontSize: 8, fontWeight: '800', letterSpacing: 0.75, color: '#989BB0'},
  userGreetingName: {fontSize: 32, lineHeight: 38, fontWeight: '900', color: colors.ink, letterSpacing: -1.15, marginTop: 4},
  greetingFooter: {flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4},
  nameAccent: {width: 24, height: 3, borderRadius: 2},
  userGreetingHint: {fontSize: 10, lineHeight: 14, fontWeight: '600', color: colors.mute},
  welcomeCard: {marginBottom: 17, borderRadius: 22, ...shadow, shadowColor: '#342078', shadowOpacity: 0.18, shadowRadius: 13, elevation: 4},
  loadingIndicator: {marginVertical: 20},
  welcomeGradient: {borderRadius: 22, overflow: 'hidden', paddingHorizontal: 16, paddingTop: 13, paddingBottom: 13, minHeight: 100},
  welcomeOrb: {position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -94, right: -57, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)'},
  welcomeTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  greetingBadge: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.16)'},
  greetingBadgeText: {fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.9},
  campusBadge: {width: 33, height: 33, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)'},
  welcomeBottom: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 11},
  welcomeSubtitle: {flex: 1, fontSize: 10.5, fontWeight: '600', color: 'rgba(255,255,255,0.86)', marginRight: 8},
  campusPill: {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.13)'},
  campusPillText: {fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.7},
  hero: {borderRadius: 26, padding: 20, marginBottom: 20, overflow: 'hidden', ...shadow, shadowColor: colors.primary, shadowOpacity: 0.35},
  circle: {position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.13)', right: -40, top: -40},
  live: {flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99},
  liveDotWrap: {width: 10, height: 10, alignItems: 'center', justifyContent: 'center'},
  liveDotPulse: {position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF9C85'},
  liveDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent},
  liveTxt: {color: '#fff', fontSize: 11, fontWeight: '700'},
  heroTitle: {color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 14, marginBottom: 4},
  heroSub: {color: 'rgba(255,255,255,0.92)', fontSize: 13, marginBottom: 16},
  heroBtn: {alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14},
  heroBtnTxt: {color: colors.primary, fontSize: 13, fontWeight: '800'},
  campusStats: {flexDirection: 'row', alignItems: 'stretch', gap: 10, marginBottom: 17},
  summaryCardWrap: {flex: 1},
  countSummary: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 9, minHeight: 72, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 10, borderWidth: 1, overflow: 'hidden', borderColor: '#DDD7FF', ...shadow, shadowColor: '#7668D8', shadowOpacity: 0.10, shadowRadius: 9, elevation: 3},
  eventCountCard: {backgroundColor: '#F2EEFF'},
  registeredCountCard: {backgroundColor: '#ECE9FF'},
  summaryOrb: {position: 'absolute', width: 60, height: 60, borderRadius: 30, right: -26, top: -31, backgroundColor: 'rgba(255,255,255,0.48)'},
  summaryIcon: {width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)'},
  eventSummaryIcon: {backgroundColor: 'rgba(255,255,255,0.62)'},
  registeredSummaryIcon: {backgroundColor: 'rgba(255,255,255,0.62)'},
  summaryCopy: {alignItems: 'flex-start', gap: 1},
  summaryNumber: {fontSize: 21, lineHeight: 23, fontWeight: '900', letterSpacing: -0.5, color: colors.ink},
  summaryLabel: {fontSize: 7.2, lineHeight: 10, fontWeight: '900', letterSpacing: 0.45, color: colors.mute},
  aiPrompt: {flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FFFDF9', borderWidth: 1, borderColor: '#EEE8FF', borderRadius: 20, padding: 10, marginBottom: 22, ...shadow, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3},
  aiMascotWrap: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center'},
  aiMascotBody: {width: 43, height: 43, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#5147D9', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: {width: 0, height: 3}, elevation: 3},
  aiMascotAntenna: {position: 'absolute', width: 2, height: 7, backgroundColor: '#BDB5FF', top: -5, alignItems: 'center'},
  aiAntennaDot: {position: 'absolute', top: -4, width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFB86B', borderWidth: 1.5, borderColor: '#fff'},
  aiMascotFace: {flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 1},
  aiMascotEye: {width: 4, height: 6, borderRadius: 3, backgroundColor: '#fff'},
  aiMascotSmile: {position: 'absolute', width: 8, height: 5, borderBottomWidth: 1.5, borderColor: '#fff', borderRadius: 6, left: 14, top: 10},
  aiMascotCheekLeft: {position: 'absolute', left: 8, top: 27, width: 6, height: 4, borderRadius: 3, backgroundColor: 'rgba(255,177,190,0.7)'},
  aiMascotCheekRight: {position: 'absolute', right: 8, top: 27, width: 6, height: 4, borderRadius: 3, backgroundColor: 'rgba(255,177,190,0.7)'},
  aiMascotBadge: {position: 'absolute', right: -5, top: -5, width: 19, height: 19, borderRadius: 7, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.08},
  aiChatContent: {flex: 1, gap: 6},
  aiPromptHeader: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 3},
  aiOnlineDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#19B78B'},
  aiPromptEyebrow: {fontSize: 8, fontWeight: '900', letterSpacing: 0.8, color: colors.primary},
  aiComposerPreview: {minHeight: 39, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DED9FF', borderRadius: 14, paddingLeft: 11, paddingRight: 5, paddingVertical: 4},
  aiPlaceholder: {flex: 1, fontSize: 10, fontWeight: '600', color: '#989DB4'},
  aiSendPreview: {width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary},
  empty: {backgroundColor: '#fff', borderRadius: 18, padding: 18, alignItems: 'center'},
  emptyTxt: {color: colors.mute, fontWeight: '600'},
});
