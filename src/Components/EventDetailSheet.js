import React, {useState} from 'react';
import {Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import BottomSheet from './BottomSheet';
import PrimaryButton from './PrimaryButton';
import {colors, gradients} from '../Constants/theme';
import {useApp} from '../Context/AppContext';
import {fmtDateTime} from '../Services/mappers';

export default function EventDetailSheet({event, visible, onClose}) {
  const [fullImage, setFullImage] = useState(false);
  const [registering, setRegistering] = useState(false);
  const {registered, saved, departments, clubs, registerForEvent, toggleSave} = useApp();
  if (!event) return null;

  const closeDetails = () => {
    setFullImage(false);
    onClose();
  };
  const isReg = !!registered[event.id];
  const isSaved = !!saved[event.id];
  const department = event.departmentId ? departments.find(item => item.id === event.departmentId) : null;
  const club = event.clubId ? clubs.find(item => item.id === event.clubId) : null;
  const scopeLabel = event.organizerScope === 'department'
    ? department?.code || department?.name
    : event.organizerScope === 'club'
      ? club?.code || club?.name
      : null;
  const organizerLabel = scopeLabel || event.org;
  const open = event.status === 'upcoming' || event.status === 'live';
  const closed = !open || (event.deadline && event.deadline < new Date());
  const handleRegistration = async () => {
    if (registering) return;
    setRegistering(true);
    try {
      const didRegister = await registerForEvent(event.id);
      if (didRegister) Alert.alert('Registration complete', 'Your details have been saved for this event.');
    } catch (error) {
      Alert.alert('Could not update registration', error.message || 'Please try again.');
    } finally {
      setRegistering(false);
    }
  };
  const infoItems = [
    {icon: 'calendar-outline', label: 'DATE', value: event.date, color: '#087E80', background: '#E8F8F6'},
    {icon: 'time-outline', label: 'TIME', value: event.time, color: '#B05D08', background: '#FFF3E4'},
    {icon: 'location-outline', label: 'LOCATION', value: event.venue || 'To be announced', color: '#087E80', background: '#E8F8F6'},
  ];
  const eventStatusStyle = {
    upcoming: styles.upcomingStatus,
    live: styles.liveStatus,
    completed: styles.completedStatus,
    cancelled: styles.cancelledStatus,
  }[event.status] || styles.upcomingStatus;

  return (
    <>
      <BottomSheet visible={visible && !fullImage} onClose={closeDetails} maxHeight="95%" handleColor="#0F9B8E" prominentHandle interactiveHandle>
        <View style={styles.posterWrap}>
          {event.imageUrl ? (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="View event image full screen" activeOpacity={0.95} onPress={() => setFullImage(true)}>
              <Image source={{uri: event.imageUrl}} style={styles.poster} resizeMode="contain" />
              <View style={styles.expandHint}><Icon name="expand-outline" size={15} color="#fff" /></View>
            </TouchableOpacity>
          ) : (
            <LinearGradient colors={gradients[event.grad]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={[styles.poster, styles.center]}>
              <Text style={styles.fallbackEmoji}>{event.emoji}</Text>
            </LinearGradient>
          )}
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={isSaved ? 'Unsave event' : 'Save event'} style={styles.heart} onPress={() => toggleSave(event.id)}>
            <Icon name={isSaved ? 'heart' : 'heart-outline'} size={18} color={isSaved ? '#FF5A3C' : colors.mute} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleBlock}>
          <View style={styles.titleAccent} />
          <Text style={styles.title}>{event.title}</Text>
        </View>
        <View style={styles.tags}>
          {!!organizerLabel && <View style={styles.organizerTag}><Icon name={event.organizerScope === 'club' ? 'people-outline' : 'business-outline'} size={13} color="#087E80" /><Text style={styles.organizerText} numberOfLines={1}>{organizerLabel}</Text></View>}
          {!!event.category && <View style={styles.categoryTag}><Icon name="pricetag-outline" size={13} color="#9D5107" /><Text style={styles.categoryText}>{event.category}</Text></View>}
          <View style={[styles.eventStatusTag, eventStatusStyle]}><View style={[styles.statusDot, event.status === 'live' && styles.statusDotLive]} /><Text style={[styles.eventStatusText, event.status === 'live' && styles.liveStatusText, event.status === 'cancelled' && styles.cancelledStatusText, event.status === 'completed' && styles.completedStatusText]}>{event.status || 'upcoming'}</Text></View>
        </View>

        <View style={styles.info}>
          {infoItems.map(({icon, label, value, color, background}) => (
            <View key={label} style={styles.infoTile}>
              <View style={[styles.infoTileAccent, {backgroundColor: color}]} />
              <View style={styles.infoTileContent}>
                <View style={[styles.infoIcon, {backgroundColor: background}]}><Icon name={icon} size={18} color={color} /></View>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue} numberOfLines={3}>{value}</Text>
              </View>
            </View>
          ))}
        </View>

        {!!event.desc && (
          <View style={styles.descriptionBox}>
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>{event.desc}</Text>
          </View>
        )}

        {event.registrationRequired ? (
          <>
            <View style={styles.registrationBox}>
              <View style={styles.registrationHeading}>
                <View style={styles.registrationIcon}><Icon name="ticket-outline" size={17} color="#087E80" /></View>
                <View style={styles.registrationHeadingText}>
                  <Text style={styles.sectionTitle}>Registration required</Text>
                  <Text style={styles.registrationHint}>Reserve your place for this event</Text>
                </View>
                <View style={[styles.registrationState, closed && styles.registrationStateClosed]}>
                  <Text style={[styles.registrationStateText, closed && styles.registrationStateTextClosed]}>{closed ? 'Closed' : 'Open'}</Text>
                </View>
              </View>
              <View style={styles.registrationDetail}><Text style={styles.registrationLabel}>Closes</Text><Text style={styles.registrationValue}>{event.deadline ? fmtDateTime(event.deadline) : 'Soon'}</Text></View>
              {!!event.capacity && <View style={styles.registrationDetail}><Text style={styles.registrationLabel}>Capacity</Text><Text style={styles.registrationValue}>{event.capacity} participants</Text></View>}
            </View>
            {closed ? (
              <PrimaryButton label="Registration closed" variant="soft" onPress={() => {}} />
            ) : (
              <PrimaryButton label={registering ? 'Saving registration…' : isReg ? 'You’re registered' : 'Register now'} variant={isReg ? 'success' : 'primary'} onPress={handleRegistration} disabled={registering || isReg} />
            )}
          </>
        ) : (
          <View style={styles.walkInBox}><Icon name="checkmark-circle-outline" size={19} color="#087E80" /><Text style={styles.walkInText}>No registration needed · Just walk in</Text></View>
        )}
      </BottomSheet>

      {event.imageUrl && (
        <Modal visible={fullImage} transparent={false} animationType="fade" statusBarTranslucent onRequestClose={() => setFullImage(false)}>
          <View style={styles.fullImageScreen}>
            <Image source={{uri: event.imageUrl}} style={styles.fullImage} resizeMode="contain" />
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close full-screen image" onPress={() => setFullImage(false)} style={styles.fullImageClose}>
              <Icon name="close" size={23} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  posterWrap: {marginBottom: 14},
  poster: {height: 210, borderRadius: 22, width: '100%', backgroundColor: '#F5F6FA'},
  fallbackEmoji: {fontSize: 62},
  expandHint: {position: 'absolute', right: 10, bottom: 10, width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,22,50,0.55)'},
  fullImageScreen: {flex: 1, backgroundColor: '#080911', justifyContent: 'center', alignItems: 'center'},
  fullImage: {width: '100%', height: '100%'},
  fullImageClose: {position: 'absolute', top: 44, right: 18, width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(35,37,54,0.75)'},
  center: {alignItems: 'center', justifyContent: 'center'},
  heart: {position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center'},
  titleBlock: {flexDirection: 'row', alignItems: 'stretch', gap: 10, marginBottom: 10, paddingRight: 4},
  titleAccent: {width: 4, borderRadius: 4, backgroundColor: '#0F9B8E'},
  title: {flex: 1, fontSize: 23, lineHeight: 29, fontWeight: '900', color: colors.ink, letterSpacing: -0.4},
  tags: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 1},
  organizerTag: {maxWidth: '55%', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E8F8F6', borderWidth: 1, borderColor: '#C9EFEB', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 11},
  organizerText: {flexShrink: 1, fontSize: 10.5, fontWeight: '800', color: '#087E80'},
  categoryTag: {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF5E9', borderWidth: 1, borderColor: '#F7E2C5', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 11},
  categoryText: {fontSize: 10.5, fontWeight: '800', color: '#9D5107'},
  eventStatusTag: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 11},
  upcomingStatus: {backgroundColor: '#E8F8F6', borderWidth: 1, borderColor: '#C9EFEB'},
  liveStatus: {backgroundColor: '#087E80'},
  completedStatus: {backgroundColor: '#EEF0F4', borderWidth: 1, borderColor: '#DDE1E8'},
  cancelledStatus: {backgroundColor: '#FFF0EC', borderWidth: 1, borderColor: '#F8D2C9'},
  statusDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: '#087E80'},
  statusDotLive: {backgroundColor: '#fff'},
  eventStatusText: {fontSize: 10, fontWeight: '900', color: '#087E80', textTransform: 'capitalize'},
  liveStatusText: {color: '#fff'},
  cancelledStatusText: {color: colors.danger},
  completedStatusText: {color: '#596174'},
  info: {flexDirection: 'row', gap: 9, marginTop: 16},
  infoTile: {flex: 1, minHeight: 128, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E7EAF1', borderRadius: 18, overflow: 'hidden', shadowColor: '#25334A', shadowOpacity: 0.06, shadowRadius: 9, shadowOffset: {width: 0, height: 4}, elevation: 2},
  infoTileAccent: {height: 3, width: '100%'},
  infoTileContent: {padding: 10, alignItems: 'flex-start'},
  infoIcon: {width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10},
  infoLabel: {fontSize: 9, fontWeight: '900', letterSpacing: 0.8, color: colors.mute},
  infoValue: {fontSize: 11.5, lineHeight: 16, fontWeight: '800', color: colors.ink, marginTop: 5},
  descriptionBox: {backgroundColor: '#F8F9FD', borderRadius: 16, padding: 14, marginTop: 15},
  sectionTitle: {fontSize: 13, fontWeight: '800', color: colors.ink},
  description: {fontSize: 13, lineHeight: 20, color: colors.mute, marginTop: 7},
  registrationBox: {backgroundColor: '#F8F9FD', borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, marginTop: 14, marginBottom: 12, gap: 10},
  registrationHeading: {flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 2},
  registrationHeadingText: {flex: 1},
  registrationHint: {fontSize: 10.5, color: colors.mute, marginTop: 2},
  registrationState: {backgroundColor: '#E8F8F6', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5},
  registrationStateClosed: {backgroundColor: '#FFF0EC'},
  registrationStateText: {fontSize: 9, fontWeight: '800', color: '#087E80'},
  registrationStateTextClosed: {color: colors.danger},
  registrationIcon: {width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F8F6'},
  registrationDetail: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8},
  registrationLabel: {fontSize: 11, color: colors.mute},
  registrationValue: {fontSize: 12, fontWeight: '700', color: colors.ink, flexShrink: 1, textAlign: 'right'},
  walkInBox: {backgroundColor: '#E8F8F6', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, marginTop: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8},
  walkInText: {fontSize: 12, fontWeight: '700', color: '#087E80'},
});
