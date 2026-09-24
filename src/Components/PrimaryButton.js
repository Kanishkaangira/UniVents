import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors} from '../Constants/theme';

// variant: 'primary' (gradient) | 'success' | 'soft' | 'danger'
export default function PrimaryButton({label, onPress, variant = 'primary', style}) {
  const flat = {success: colors.success, soft: colors.soft, danger: colors.danger}[variant];
  const textColor = variant === 'soft' ? colors.primary : '#fff';
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={style}>
      {flat ? (
        <Text style={[styles.btn, {backgroundColor: flat, color: textColor}]}>{label}</Text>
      ) : (
        <LinearGradient colors={[colors.primary, colors.primary2]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.grad}>
          <Text style={[styles.txt, {color: '#fff'}]}>{label}</Text>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {paddingVertical: 15, borderRadius: 18, overflow: 'hidden', textAlign: 'center', fontSize: 15, fontWeight: '800'},
  grad: {paddingVertical: 15, borderRadius: 18, alignItems: 'center'},
  txt: {fontSize: 15, fontWeight: '800'},
});
