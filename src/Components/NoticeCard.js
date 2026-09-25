import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, shadow} from '../Constants/theme';

export default function NoticeCard({item, unread, onPress}) {
  const previewImage = item.attachmentType === 'image' ? item.attachmentUrl : item.imageUrl;
  const audience = item.visibility === 'student' ? 'Students' : item.visibility === 'faculty' ? 'Faculty' : 'Everyone';
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, {borderLeftColor: item.pinned ? colors.accent : colors.primary2}]}>
      {previewImage ? (
        <Image source={{uri: previewImage}} style={styles.image} resizeMode="cover" />
      ) : item.attachmentType === 'pdf' ? (
        <View style={styles.pdfIcon}><Icon name="document-text" size={22} color="#C33D4B" /></View>
      ) : (
        <View style={styles.icon}><Text style={styles.iconGlyph}>{item.icon}</Text></View>
      )}
      <View style={styles.copy}>
        <Text style={styles.title}>{item.title}{item.pinned ? '  📌' : ''}</Text>
        <Text style={styles.text} numberOfLines={2}>{item.text}</Text>
        {!!item.attachmentType && <Text style={styles.attachment} numberOfLines={1}>{item.attachmentType === 'pdf' ? 'PDF notice' : 'Image notice'}{item.attachmentName ? ` · ${item.attachmentName}` : ''}</Text>}
        <View style={styles.chips}>
          {!!item.tag && <Text style={styles.tag}>{item.tag}</Text>}
          <Text style={styles.audience}>{audience}</Text>
          {!!item.scopeLabel && <Text style={styles.scope}>{item.scopeLabel}</Text>}
        </View>
        <Text style={styles.meta}>{item.source} · {item.date}</Text>
      </View>
      {unread && <View style={styles.unread} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, padding: 11, marginBottom: 11, borderLeftWidth: 4, ...shadow, shadowOpacity: 0.07},
  icon: {width: 48, height: 48, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  iconGlyph: {fontSize: 22},
  image: {width: 48, height: 48, borderRadius: 14, backgroundColor: colors.soft},
  pdfIcon: {width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFF0F1', alignItems: 'center', justifyContent: 'center'},
  copy: {flex: 1},
  title: {fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 3},
  text: {fontSize: 12, color: colors.mute, lineHeight: 17},
  attachment: {fontSize: 10.5, fontWeight: '700', color: '#A43743', marginTop: 4},
  chips: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 1},
  tag: {alignSelf: 'flex-start', marginTop: 5, fontSize: 10.5, fontWeight: '700', color: colors.primary, backgroundColor: colors.soft, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, overflow: 'hidden'},
  audience: {fontSize: 10, fontWeight: '700', color: '#087E80', backgroundColor: '#E8F8F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, overflow: 'hidden'},
  scope: {fontSize: 10, fontWeight: '700', color: '#65549D', backgroundColor: '#F1EEFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, overflow: 'hidden'},
  meta: {fontSize: 11.5, color: colors.mute, marginTop: 4},
  unread: {width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent},
});
