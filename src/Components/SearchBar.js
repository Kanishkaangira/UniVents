import React from 'react';
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors} from '../Constants/theme';

export default function SearchBar({value, onChangeText, placeholder, onDatePress, dateLabel}) {
  return (
    <View style={styles.box}>
      <Icon name="search" size={19} color={colors.primary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9297B0"
        accessibilityLabel={placeholder || 'Search'}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          activeOpacity={0.7}
          onPress={() => onChangeText('')}
          style={styles.clearButton}>
          <Icon name="close" size={15} color={colors.mute} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.divider} />
      {onDatePress && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={dateLabel ? `Select date, currently ${dateLabel}` : 'Select date'}
          accessibilityState={{selected: !!dateLabel}}
          activeOpacity={0.75}
          onPress={onDatePress}
          style={[styles.calendarButton, !!dateLabel && styles.calendarButtonSelected]}>
          <Icon name="calendar-outline" size={18} color={dateLabel ? '#fff' : colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 17, borderWidth: 1, borderColor: '#E5E2F3', paddingHorizontal: 12, marginBottom: 15, shadowColor: '#4D438F', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: {width: 0, height: 4}, elevation: 2},
  input: {flex: 1, minWidth: 0, paddingVertical: 11, fontSize: 12, fontWeight: '600', color: colors.ink},
  clearButton: {width: 26, height: 30, alignItems: 'center', justifyContent: 'center'},
  divider: {width: 1, height: 25, backgroundColor: '#E9E7F2'},
  calendarButton: {width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center'},
  calendarButtonSelected: {backgroundColor: colors.primary},
});
