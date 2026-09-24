import React, {useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Screen from './Screen';
import ScreenHeader from './ScreenHeader';
import SearchBar from './SearchBar';
import SegmentTabs from './SegmentTabs';
import ChipRow from './ChipRow';
import InfoBanner from './InfoBanner';
import {clubEmoji, flatten} from '../Services/mappers';
import {colors, gradients} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

// Shared layout for Events AND Notice screens:
// University | Departments | Clubs  ->  department / club chips  ->  banner  ->  list
// data = tree from buildTree(): { University:{All:[]}, Departments:{SFET:[]...}, Clubs:{'Technical Club':[]...} }
export default function FeedScreen({title, subtitle, data, noun, searchPlaceholder, searchKeys, renderItem}) {
  const {departments, clubs, loading, error, refresh} = useApp();
  const [group, setGroup] = useState('University');
  const [subs, setSubs] = useState({});
  const [query, setQuery] = useState('');

  const groups = Object.keys(data);
  const subKeys = Object.keys(data[group]);
  const sub = subKeys.includes(subs[group]) ? subs[group] : subKeys[0];
  const items = data[group][sub] || [];
  const plural = `${noun}${items.length === 1 ? '' : 's'}`;
  const hasData = useMemo(() => flatten(data).length > 0, [data]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return flatten(data).filter(i => searchKeys.some(k => String(i[k] ?? '').toLowerCase().includes(q)));
  }, [query, data, searchKeys]);

  const clubOf = name => clubs.find(c => c.name === name);
  const chips = subKeys.map(k => ({key: k, label: group === 'Clubs' ? `${clubEmoji(clubOf(k)?.code)} ${k}` : k}));

  let banner = null;
  if (group === 'Departments' && sub) {
    banner = <InfoBanner badge={sub} title={departments.find(d => d.code === sub)?.name || sub} subtitle={`${items.length} ${plural}`} colors={['#4338CA', '#8B7CF8']} />;
  } else if (group === 'Clubs' && sub) {
    banner = <InfoBanner bigBadge badge={clubEmoji(clubOf(sub)?.code)} title={sub} subtitle={`${items.length} ${plural}`} colors={gradients.c} />;
  } else if (group === 'University') {
    banner = <InfoBanner bigBadge badge="🎓" title="University-wide" subtitle={`${items.length} ${plural} · common for every student`} colors={gradients.a} />;
  }

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
        <ActivityIndicator color={colors.primary} style={{marginTop: 40}} />
      ) : results ? (
        results.length ? results.map(renderItem) : (
          <View style={styles.box}><Text style={styles.msg}>🔍{'\n'}No results for “{query}”</Text></View>
        )
      ) : (
        <>
          <SegmentTabs tabs={groups} value={group} onChange={setGroup} />
          {group !== 'University' && subKeys.length > 0 && (
            <ChipRow items={chips} value={sub} onChange={key => setSubs(prev => ({...prev, [group]: key}))} />
          )}
          {banner}
          {items.length ? items.map(renderItem) : (
            <View style={styles.box}><Text style={styles.msg}>No {noun}s here yet</Text></View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: {alignItems: 'center', paddingVertical: 36},
  msg: {textAlign: 'center', color: colors.mute, fontWeight: '600', lineHeight: 24},
  retry: {marginTop: 12, color: colors.primary, fontWeight: '800'},
});
