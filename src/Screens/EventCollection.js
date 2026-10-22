import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../Components/Screen';
import EventCard from '../Components/EventCard';
import EventDetailSheet from '../Components/EventDetailSheet';
import { colors } from '../Constants/theme';
import { useApp } from '../Context/AppContext';

const pad = value => String(value).padStart(2, '0');

export default function EventCollection({ navigation, route }) {
  const { events, registered, saved, toggleSave, loading, error, refresh } =
    useApp();
  const [selected, setSelected] = useState(null);
  const filter =
    route.params?.filter === 'registered' ? 'registered' : 'upcoming';
  const isRegistered = filter === 'registered';
  const title = isRegistered ? 'Your registered events' : 'Upcoming events';
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
    today.getDate(),
  )}`;
  const collection = useMemo(
    () =>
      events.filter(event =>
        isRegistered
          ? !!registered[event.id]
          : ['upcoming', 'live'].includes(event.status) &&
            event.dateISO &&
            event.dateISO >= todayKey,
      ),
    [events, isRegistered, registered, todayKey],
  );

  return (
    <>
      <Screen refreshing={false} onRefresh={refresh}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.75}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={21} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>UNIVENTS · EVENTS</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{collection.length}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          {isRegistered
            ? 'Events you registered for with your account.'
            : 'Find something exciting happening on campus.'}
        </Text>

        {error ? (
          <View style={styles.emptyState}>
            <Icon name="cloud-offline-outline" size={30} color={colors.mute} />
            <Text style={styles.emptyTitle}>Could not load events</Text>
            <Text style={styles.emptyMessage}>{error}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={refresh}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : loading && collection.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : collection.length > 0 ? (
          collection.map(event => (
            <EventCard
              key={event.id}
              item={event}
              large
              saved={!!saved[event.id]}
              onToggleSave={() => toggleSave(event.id)}
              onPress={() => setSelected(event)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon
              name={isRegistered ? 'ticket-outline' : 'calendar-clear-outline'}
              size={32}
              color={colors.primary}
            />
            <Text style={styles.emptyTitle}>
              {isRegistered
                ? 'No registered events yet'
                : 'No upcoming events right now'}
            </Text>
            <Text style={styles.emptyMessage}>
              {isRegistered
                ? 'When you register for an event, it will appear here.'
                : 'Check back soon for new campus events.'}
            </Text>
          </View>
        )}
      </Screen>

      <EventDetailSheet
        event={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.primary,
    marginBottom: 3,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.6,
  },
  countBadge: {
    minWidth: 35,
    height: 35,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFEDFF',
  },
  countText: { fontSize: 13, fontWeight: '900', color: colors.primary },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.mute,
    marginBottom: 17,
    marginLeft: 54,
  },
  loader: { marginTop: 36 },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyMessage: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.mute,
    textAlign: 'center',
    marginTop: 5,
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  retryText: { fontSize: 12, fontWeight: '800', color: '#fff' },
});
