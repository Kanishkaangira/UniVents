import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, shadow} from '../Constants/theme';

export default function NoticeCard({item, onPress}) {
  const previewImage = item.attachmentType === 'image' ? item.attachmentUrl : item.imageUrl;
  const organizerLabel = item.organizerScope === 'department' ? item.scopeLabel || item.source : item.source;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.card}>
      {previewImage ? (
        <Image source={{uri: previewImage}} style={styles.image} resizeMode="cover" />
      ) : item.attachmentType === 'pdf' ? (
        <View style={styles.pdfIcon}><Icon name="document-text" size={22} color="#C33D4B" /></View>
      ) : (
        <View style={styles.icon}><Text style={styles.iconGlyph}>{item.icon}</Text></View>
      )}
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>{item.title}{item.pinned ? '  📌' : ''}</Text>
        {!!item.text && <Text style={styles.text} numberOfLines={3}>{item.text}</Text>}
        {!!item.attachmentType && <Text style={styles.attachment} numberOfLines={1}>{item.attachmentType === 'pdf' ? 'PDF notice' : 'Image notice'}{item.attachmentName ? ` · ${item.attachmentName}` : ''}</Text>}
        <View style={styles.chips}>
          {!!item.tag && <Text style={styles.tag}>{item.tag}</Text>}
          {!!item.scopeLabel && <Text style={styles.scope}>{item.scopeLabel}</Text>}
        </View>
        <Text style={styles.meta} numberOfLines={1}>{organizerLabel} · {item.date}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: '#fff', borderRadius: 22, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#EAECF3', ...shadow, shadowOpacity: 0.08},
  icon: {width: 56, height: 60, borderRadius: 16, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  iconGlyph: {fontSize: 25},
  image: {width: 56, height: 60, borderRadius: 16, backgroundColor: colors.soft},
  pdfIcon: {width: 56, height: 60, borderRadius: 16, backgroundColor: '#FFF0F1', alignItems: 'center', justifyContent: 'center'},
  copy: {flex: 1},
  title: {fontSize: 16, lineHeight: 22, fontWeight: '800', color: colors.ink, marginBottom: 5},
  text: {fontSize: 13, color: '#626983', lineHeight: 20},
  attachment: {fontSize: 11.5, fontWeight: '800', color: '#A43743', marginTop: 7, backgroundColor: '#FFF5F5', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, overflow: 'hidden'},
  chips: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 3},
  tag: {alignSelf: 'flex-start', marginTop: 5, fontSize: 11, fontWeight: '800', color: colors.primary, backgroundColor: colors.soft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, overflow: 'hidden'},
  scope: {fontSize: 10, fontWeight: '700', color: '#65549D', backgroundColor: '#F1EEFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, overflow: 'hidden'},
  meta: {fontSize: 10.5, fontWeight: '600', color: colors.mute, marginTop: 7},
});
