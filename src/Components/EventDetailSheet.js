import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import BottomSheet from './BottomSheet';
import PrimaryButton from './PrimaryButton';
import {colors, gradients} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

export default function EventDetailSheet({event, visible, onClose}) {
  const {registered, saved, toggleRegister, toggleSave} = useApp();
  if (!event) return null;
  const isReg = !!registered[event.id];
  const isSaved = !!saved[event.id];
  const filled = event.seats + (isReg ? 1 : 0);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <LinearGradient colors={gradients[event.grad]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.poster}>
        <View style={styles.pill}><Text style={styles.pillTxt}>📅 {event.date}</Text></View>
        <TouchableOpacity style={styles.heart} onPress={() => toggleSave(event.id)}>
          <Icon name={isSaved ? 'heart' : 'heart-outline'} size={18} color={isSaved ? '#FF5A3C' : colors.mute} />
        </TouchableOpacity>
        <Text style={{fontSize: 62}}>{event.emoji}</Text>
      </LinearGradient>

      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.tag}>{event.org}</Text>

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

      <View style={styles.seatRow}>
        <Text style={styles.seatTxt}>{filled} of 200 registered</Text>
        <Text style={styles.seatTxt}>{200 - filled} spots left</Text>
      </View>
      <View style={styles.bar}>
        <LinearGradient colors={[colors.primary, colors.accent]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{width: `${filled / 2}%`, height: '100%'}} />
      </View>

      <PrimaryButton
        label={isReg ? '✓ Registered – tap to cancel' : 'Register now'}
        variant={isReg ? 'success' : 'primary'}
        onPress={() => toggleRegister(event.id)}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  poster: {height: 160, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden'},
  pill: {position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99},
  pillTxt: {fontSize: 11.5, fontWeight: '700', color: colors.ink},
  heart: {position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 6},
  tag: {alignSelf: 'flex-start', fontSize: 10.5, fontWeight: '700', color: colors.primary, backgroundColor: colors.soft, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, overflow: 'hidden'},
  info: {flexDirection: 'row', gap: 8, marginTop: 14},
  tile: {flex: 1, backgroundColor: '#F5F6FD', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center'},
  tileVal: {fontSize: 12, fontWeight: '700', color: colors.ink, marginTop: 3, textAlign: 'center'},
  tileLabel: {fontSize: 10.5, fontWeight: '600', color: colors.mute},
  desc: {fontSize: 13, lineHeight: 20, color: colors.mute, marginVertical: 14},
  seatRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6},
  seatTxt: {fontSize: 12, fontWeight: '700', color: colors.mute},
  bar: {height: 8, borderRadius: 9, backgroundColor: '#ECEEF9', overflow: 'hidden', marginBottom: 16},
});
