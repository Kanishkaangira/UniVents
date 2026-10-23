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
  const summaryMotions = useMemo(() => [new Animated.Value(0), new Animated.Value(0)], []);
  const summaryPressMotions = useMemo(() => [new Animated.Value(1), new Animated.Value(1)], []);
  const summaryArrowMotions = useMemo(() => [new Animated.Value(0), new Animated.Value(0)], []);
  const chatPressMotion = useRef(new Animated.Value(1)).current;
  const typingCursorMotion = useRef(new Animated.Value(1)).current;
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
  const greetingIcon = hour < 12 ? 'sunny-outline' : hour < 17 ? 'partly-sunny-outline' : 'moon-outline';
  const displayName = profile?.user_name?.trim() || 'there';
  const animateSummaryPress = (index, toValue) => {
    Animated.spring(summaryPressMotions[index], {
      toValue,
      speed: 28,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
    Animated.spring(summaryArrowMotions[index], {
      toValue: toValue < 1 ? 1 : 0,
      speed: 24,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const summaryEntrance = Animated.stagger(105, summaryMotions.map(value => Animated.spring(value, {
      toValue: 1,
      speed: 16,
      bounciness: 8,
      useNativeDriver: true,
    })));
    summaryEntrance.start();
    return () => {
      summaryEntrance.stop();
      summaryMotions.forEach(value => value.stopAnimation());
      summaryPressMotions.forEach(value => value.stopAnimation());
      summaryArrowMotions.forEach(value => value.stopAnimation());
      chatPressMotion.stopAnimation();
    };
  }, [summaryMotions, summaryPressMotions, summaryArrowMotions, chatPressMotion]);

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

  useEffect(() => {
    const cursorLoop = Animated.loop(Animated.sequence([
      Animated.timing(typingCursorMotion, {toValue: 0, duration: 550, useNativeDriver: true}),
      Animated.timing(typingCursorMotion, {toValue: 1, duration: 550, useNativeDriver: true}),
    ]));
    cursorLoop.start();
    return () => {
      cursorLoop.stop();
      typingCursorMotion.stopAnimation();
    };
  }, [typingCursorMotion]);

  const liveScale = livePulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.65]});
  const liveDotOpacity = livePulse.interpolate({inputRange: [0, 1], outputRange: [1, 0.48]});
  const mascotTranslate = mascotMotion.interpolate({inputRange: [0, 1], outputRange: [1, -3]});

  return (
    <>
      <Screen refreshing={refreshing} onRefresh={refresh} bubbles>
        <ScreenHeader brand onBellPress={() => navigation.navigate('Notifications')} />

        <View style={styles.userGreeting}>
          <View style={styles.greetingTop}>
            <Icon name={greetingIcon} size={21} color={colors.primary} />
            <View style={styles.greetingCopy}>
              <Text style={styles.userGreetingLabel}>{greeting},</Text>
              <Text style={styles.userGreetingName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{displayName}</Text>
            </View>
            <Icon name="sparkles" size={19} color="#8B7CF8" />
          </View>
          <Text style={styles.userGreetingHint}>Stay in the loop with campus events, notices, and plans for your day.</Text>
        </View>

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
            <Text style={styles.heroDescription}>Join the campus community and see what is happening right now.</Text>
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
            accessibilityHint="Opens the list of upcoming events"
            activeOpacity={1}
            onPressIn={() => animateSummaryPress(0, 0.96)}
            onPressOut={() => animateSummaryPress(0, 1)}
            onPress={() => navigation.getParent()?.navigate('EventCollection', {filter: 'upcoming'})}
            style={styles.countSummary}>
            <Animated.View style={[styles.summaryTileContent, {transform: [{scale: summaryPressMotions[0]}]}]}>
              <LinearGradient pointerEvents="none" colors={['#075E58', '#087E73', '#119A82']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
              <View pointerEvents="none" style={styles.summaryDecoration} />
              <View style={styles.summaryTopline}>
                <View style={styles.summaryIcon}>
                  <Icon name="calendar" size={18} color="#fff" />
                </View>
                <Animated.View style={[styles.summaryArrow, {transform: [{translateX: summaryArrowMotions[0]}]}]}>
                  <Icon name="arrow-forward" size={15} color="#fff" />
                </Animated.View>
              </View>
              <View style={styles.summaryDetails}>
                <Text style={styles.summaryLabel}>UPCOMING</Text>
                <View style={styles.summaryCountLine}>
                  <Text style={styles.summaryNumber}>{upcomingEvents.length}</Text>
                  <Text style={styles.summaryUnit}>events</Text>
                </View>
                <Text style={styles.summaryCaption}>Explore what is coming up on campus.</Text>
              </View>
            </Animated.View>
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
            accessibilityHint="Opens the events you registered for"
            activeOpacity={1}
            onPressIn={() => animateSummaryPress(1, 0.96)}
            onPressOut={() => animateSummaryPress(1, 1)}
            onPress={() => navigation.getParent()?.navigate('EventCollection', {filter: 'registered'})}
            style={styles.countSummary}>
            <Animated.View style={[styles.summaryTileContent, {transform: [{scale: summaryPressMotions[1]}]}]}>
              <LinearGradient pointerEvents="none" colors={['#075E58', '#087E73', '#119A82']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
              <View pointerEvents="none" style={[styles.summaryDecoration, styles.registeredDecoration]} />
              <View style={styles.summaryTopline}>
                <View style={styles.summaryIcon}>
                  <Icon name="ticket" size={18} color="#fff" />
                </View>
                <Animated.View style={[styles.summaryArrow, {transform: [{translateX: summaryArrowMotions[1]}]}]}>
                  <Icon name="arrow-forward" size={15} color="#fff" />
                </Animated.View>
              </View>
              <View style={styles.summaryDetails}>
                <Text style={styles.summaryLabel}>YOUR EVENTS</Text>
                <View style={styles.summaryCountLine}>
                  <Text style={styles.summaryNumber}>{registeredEvents.length}</Text>
                  <Text style={styles.summaryUnit}>registered</Text>
                </View>
                <Text style={styles.summaryCaption}>Keep track of the events you signed up for.</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
          </Animated.View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open UniVents AI chat and ask about campus events"
          activeOpacity={1}
          style={styles.aiPromptTouch}
          onPressIn={() => Animated.spring(chatPressMotion, {toValue: 0.97, speed: 26, bounciness: 4, useNativeDriver: true}).start()}
          onPressOut={() => Animated.spring(chatPressMotion, {toValue: 1, speed: 26, bounciness: 4, useNativeDriver: true}).start()}
          onPress={() => navigation.getParent()?.navigate('AIChat')}>
          <Animated.View style={[styles.aiPrompt, {transform: [{scale: chatPressMotion}]}]}>
            <View pointerEvents="none" style={styles.aiBackdropOrb} />
            <Animated.View style={[styles.aiMascotWrap, {transform: [{translateY: mascotTranslate}]}]}>
              <LinearGradient colors={['#998EFF', '#7565EA']} style={styles.aiMascotBody}>
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
              <View style={styles.aiPromptHeader}><View style={styles.aiOnlineDot} /><Text style={styles.aiPromptEyebrow}>YOUR CAMPUS AI</Text></View>
              <Text style={styles.aiTitle}>Your campus, answered</Text>
              <Text style={styles.aiDescription}>Ask about events, venues, notices, or what to expect at an event.</Text>
              <View style={styles.aiComposerPreview}>
                <Icon name="chatbubble-ellipses-outline" size={15} color="#85819B" />
                <Text numberOfLines={1} style={styles.aiPlaceholder}>
                  Try “What events are coming up?”<Animated.Text style={[styles.aiTypingCursor, {opacity: typingCursorMotion}]}>|</Animated.Text>
                </Text>
                <View pointerEvents="none" style={styles.aiSendPreview}>
                  <Icon name="arrow-up" size={15} color="#fff" />
                </View>
              </View>
            </View>
            <Icon name="sparkles" size={18} color="#A99FFF" style={styles.aiSparkle} />
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.sectionIntro}>
          <SectionHeader title="Explore the calendar" />
          <Text style={styles.sectionDescription}>Browse the month and tap a date to see what’s planned.</Text>
        </View>
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

        <View style={styles.daySectionHeading}>
          <View style={styles.dayHeadingCopy}>
            <SectionHeader title={isThisMonth && day === now.getDate() ? 'Today on campus' : `Events for ${day} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][cursor.month]}`} note={`${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}`} />
            <Text style={styles.sectionDescription}>{dayEvents.length ? 'Here’s what you can look forward to on this date.' : 'Choose another date to discover more campus activities.'}</Text>
          </View>
        </View>
        {dayEvents.length ? (
          dayEvents.map(item => (
            <EventCard key={item.id} item={item} large saved={!!saved[item.id]} onToggleSave={() => toggleSave(item.id)} onPress={() => setSelected(item)} />
          ))
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Icon name="calendar-clear-outline" size={20} color={colors.primary} /></View>
            <Text style={styles.emptyTitle}>A little breathing room</Text>
            <Text style={styles.emptyTxt}>There are no events on this date. Pick another day on the calendar to explore what’s happening.</Text>
          </View>
        )}
      </Screen>

      <EventDetailSheet event={selected} visible={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  userGreeting: {marginTop: 2, marginBottom: 18, paddingHorizontal: 3},
  greetingTop: {flexDirection: 'row', alignItems: 'center', gap: 11},
  greetingCopy: {flex: 1},
  userGreetingLabel: {fontSize: 13, lineHeight: 17, fontWeight: '700', color: colors.primary, letterSpacing: 0.1},
  userGreetingName: {fontSize: 27, lineHeight: 33, fontWeight: '900', color: colors.ink, letterSpacing: -0.9, marginTop: 1},
  userGreetingHint: {fontSize: 10.5, lineHeight: 15, fontWeight: '600', color: colors.mute, marginTop: 7},
  sectionIntro: {marginTop: 1},
  sectionDescription: {fontSize: 12, lineHeight: 17, fontWeight: '500', color: colors.mute, marginTop: -7, marginBottom: 12, paddingHorizontal: 1},
  daySectionHeading: {marginTop: 2},
  dayHeadingCopy: {width: '100%'},
  loadingIndicator: {marginVertical: 20},
  hero: {borderRadius: 26, padding: 20, marginBottom: 20, overflow: 'hidden', ...shadow, shadowColor: colors.primary, shadowOpacity: 0.35},
  circle: {position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.13)', right: -40, top: -40},
  live: {flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99},
  liveDotWrap: {width: 10, height: 10, alignItems: 'center', justifyContent: 'center'},
  liveDotPulse: {position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF9C85'},
  liveDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent},
  liveTxt: {color: '#fff', fontSize: 11, fontWeight: '700'},
  heroTitle: {color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 14, marginBottom: 4},
  heroSub: {color: 'rgba(255,255,255,0.92)', fontSize: 13, marginBottom: 16},
  heroDescription: {color: 'rgba(255,255,255,0.88)', fontSize: 12, lineHeight: 17, fontWeight: '500', maxWidth: 280, marginTop: -8, marginBottom: 14},
  heroBtn: {alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14},
  heroBtnTxt: {color: colors.primary, fontSize: 13, fontWeight: '800'},
  campusStats: {flexDirection: 'row', alignItems: 'stretch', gap: 11, marginBottom: 17, paddingVertical: 7},
  summaryCardWrap: {flex: 1},
  countSummary: {flex: 1, minHeight: 124, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', ...shadow, shadowColor: '#075E58', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: {width: 0, height: 5}, elevation: 5},
  summaryTileContent: {flex: 1, minHeight: 124, justifyContent: 'space-between', padding: 12, overflow: 'hidden'},
  summaryDecoration: {position: 'absolute', width: 94, height: 94, borderRadius: 47, top: -38, right: -27, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)'},
  registeredDecoration: {},
  summaryTopline: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  summaryIcon: {width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.17)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)'},
  summaryArrow: {width: 27, height: 27, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.23)'},
  summaryDetails: {alignItems: 'flex-start'},
  summaryCountLine: {flexDirection: 'row', alignItems: 'baseline', gap: 5},
  summaryNumber: {fontSize: 28, lineHeight: 31, fontWeight: '900', letterSpacing: -0.9, color: '#fff'},
  summaryUnit: {fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.86)'},
  summaryLabel: {fontSize: 9, lineHeight: 12, fontWeight: '900', letterSpacing: 1.1, color: 'rgba(255,255,255,0.9)'},
  summaryCaption: {fontSize: 10, lineHeight: 14, fontWeight: '600', marginTop: 2, color: 'rgba(255,255,255,0.86)'},
  aiPromptTouch: {borderRadius: 22, marginBottom: 22},
  aiPrompt: {minHeight: 148, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden', backgroundColor: '#FFFDF9', borderWidth: 1, borderColor: '#E8E3FF', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 15, ...shadow, shadowColor: '#5147D9', shadowOpacity: 0.1, shadowRadius: 11, shadowOffset: {width: 0, height: 4}, elevation: 3},
  aiBackdropOrb: {position: 'absolute', width: 155, height: 155, borderRadius: 78, top: -100, right: -48, borderWidth: 1, borderColor: 'rgba(116,99,225,0.12)', backgroundColor: 'rgba(116,99,225,0.045)'},
  aiMascotWrap: {width: 54, height: 58, alignItems: 'center', justifyContent: 'center'},
  aiMascotBody: {width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', shadowColor: '#181044', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: {width: 0, height: 4}, elevation: 4},
  aiMascotAntenna: {position: 'absolute', width: 2, height: 7, backgroundColor: '#D0C9FF', top: -5, alignItems: 'center'},
  aiAntennaDot: {position: 'absolute', top: -4, width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFB86B', borderWidth: 1.5, borderColor: '#fff'},
  aiMascotFace: {flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 1},
  aiMascotEye: {width: 4, height: 6, borderRadius: 3, backgroundColor: '#fff'},
  aiMascotSmile: {position: 'absolute', width: 8, height: 5, borderBottomWidth: 1.5, borderColor: '#fff', borderRadius: 6, left: 14, top: 10},
  aiMascotCheekLeft: {position: 'absolute', left: 8, top: 27, width: 6, height: 4, borderRadius: 3, backgroundColor: 'rgba(255,177,190,0.7)'},
  aiMascotCheekRight: {position: 'absolute', right: 8, top: 27, width: 6, height: 4, borderRadius: 3, backgroundColor: 'rgba(255,177,190,0.7)'},
  aiMascotBadge: {position: 'absolute', right: -5, top: -5, width: 19, height: 19, borderRadius: 7, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.08},
  aiChatContent: {flex: 1, alignItems: 'stretch', gap: 3, paddingVertical: 2},
  aiPromptHeader: {flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 1},
  aiOnlineDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#63F2BC'},
  aiPromptEyebrow: {fontSize: 8, fontWeight: '900', letterSpacing: 1, color: colors.primary},
  aiTitle: {fontSize: 16, lineHeight: 20, fontWeight: '900', letterSpacing: -0.3, color: colors.ink},
  aiDescription: {fontSize: 11, lineHeight: 15, fontWeight: '500', color: colors.mute, marginTop: 1},
  aiComposerPreview: {minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6, paddingLeft: 10, paddingRight: 5, paddingVertical: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD8F2', borderRadius: 13, shadowColor: '#5648B0', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: {width: 0, height: 2}, elevation: 1},
  aiPlaceholder: {flex: 1, minWidth: 0, fontSize: 10, fontWeight: '600', color: '#85819B'},
  aiTypingCursor: {fontSize: 12, lineHeight: 14, fontWeight: '500', color: colors.primary},
  aiSendPreview: {width: 30, height: 30, flexShrink: 0, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary},
  aiSparkle: {position: 'absolute', top: 15, right: 17},
  empty: {backgroundColor: '#fff', borderWidth: 1, borderColor: '#E7E5F2', borderRadius: 20, paddingHorizontal: 22, paddingVertical: 24, alignItems: 'center', ...shadow, shadowColor: '#4A4775', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: {width: 0, height: 3}, elevation: 2},
  emptyIcon: {width: 44, height: 44, borderRadius: 15, backgroundColor: '#EEECFF', alignItems: 'center', justifyContent: 'center', marginBottom: 11},
  emptyTitle: {color: colors.ink, fontSize: 15, fontWeight: '800', marginBottom: 5},
  emptyTxt: {color: colors.mute, fontSize: 12, lineHeight: 18, fontWeight: '500', textAlign: 'center'},
});
