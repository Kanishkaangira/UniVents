import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import BottomSheet from './BottomSheet';
import PrimaryButton from './PrimaryButton';
import {colors, gradients, noticeEmoji} from '../Constants/theme';

export default function NoticeDetailSheet({notice, visible, onClose}) {
  if (!notice) return null;
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <LinearGradient colors={gradients.brand} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.poster}>
        <Text style={{fontSize: 46}}>{noticeEmoji[notice.tag]}</Text>
      </LinearGradient>
      <Text style={styles.title}>{notice.title}</Text>
      <Text style={styles.tag}>{notice.tag}</Text>
      <Text style={styles.meta}>🏛️ {notice.source}    📅 {notice.date}</Text>
      <Text style={styles.desc}>{notice.text}</Text>
      <View style={styles.att}>
        <Text style={styles.attTxt}>📎 Circular_{notice.tag}.pdf</Text>
        <Text style={[styles.attTxt, {color: colors.primary}]}>Download</Text>
      </View>
      <PrimaryButton label="Got it" variant="soft" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  poster: {height: 110, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14},
  title: {fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 6},
  tag: {alignSelf: 'flex-start', fontSize: 10.5, fontWeight: '700', color: colors.primary, backgroundColor: colors.soft, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, overflow: 'hidden'},
  meta: {fontSize: 12.5, fontWeight: '600', color: colors.ink, marginTop: 12},
  desc: {fontSize: 13, lineHeight: 20, color: colors.mute, marginVertical: 14},
  att: {flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F5F6FD', borderRadius: 14, padding: 13, marginBottom: 12},
  attTxt: {fontSize: 13, fontWeight: '700', color: colors.ink},
});
