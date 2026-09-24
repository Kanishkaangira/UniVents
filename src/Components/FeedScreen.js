import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Screen from './Screen';
import ScreenHeader from './ScreenHeader';
import SearchBar from './SearchBar';
import SegmentTabs from './SegmentTabs';
import ChipRow from './ChipRow';
import InfoBanner from './InfoBanner';
import {CLUBS, FACULTIES, flatten} from '../Data/data';
import {colors, gradients} from '../Constants/theme';

// Shared layout for Events AND Notice screens:
// University | Departments | Clubs  ->  faculty / club chips  ->  banner  ->  list
// data shape: { University:{All:[]}, Departments:{SFET:[]...}, Clubs:{'Technical Club':[]...} }
export default function FeedScreen({title, subtitle, data, noun, searchPlaceholder, searchKeys, renderItem}) {
  const [group, setGroup] = useState('University');
  const [subs, setSubs] = useState({});
  const [query, setQuery] = useState('');

  const groups = Object.keys(data);
  const subKeys = Object.keys(data[group]);
  const sub = subs[group] || subKeys[0];
  const items = data[group][sub];
  const plural = `${noun}${items.length === 1 ? '' : 's'}`;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return flatten(data).filter(i => searchKeys.some(k => String(i[k]).toLowerCase().includes(q)));
  }, [query, data, searchKeys]);

  const chips = subKeys.map(k => ({key: k, label: group === 'Clubs' ? `${CLUBS[k]} ${k}` : k}));

  let banner;
  if (group === 'Departments') {
    banner = <InfoBanner badge={sub} title={FACULTIES[sub]} subtitle={`${items.length} ${plural}`} colors={['#4338CA', '#8B7CF8']} />;
  } else if (group === 'Clubs') {
    banner = <InfoBanner bigBadge badge={CLUBS[sub]} title={sub} subtitle={`${items.length} ${plural}`} colors={gradients.c} />;
  } else {
    banner = <InfoBanner bigBadge badge="🎓" title="University-wide" subtitle="Common for every student" colors={gradients.a} />;
  }

  return (
    <Screen>
      <ScreenHeader title={title} subtitle={subtitle} />
      <SearchBar value={query} onChangeText={setQuery} placeholder={searchPlaceholder} />
      {results ? (
        results.length ? results.map(renderItem) : (
          <View style={styles.empty}><Text style={styles.emptyTxt}>🔍{'\n'}No results for “{query}”</Text></View>
        )
      ) : (
        <>
          <SegmentTabs tabs={groups} value={group} onChange={setGroup} />
          {subKeys.length > 1 && (
            <ChipRow items={chips} value={sub} onChange={key => setSubs(prev => ({...prev, [group]: key}))} />
          )}
          {banner}
          {items.map(renderItem)}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {alignItems: 'center', paddingVertical: 40},
  emptyTxt: {textAlign: 'center', color: colors.mute, fontWeight: '600', lineHeight: 26},
});
