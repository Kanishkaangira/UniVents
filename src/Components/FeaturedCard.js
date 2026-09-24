import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {gradients, shadow} from '../Constants/theme';

export default function FeaturedCard({item, onPress}) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={shadow}>
      <LinearGradient colors={gradients[item.grad]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.card}>
        <View style={styles.circle} />
        <Text style={styles.emoji}>{item.emoji}</Text>
        <View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.sub}>{item.date} · {item.org}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {width: 130, height: 168, borderRadius: 22, padding: 12, justifyContent: 'space-between', overflow: 'hidden'},
  circle: {position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.18)', right: -25, top: -25},
  emoji: {fontSize: 44},
  title: {color: '#fff', fontSize: 13.5, fontWeight: '800'},
  sub: {color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 2},
});
