import React, {useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from './Screen';
import ScreenHeader from './ScreenHeader';
import SearchBar from './SearchBar';
import SegmentTabs from './SegmentTabs';
import ChipRow from './ChipRow';
import {flatten} from '../Services/mappers';
import {colors} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

// Shared layout and filtering for Events and Notices.
export default function FeedScreen({title, subtitle, data, noun, searchPlaceholder, searchKeys, renderItem}) {
  const {departments, clubs, loading, error, refresh} = useApp();
  const [group, setGroup] = useState('University');
  const [subs, setSubs] = useState({});
  const [query, setQuery] = useState('');

  const groups = Object.keys(data);
  const subKeys = Object.keys(data[group] || {});
  const sub = subKeys.includes(subs[group]) ? subs[group] : subKeys[0];
  const items = data[group]?.[sub] || [];
  const hasData = useMemo(() => flatten(data).length > 0, [data]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return flatten(data).filter(item => searchKeys.some(key => String(item[key] ?? '').toLowerCase().includes(q)));
  }, [query, data, searchKeys]);

  const chips = group === 'Departments'
    ? departments.map(department => ({key: department.code, label: department.code}))
    : group === 'Clubs'
      ? clubs.map(club => ({key: club.name, label: club.name}))
      : [];
  const scopeIcon = group === 'University' ? 'globe-outline' : group === 'Departments' ? 'business-outline' : 'people-outline';

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <ScreenHeader title={title} subtitle={subtitle} />
      <SearchBar value={query} onChangeText={setQuery} placeholder={searchPlaceholder} />

      {error ? (
        <View style={styles.box}>
          <Text style={styles.msg}>Could not load {noun}s{'\n'}{error}</Text>
          <TouchableOpacity onPress={refresh}><Text style={styles.retry}>Try again</Text></TouchableOpacity>
        </View>
      ) : loading && !hasData ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : results ? (
        results.length ? results.map(renderItem) : (
          <View style={styles.box}><Text style={styles.msg}>No results for “{query}”</Text></View>
        )
      ) : (
        <>
          <View style={styles.filterCard}>
            <SegmentTabs tabs={groups} value={group} onChange={setGroup} />
            {group !== 'University' && chips.length > 0 && (
              <View style={styles.optionsSection}>
                <Text style={styles.optionsLabel}>{group === 'Departments' ? 'Departments' : 'Clubs'}</Text>
                <ChipRow flush items={chips} value={sub} onChange={key => setSubs(prev => ({...prev, [group]: key}))} />
              </View>
            )}
            {group !== 'University' && chips.length === 0 && <Text style={styles.emptyFilters}>No {group.toLowerCase()} available.</Text>}
            <View style={styles.scopeSummary}>
              <View style={styles.scopeIcon}><Icon name={scopeIcon} size={16} color={colors.primary} /></View>
              <View style={styles.scopeCopy}>
                <Text numberOfLines={1} style={styles.scopeTitle}>{group}</Text>
              </View>
              <Text style={styles.scopeCount}>{items.length} {noun}{items.length === 1 ? '' : 's'}</Text>
            </View>
          </View>
          {items.length ? items.map(renderItem) : (
            <View style={styles.box}><Text style={styles.msg}>No {noun}s here yet</Text></View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {marginTop: 40},
  filterCard: {backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 11, marginBottom: 12},
  optionsSection: {marginTop: 2, marginBottom: 8},
  optionsLabel: {fontSize: 10, fontWeight: '700', color: colors.mute, marginBottom: 4},
  emptyFilters: {fontSize: 11, color: colors.mute, marginBottom: 8},
  scopeSummary: {minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F7F7FC', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5, marginTop: 1},
  scopeIcon: {width: 28, height: 28, borderRadius: 9, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  scopeCopy: {flex: 1},
  scopeTitle: {fontSize: 11.5, fontWeight: '700', color: colors.ink},
  scopeCount: {fontSize: 10, fontWeight: '600', color: colors.mute},
  box: {alignItems: 'center', paddingVertical: 36},
  msg: {textAlign: 'center', color: colors.mute, fontWeight: '600', lineHeight: 24},
  retry: {marginTop: 12, color: colors.primary, fontWeight: '800'},
});
