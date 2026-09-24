import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import BottomSheet from './BottomSheet';
import PrimaryButton from './PrimaryButton';
import {colors, gradients} from '../Constants/theme';
import {useApp} from '../Context/AppContext';
import {fmtDateTime} from '../Services/mappers';

export default function EventDetailSheet({event, visible, onClose}) {
  const {registered, saved, toggleRegister, toggleSave} = useApp();
  if (!event) return null;
  const isReg = !!registered[event.id];
  const isSaved = !!saved[event.id];
  const open = event.status === 'upcoming' || event.status === 'live';
  const closed = !open || (event.deadline && event.deadline < new Date());

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.posterWrap}>
        {event.imageUrl ? (
          <Image source={{uri: event.imageUrl}} style={styles.poster} resizeMode="cover" />
        ) : (
          <LinearGradient colors={gradients[event.grad]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={[styles.poster, styles.center]}>
            <Text style={{fontSize: 62}}>{event.emoji}</Text>
          </LinearGradient>
        )}
        <View style={styles.pill}><Text style={styles.pillTxt}>📅 {event.date}</Text></View>
        {event.status !== 'upcoming' && (
          <View style={[styles.pill, {left: undefined, right: 56, backgroundColor: event.status === 'cancelled' ? colors.danger : colors.accent}]}>
            <Text style={[styles.pillTxt, {color: '#fff'}]}>{event.status.toUpperCase()}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.heart} onPress={() => toggleSave(event.id)}>
          <Icon name={isSaved ? 'heart' : 'heart-outline'} size={18} color={isSaved ? '#FF5A3C' : colors.mute} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{event.title}</Text>
      <View style={styles.tags}>
        <Text style={styles.tag}>{event.org}</Text>
        <Text style={styles.tag}>{event.category}</Text>
      </View>

      <View style={styles.info}>
        {[['📅', event.date, 'Date'], ['🕒', event.time.split(' –')[0], 'Time'], ['📍', event.venue, 'Venue']].map(([icon, val, label]) => (
          <View key={label} style={styles.tile}>
            <Text style={{fontSize: 18}}>{icon}</Text>
            <Text style={styles.tileVal}>{val}</Text>
            <Text style={styles.tileLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.desc}>{event.desc}</Text>

      {event.registrationRequired ? (
        <>
          <View style={styles.regBox}>
            <Text style={styles.regTxt}>Registration closes {event.deadline ? fmtDateTime(event.deadline) : 'soon'}</Text>
            {!!event.capacity && <Text style={styles.regTxt}>Capacity: {event.capacity} participants</Text>}
          </View>
          {closed ? (
            <PrimaryButton label="Registration closed" variant="soft" onPress={() => {}} />
          ) : (
            <PrimaryButton
              label={isReg ? '✓ Registered – tap to cancel' : 'Register now'}
              variant={isReg ? 'success' : 'primary'}
              onPress={() => toggleRegister(event.id)}
            />
          )}
        </>
      ) : (
        <View style={styles.regBox}><Text style={styles.regTxt}>✅ No registration needed – just walk in</Text></View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  posterWrap: {marginBottom: 14},
  poster: {height: 160, borderRadius: 22, width: '100%'},
  center: {alignItems: 'center', justifyContent: 'center'},
  pill: {position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99},
  pillTxt: {fontSize: 11.5, fontWeight: '700', color: colors.ink},
  heart: {position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 6},
  tags: {flexDirection: 'row', gap: 6},
  tag: {fontSize: 10.5, fontWeight: '700', color: colors.primary, backgroundColor: colors.soft, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, overflow: 'hidden'},
  info: {flexDirection: 'row', gap: 8, marginTop: 14},
  tile: {flex: 1, backgroundColor: '#F5F6FD', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center'},
  tileVal: {fontSize: 12, fontWeight: '700', color: colors.ink, marginTop: 3, textAlign: 'center'},
  tileLabel: {fontSize: 10.5, fontWeight: '600', color: colors.mute},
  desc: {fontSize: 13, lineHeight: 20, color: colors.mute, marginVertical: 14},
  regBox: {backgroundColor: '#F5F6FD', borderRadius: 14, padding: 13, marginBottom: 12, gap: 4},
  regTxt: {fontSize: 12.5, fontWeight: '700', color: colors.ink},
});
