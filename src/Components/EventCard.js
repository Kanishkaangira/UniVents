import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, gradients, shadow} from '../Constants/theme';

export default function EventCard({item, saved, onPress, onToggleSave, compact}) {
  const [day, month] = item.date.split(' ');
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <LinearGradient colors={gradients[item.grad]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.date}>
        {compact ? <Text style={styles.emoji}>{item.emoji}</Text> : (
          <>
            <Text style={styles.day}>{day}</Text>
            <Text style={styles.month}>{month}</Text>
          </>
        )}
      </LinearGradient>
      <View style={{flex: 1}}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>🕒 {item.time.split(' –')[0]}  ·  📍 {item.venue}</Text>
        <Text style={styles.tag}>{item.org}</Text>
      </View>
      {onToggleSave && (
        <TouchableOpacity onPress={onToggleSave} style={[styles.heart, saved && styles.heartOn]}>
          <Icon name={saved ? 'heart' : 'heart-outline'} size={18} color={saved ? '#FF5A3C' : '#B5B9D3'} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, padding: 11, marginBottom: 11, ...shadow, shadowOpacity: 0.07},
  date: {width: 62, height: 66, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  day: {color: '#fff', fontSize: 22, fontWeight: '800'},
  month: {color: '#fff', fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase'},
  emoji: {fontSize: 28},
  title: {fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 3},
  meta: {fontSize: 12, color: colors.mute},
  tag: {alignSelf: 'flex-start', marginTop: 5, fontSize: 10.5, fontWeight: '700', color: colors.primary, backgroundColor: colors.soft, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, overflow: 'hidden'},
  heart: {width: 34, height: 34, borderRadius: 12, backgroundColor: '#F1F2FA', alignItems: 'center', justifyContent: 'center'},
  heartOn: {backgroundColor: '#FFE9E4'},
});
