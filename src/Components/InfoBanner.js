import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function InfoBanner({badge, title, subtitle, colors: gradient, bigBadge}) {
  return (
    <LinearGradient colors={gradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.banner}>
      <View style={styles.badge}>
        <Text style={[styles.badgeTxt, bigBadge && {fontSize: 26}]}>{badge}</Text>
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 16, marginBottom: 14},
  badge: {width: 54, height: 54, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center'},
  badgeTxt: {color: '#fff', fontSize: 13, fontWeight: '800'},
  title: {color: '#fff', fontSize: 14.5, fontWeight: '800'},
  sub: {color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2},
});
