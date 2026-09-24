import React from 'react';
import {Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function AppLogo({size = 44}) {
  return (
    <LinearGradient
      colors={['#4338CA', '#A78BFA']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={{width: size, height: size, borderRadius: size * 0.3, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{color: '#fff', fontSize: size * 0.55, fontWeight: '800'}}>U</Text>
      <View style={{position: 'absolute', top: size * 0.12, right: size * 0.14, width: size * 0.14, height: size * 0.14, borderRadius: 99, backgroundColor: '#FFB36B'}} />
    </LinearGradient>
  );
}
