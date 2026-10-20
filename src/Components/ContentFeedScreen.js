import React, {useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from './Screen';
import ScreenHeader from './ScreenHeader';
import SearchBar from './SearchBar';
import SegmentTabs from './SegmentTabs';
import ChipRow from './ChipRow';
import BottomSheet from './BottomSheet';
import {flatten} from '../Services/mappers';
import {colors} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

// Shared layout and filtering for Events and Notices.
export default function FeedScreen({title, subtitle, data, noun, searchPlaceholder, searchKeys, renderItem}) {
  const {skillFaculties, departments, clubs, loading, refreshing, error, refresh} = useApp();
  const [group, setGroup] = useState('University');
  const [subs, setSubs] = useState({});
  const [query, setQuery] = useState('');
  const [picker, setPicker] = useState(null);

  const groups = Object.keys(data);
  const hasData = useMemo(() => flatten(data).length > 0, [data]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return flatten(data).filter(item => searchKeys.some(key => String(item[key] ?? '').toLowerCase().includes(q)));
  }, [query, data, searchKeys]);

  const faculty = skillFaculties.find(item => item.code === subs.faculty);
  const facultyDepartments = faculty ? departments.filter(item => item.skill_faculty_id === faculty.id) : [];
  const selectedDepartment = facultyDepartments.find(item => item.code === subs.department);
  const facultyItems = faculty ? data['Skill Faculty']?.[faculty.code] || {} : {};
  const items = group === 'Skill Faculty'
    ? selectedDepartment
      ? facultyItems[selectedDepartment.code] || []
      : []
    : group === 'Clubs'
      ? data.Clubs?.[subs[group] || Object.keys(data.Clubs || {})[0]] || []
      : data.University?.All || [];
  const clubChips = clubs.map(club => ({key: club.name, label: club.name}));
  const scopeIcon = group === 'University' ? 'globe-outline' : group === 'Skill Faculty' ? 'school-outline' : 'people-outline';
  const summaryTitle = group === 'Skill Faculty' ? selectedDepartment?.name || faculty?.name || 'Skill Faculty' : group;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
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
            {group === 'Skill Faculty' && skillFaculties.length > 0 && (
              <View style={styles.hierarchySelectors}>
                <TouchableOpacity activeOpacity={0.78} onPress={() => setPicker('faculty')} style={[styles.selectorField, !faculty && styles.selectorFieldWide]}>
                  <Text style={styles.selectorLabel}>SKILL FACULTY</Text>
                  <View style={styles.selectorValueRow}>
                    <Text numberOfLines={2} style={styles.selectorValue}>{faculty?.name || 'Choose a faculty'}</Text>
                    <Icon name="chevron-down" size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
                {!!faculty && <TouchableOpacity activeOpacity={0.78} onPress={() => setPicker('department')} style={styles.selectorField}>
                  <Text style={styles.selectorLabel}>DEPARTMENT</Text>
                  <View style={styles.selectorValueRow}>
                    <Text numberOfLines={2} style={[styles.selectorValue, !selectedDepartment && styles.selectorPlaceholder]}>{selectedDepartment?.name || 'Choose a department'}</Text>
                    <Icon name="chevron-down" size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>}
              </View>
            )}
            {group === 'Clubs' && clubChips.length > 0 && (
              <View style={styles.optionsSection}>
                <Text style={styles.optionsLabel}>Clubs</Text>
                <ChipRow flush items={clubChips} value={subs.Clubs || Object.keys(data.Clubs || {})[0]} onChange={key => setSubs(prev => ({...prev, Clubs: key}))} />
              </View>
            )}
            {group === 'Clubs' && clubChips.length === 0 && <Text style={styles.emptyFilters}>No clubs available.</Text>}
            {group !== 'Skill Faculty' && <View style={styles.scopeSummary}>
              <View style={styles.scopeIcon}><Icon name={scopeIcon} size={16} color={colors.primary} /></View>
              <View style={styles.scopeCopy}>
                <Text numberOfLines={1} style={styles.scopeTitle}>{summaryTitle}</Text>
              </View>
              <Text style={styles.scopeCount}>{items.length} {noun}{items.length === 1 ? '' : 's'}</Text>
            </View>}
          </View>
          {items.length ? items.map(renderItem) : (
            <View style={styles.box}><Text style={styles.msg}>{group === 'Skill Faculty' && !faculty
              ? 'Choose a Skill Faculty to see its departments.'
              : group === 'Skill Faculty' && !selectedDepartment
                ? facultyDepartments.length ? `Choose a department to see its ${noun}s.` : 'No departments are listed under this faculty.'
                : `No ${noun}s here yet`}</Text></View>
          )}
        </>
      )}

      <BottomSheet visible={picker === 'faculty'} onClose={() => setPicker(null)}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Choose a Skill Faculty</Text>
          <Text style={styles.pickerSubtitle}>Departments will be shown for your selection.</Text>
        </View>
        {skillFaculties.map(item => {
          const selected = faculty?.id === item.id;
          return (
            <TouchableOpacity key={item.id} activeOpacity={0.75} onPress={() => {
              setSubs(prev => ({...prev, faculty: item.code, department: null}));
              setPicker(null);
            }} style={[styles.pickerRow, selected && styles.pickerRowSelected]}>
              <View style={[styles.pickerCode, selected && styles.pickerCodeSelected]}><Text style={[styles.pickerCodeText, selected && styles.pickerCodeTextSelected]}>{item.code}</Text></View>
              <Text numberOfLines={2} style={styles.pickerRowName}>{item.name}</Text>
              {selected && <Icon name="checkmark-circle" size={19} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      <BottomSheet visible={picker === 'department'} onClose={() => setPicker(null)}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Choose a Department</Text>
          <Text style={styles.pickerSubtitle}>{faculty?.name || 'Selected Skill Faculty'}</Text>
        </View>
        {facultyDepartments.length ? facultyDepartments.map(item => {
          const selected = selectedDepartment?.id === item.id;
          return (
            <TouchableOpacity key={item.id} activeOpacity={0.75} onPress={() => {
              setSubs(prev => ({...prev, department: item.code}));
              setPicker(null);
            }} style={[styles.pickerRow, selected && styles.pickerRowSelected]}>
              <View style={[styles.departmentPickerIcon, selected && styles.pickerCodeSelected]}><Icon name="business-outline" size={17} color={selected ? colors.primary : colors.mute} /></View>
              <Text numberOfLines={2} style={styles.pickerRowName}>{item.name}</Text>
              {selected && <Icon name="checkmark-circle" size={19} color={colors.primary} />}
            </TouchableOpacity>
          );
        }) : <Text style={styles.emptyFilters}>No departments are listed under this faculty.</Text>}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {marginTop: 40},
  filterCard: {backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 11, marginBottom: 12},
  optionsSection: {marginTop: 2, marginBottom: 8},
  optionsLabel: {fontSize: 10, fontWeight: '700', color: colors.mute, marginBottom: 4},
  hierarchySelectors: {flexDirection: 'row', gap: 8, marginTop: 2},
  selectorField: {flex: 1, minWidth: 0, minHeight: 64, justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: '#FAFAFE', paddingHorizontal: 10, paddingVertical: 8},
  selectorFieldWide: {flex: 0, width: '100%'},
  selectorLabel: {fontSize: 8.5, fontWeight: '800', letterSpacing: 0.6, color: colors.mute, marginBottom: 5},
  selectorValueRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  selectorValue: {flex: 1, minWidth: 0, fontSize: 10, lineHeight: 13, fontWeight: '700', color: colors.ink},
  selectorPlaceholder: {color: colors.primary},
  pickerHeader: {marginBottom: 14},
  pickerTitle: {fontSize: 19, fontWeight: '800', color: colors.ink},
  pickerSubtitle: {fontSize: 12, lineHeight: 18, color: colors.mute, marginTop: 4},
  pickerRow: {minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8},
  pickerRowSelected: {backgroundColor: colors.soft, borderColor: colors.primary},
  pickerCode: {minWidth: 48, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F0F1F8', paddingHorizontal: 7},
  pickerCodeSelected: {backgroundColor: '#fff'},
  pickerCodeText: {fontSize: 10, fontWeight: '800', color: colors.mute},
  pickerCodeTextSelected: {color: colors.primary},
  departmentPickerIcon: {width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F0F1F8'},
  pickerRowName: {flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '700', color: colors.ink},
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
