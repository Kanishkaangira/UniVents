import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, noticeEmoji, shadow} from '../Constants/theme';

export default function NoticeCard({item, unread, onPress}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, {borderLeftColor: item.pinned ? colors.accent : colors.primary2}]}>
      <View style={styles.icon}>
        <Text style={{fontSize: 22}}>{noticeEmoji[item.tag]}</Text>
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.title}>{item.title}{item.pinned ? '  📌' : ''}</Text>
        <Text style={styles.text} numberOfLines={2}>{item.text}</Text>
        <Text style={styles.tag}>{item.tag}</Text>
        <Text style={styles.meta}>{item.source} · {item.date}</Text>
      </View>
      {unread && <View style={styles.unread} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, padding: 11, marginBottom: 11, borderLeftWidth: 4, ...shadow, shadowOpacity: 0.07},
  icon: {width: 48, height: 48, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 3},
  text: {fontSize: 12, color: colors.mute, lineHeight: 17},
  tag: {alignSelf: 'flex-start', marginTop: 5, fontSize: 10.5, fontWeight: '700', color: colors.primary, backgroundColor: colors.soft, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, overflow: 'hidden'},
  meta: {fontSize: 11.5, color: colors.mute, marginTop: 4},
  unread: {width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent},
});
