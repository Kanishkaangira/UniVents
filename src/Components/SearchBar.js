import React from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, shadow} from '../Constants/theme';

export default function SearchBar({value, onChangeText, placeholder}) {
  return (
    <View style={styles.box}>
      <Icon name="search" size={18} color={colors.mute} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A3A8C3"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, marginBottom: 14, ...shadow},
  input: {flex: 1, paddingVertical: 13, fontSize: 14, fontWeight: '600', color: colors.ink},
});
