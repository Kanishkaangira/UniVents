import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../Constants/theme';

export default function SegmentTabs({tabs, value, onChange}) {
  return (
    <View style={styles.wrap}>
      {tabs.map(tab => {
        const on = tab === value;
        return (
          <TouchableOpacity key={tab} style={[styles.tab, on && styles.on]} onPress={() => onChange(tab)}>
            <Text style={[styles.txt, on && {color: colors.primary}]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flexDirection: 'row', backgroundColor: '#E4E6F7', borderRadius: 16, padding: 4, marginBottom: 14},
  tab: {flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center'},
  on: {backgroundColor: '#fff', shadowColor: '#3C3296', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: {width: 0, height: 3}, elevation: 3},
  txt: {fontSize: 13, fontWeight: '700', color: colors.mute},
});
