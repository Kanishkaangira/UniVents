import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Animated, Easing, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../Components/Screen';
import ScreenHeader from '../Components/ScreenHeader';
import {fetchEventNotifications} from '../Services/api';
import {colors, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

const formatDate = value => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
};

const formatTime = value => {
  if (!value) return null;
  const [hour, minute] = value.split(':');
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});
};

export default function Notifications({navigation}) {
  const {profile} = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const emptyMotion = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    if (!profile?.user_type) {
      setItems([]);
      setLoading(false);
      setError('Complete your profile to see event notifications.');
      return;
    }
    setError('');
    try {
      setItems(await fetchEventNotifications(profile.user_type));
    } catch (loadError) {
      setError(loadError.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.user_type]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (items.length || loading || error) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(emptyMotion, {toValue: 1, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      Animated.timing(emptyMotion, {toValue: 0, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
    ]));
    loop.start();
    return () => loop.stop();
  }, [emptyMotion, items.length, loading, error]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ScreenHeader title="Notifications" subtitle="Your campus, in the loop" />
      <View style={styles.intro}>
        <View style={styles.introIcon}><Icon name="notifications" size={19} color={colors.primary} /></View>
        <View style={styles.introCopy}>
          <Text style={styles.introTitle}>Fresh from campus</Text>
          <Text style={styles.introText}>Newly approved events, all in one place.</Text>
        </View>
        <Text style={styles.count}>{items.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.stateCard}>
          <View style={styles.stateIcon}><Icon name="cloud-offline-outline" size={28} color={colors.primary} /></View>
          <Text style={styles.stateTitle}>Couldn’t load notifications</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
        </View>
      ) : items.length ? (
        items.map(item => {
          const date = formatDate(item.event_date);
          const time = formatTime(item.start_time);
          const details = [date, time, item.venue].filter(Boolean).join('  ·  ');
          return (
            <TouchableOpacity key={item.id} activeOpacity={0.88} onPress={() => navigation.navigate('Main', {screen: 'Events'})} style={styles.card}>
              <View style={styles.notificationMark}><Icon name="notifications" size={18} color={colors.primary} /></View>
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={styles.liveText}>NEW EVENT</Text>
                  <Text style={styles.published}>{formatDate(String(item.published_at || '').slice(0, 10)) || 'Just added'}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                {details ? <View style={styles.detailRow}><Icon name="calendar-outline" size={14} color={colors.primary} /><Text numberOfLines={1} style={styles.detailText}>{details}</Text></View> : null}
                {item.organizer_name ? <Text numberOfLines={1} style={styles.organizer}>By {item.organizer_name}</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyArt}>
              <Animated.View style={[styles.orbit, {transform: [{scale: emptyMotion.interpolate({inputRange: [0, 1], outputRange: [0.92, 1.08]})}, {rotate: emptyMotion.interpolate({inputRange: [0, 1], outputRange: ['-10deg', '10deg']})}]}]} />
              <View style={styles.emptyIcon}><Icon name="notifications-outline" size={31} color={colors.primary} /></View>
              <Animated.View style={[styles.sparkle, {opacity: emptyMotion.interpolate({inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5]})}]}><Icon name="sparkles" size={16} color={colors.accent} /></Animated.View>
            </View>
            <Text style={styles.emptyEyebrow}>YOU'RE ALL CAUGHT UP</Text>
            <Text style={styles.stateTitle}>It's quiet for now</Text>
            <Text style={styles.stateText}>When a new event gets approved, its details will pop up here. Keep an eye out for your next campus moment.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Main', {screen: 'Events'})} style={styles.retryButton}><Text style={styles.retryText}>Explore events</Text><Icon name="arrow-forward" size={15} color="#fff" /></TouchableOpacity>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#F3F1FF', borderWidth: 1, borderColor: '#E8E4FF', padding: 13, borderRadius: 18, marginBottom: 14},
  introIcon: {width: 40, height: 40, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  introCopy: {flex: 1}, introTitle: {fontSize: 13, fontWeight: '800', color: colors.ink}, introText: {fontSize: 10, lineHeight: 15, color: colors.mute, marginTop: 2},
  count: {minWidth: 27, textAlign: 'center', overflow: 'hidden', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 5, backgroundColor: '#fff', color: colors.primary, fontSize: 11, fontWeight: '800'},
  loader: {marginTop: 52},
  card: {flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 13, marginBottom: 10, ...shadow, shadowOpacity: 0.06},
  notificationMark: {width: 40, height: 40, borderRadius: 14, backgroundColor: '#F0EDFF', alignItems: 'center', justifyContent: 'center'},
  cardContent: {flex: 1, minWidth: 0},
  cardTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8},
  liveText: {fontSize: 8, letterSpacing: 0.7, fontWeight: '900', color: colors.primary}, published: {fontSize: 9, fontWeight: '600', color: colors.mute},
  cardTitle: {fontSize: 16, lineHeight: 22, fontWeight: '800', color: colors.ink}, message: {fontSize: 11, lineHeight: 17, color: colors.mute, marginTop: 4},
  detailRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10}, detailText: {flex: 1, fontSize: 10, fontWeight: '700', color: colors.ink}, organizer: {fontSize: 10, fontWeight: '600', color: colors.primary, marginTop: 8},
  emptyWrap: {paddingTop: 24}, emptyCard: {alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 24, ...shadow, shadowOpacity: 0.07},
  emptyArt: {width: 100, height: 92, alignItems: 'center', justifyContent: 'center', marginBottom: 10}, orbit: {position: 'absolute', width: 82, height: 82, borderRadius: 50, borderWidth: 1, borderColor: '#E3DEFF', backgroundColor: '#F8F6FF'}, emptyIcon: {width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFECFF'}, sparkle: {position: 'absolute', right: 5, top: 3},
  emptyEyebrow: {fontSize: 8, fontWeight: '900', letterSpacing: 1.4, color: colors.primary, marginBottom: 8}, stateCard: {alignItems: 'center', paddingHorizontal: 22, paddingVertical: 36}, stateIcon: {width: 62, height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1EFFF', marginBottom: 12}, stateTitle: {fontSize: 17, fontWeight: '800', color: colors.ink, textAlign: 'center'}, stateText: {fontSize: 11, lineHeight: 18, color: colors.mute, textAlign: 'center', marginTop: 7},
  retryButton: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.primary, borderRadius: 13, paddingHorizontal: 15, paddingVertical: 10, marginTop: 16}, retryText: {fontSize: 11, fontWeight: '800', color: '#fff'},
});
