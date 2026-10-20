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
      ? [...(facultyItems.__all_departments__ || []), ...(facultyItems[selectedDepartment.code] || [])]
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
                <TouchableOpacity accessibilityRole="button" activeOpacity={0.78} onPress={() => setPicker('faculty')} style={styles.selectorField}>
                  <View style={styles.selectorHeading}>
                    <View style={styles.selectorIcon}><Icon name="school-outline" size={16} color={colors.primary} /></View>
                    <Text style={styles.selectorLabel}>SKILL FACULTY</Text>
                    <Text accessibilityLabel={`${skillFaculties.length} Skill Faculties`} style={styles.selectorCount}>{skillFaculties.length} total</Text>
                  </View>
                  <View style={styles.selectorValueRow}>
                    <Text numberOfLines={2} style={[styles.selectorValue, !faculty && styles.selectorPlaceholder]}>{faculty?.name || 'Select a Skill Faculty'}</Text>
                    <Icon name="chevron-down" size={17} color={colors.primary} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled: !faculty}} activeOpacity={faculty ? 0.78 : 1} disabled={!faculty} onPress={() => setPicker('department')} style={[styles.selectorField, !faculty && styles.selectorFieldDisabled]}>
                  <View style={styles.selectorHeading}>
                    <View style={[styles.selectorIcon, !faculty && styles.selectorIconDisabled]}><Icon name="business-outline" size={16} color={faculty ? colors.primary : colors.mute} /></View>
                    <Text style={styles.selectorLabel}>DEPARTMENT</Text>
                    <Text accessibilityLabel={`${facultyDepartments.length} departments under this Skill Faculty`} style={styles.selectorCount}>{faculty ? `${facultyDepartments.length} total` : '—'}</Text>
                  </View>
                  <View style={styles.selectorValueRow}>
                    <Text numberOfLines={2} style={[styles.selectorValue, (!selectedDepartment || !faculty) && styles.selectorPlaceholder]}>{selectedDepartment?.name || (faculty ? 'Select a department' : 'Choose a faculty first')}</Text>
                    {faculty && <Icon name="chevron-down" size={17} color={colors.primary} />}
                  </View>
                </TouchableOpacity>
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
  selectorField: {flex: 1, minWidth: 0, minHeight: 72, justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 15, backgroundColor: '#FAFAFE', paddingHorizontal: 9, paddingVertical: 9},
  selectorFieldDisabled: {backgroundColor: '#F5F5F8', borderColor: '#E8E8EF'},
  selectorHeading: {flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7},
  selectorIcon: {width: 22, height: 22, borderRadius: 7, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  selectorIconDisabled: {backgroundColor: '#EBEBF0'},
  selectorLabel: {flex: 1, minWidth: 0, fontSize: 8, fontWeight: '800', letterSpacing: 0.35, color: colors.mute},
  selectorCount: {fontSize: 8, fontWeight: '800', color: colors.primary, backgroundColor: colors.soft, overflow: 'hidden', borderRadius: 7, paddingHorizontal: 5, paddingVertical: 3},
  selectorValueRow: {flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 27},
  selectorValue: {flex: 1, minWidth: 0, fontSize: 10, lineHeight: 14, fontWeight: '700', color: colors.ink},
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
