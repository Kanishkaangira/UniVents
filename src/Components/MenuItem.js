import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors} from '../Constants/theme';

export default function MenuItem({icon, label, onPress, danger}) {
  const tint = danger ? colors.danger : colors.primary;
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.row} onPress={onPress}>
      <View style={[styles.icon, {backgroundColor: danger ? '#FFF0EC' : colors.soft}]}>
        <Icon name={icon} size={18} color={tint} />
      </View>
      <Text style={[styles.label, danger && {color: colors.danger}]}>{label}</Text>
      {!danger && <Icon name="chevron-forward" size={18} color="#B5B9D3" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: colors.line},
  icon: {width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  label: {flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink},
});
