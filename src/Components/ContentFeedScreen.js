import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Animated, Easing, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from './Screen';
import ScreenHeader from './ScreenHeader';
import SearchBar from './SearchBar';
import SegmentTabs from './SegmentTabs';
import ChipRow from './ChipRow';
import BottomSheet from './BottomSheet';
import MiniCalendar from './MiniCalendar';
import {flatten} from '../Services/mappers';
import {colors} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

const toDateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const itemDateKey = item => {
  if (item.dateISO) return item.dateISO;
  if (!item.createdAt) return null;
  const date = new Date(item.createdAt);
  return Number.isNaN(date.getTime()) ? null : toDateKey(date);
};

// Shared layout and filtering for Events and Notices.
export default function FeedScreen({title, subtitle, data, noun, searchPlaceholder, searchKeys, renderItem}) {
  const {skillFaculties, departments, clubs, loading, refreshing, error, refresh} = useApp();
  const [group, setGroup] = useState('All');
  const [subs, setSubs] = useState({});
  const [query, setQuery] = useState('');
  const [picker, setPicker] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateCursor, setDateCursor] = useState(() => {
    const today = new Date();
    return {year: today.getFullYear(), month: today.getMonth()};
  });
  const emptyMotion = useRef(new Animated.Value(0)).current;

  const groups = ['All', ...Object.keys(data).filter(name => name !== 'All')];
  const allItems = useMemo(() => flatten(data), [data]);
  const hasData = allItems.length > 0;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && !selectedDate) return null;
    return allItems.filter(item => {
      const matchesQuery = !q || searchKeys.some(key => String(item[key] ?? '').toLowerCase().includes(q));
      const matchesDate = !selectedDate || itemDateKey(item) === selectedDate;
      return matchesQuery && matchesDate;
    });
  }, [query, allItems, searchKeys, selectedDate]);

  const faculty = skillFaculties.find(item => item.code === subs.faculty);
  const facultyDepartments = faculty ? departments.filter(item => item.skill_faculty_id === faculty.id) : [];
  // A faculty without child departments is selectable by its own name in the
  // department field, and its faculty-level posts appear under that option.
  const departmentlessFacultyOption = faculty && facultyDepartments.length === 0
    ? {id: faculty.id, code: faculty.code, name: faculty.name, skill_faculty_id: faculty.id}
    : null;
  const selectedDepartment = facultyDepartments.find(item => item.code === subs.department)
    || (departmentlessFacultyOption && subs.department === faculty.code ? departmentlessFacultyOption : null);
  const facultyItems = faculty ? data['Skill Faculty']?.[faculty.code] || {} : {};
  const items = group === 'All'
    ? flatten(data)
    : group === 'Skill Faculty'
    ? selectedDepartment
      ? [...(facultyItems.__all_departments__ || []), ...(facultyItems[selectedDepartment.code] || [])]
      : []
    : group === 'Clubs'
      ? data.Clubs?.[subs[group] || Object.keys(data.Clubs || {})[0]] || []
      : data.University?.All || [];
  const itemCount = items.length;
  useEffect(() => {
    if (itemCount > 0 || results) return undefined;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(emptyMotion, {toValue: 1, duration: 1450, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      Animated.timing(emptyMotion, {toValue: 0, duration: 1450, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
    ]));
    animation.start();
    return () => animation.stop();
  }, [emptyMotion, itemCount, results]);
  const clubChips = clubs.map(club => ({key: club.name, label: club.name}));
  const scopeIcon = group === 'All' ? 'apps-outline' : group === 'University' ? 'globe-outline' : group === 'Skill Faculty' ? 'school-outline' : 'people-outline';
  const summaryTitle = group === 'Skill Faculty' ? selectedDepartment?.name || faculty?.name || 'Skill Faculty' : group;
  const datePrefix = `${dateCursor.year}-${String(dateCursor.month + 1).padStart(2, '0')}-`;
  const dateMarked = Object.fromEntries(allItems
    .map(itemDateKey)
    .filter(date => date?.startsWith(datePrefix))
    .map(date => [Number(date.slice(8, 10)), true]));
  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})
    : '';
  const openDatePicker = () => {
    const date = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
    setDateCursor({year: date.getFullYear(), month: date.getMonth()});
    setPicker('date');
  };
  const moveDateMonth = delta => {
    const next = new Date(dateCursor.year, dateCursor.month + delta, 1);
    setDateCursor({year: next.getFullYear(), month: next.getMonth()});
  };

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ScreenHeader title={title} subtitle={subtitle} feed />
      <SearchBar value={query} onChangeText={setQuery} placeholder={searchPlaceholder} onDatePress={openDatePicker} dateLabel={selectedDateLabel} />
      {selectedDateLabel ? (
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Clear date filter ${selectedDateLabel}`} activeOpacity={0.75} onPress={() => setSelectedDate(null)} style={styles.selectedDateChip}>
          <Text style={styles.selectedDateText}>DATE · {selectedDateLabel}</Text>
          <Icon name="close-circle" size={15} color={colors.primary} />
        </TouchableOpacity>
      ) : null}

      {error ? (
        <View style={styles.box}>
          <Text style={styles.msg}>Could not load {noun}s{'\n'}{error}</Text>
          <TouchableOpacity onPress={refresh}><Text style={styles.retry}>Try again</Text></TouchableOpacity>
        </View>
      ) : loading && !hasData ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : results ? (
        results.length ? results.map(renderItem) : (
          <View style={styles.box}><Text style={styles.msg}>{query.trim() ? `No results for “${query}”` : `No ${noun}s found for ${selectedDateLabel}.`}</Text></View>
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
                    <Text accessibilityLabel={`${facultyDepartments.length || (departmentlessFacultyOption ? 1 : 0)} department options under this Skill Faculty`} style={styles.selectorCount}>{faculty ? `${facultyDepartments.length || (departmentlessFacultyOption ? 1 : 0)} total` : '—'}</Text>
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
            <View style={styles.emptyWrap}>
              <View style={styles.emptyPanel}>
                <View style={styles.emptyArt}>
                  <Animated.View style={[styles.emptyOrbit, styles.emptyOrbitOuter, {transform: [{translateY: emptyMotion.interpolate({inputRange: [0, 1], outputRange: [0, -5]})}, {rotate: emptyMotion.interpolate({inputRange: [0, 1], outputRange: ['-7deg', '7deg']})}]}]} />
                  <Animated.View style={[styles.emptyOrbit, styles.emptyOrbitInner, {transform: [{translateY: emptyMotion.interpolate({inputRange: [0, 1], outputRange: [0, 4]})}, {rotate: emptyMotion.interpolate({inputRange: [0, 1], outputRange: ['8deg', '-8deg']})}]}]} />
                  <View style={styles.emptyIconHalo}>
                    <Icon name={noun === 'event' ? 'calendar-outline' : 'notifications-outline'} size={32} color={colors.primary} />
                  </View>
                  <Animated.View style={[styles.emptySparkle, {opacity: emptyMotion.interpolate({inputRange: [0, 0.5, 1], outputRange: [0.55, 1, 0.55]}), transform: [{scale: emptyMotion.interpolate({inputRange: [0, 1], outputRange: [0.85, 1.12]})}]}]}>
                    <Icon name="sparkles-outline" size={17} color={colors.primary2} />
                  </Animated.View>
                  <View style={styles.emptyDot} />
                </View>
                <Text style={styles.emptyEyebrow}>{noun === 'event' ? 'CAMPUS EVENTS' : 'CAMPUS NOTICES'}</Text>
                <Text style={styles.emptyTitle}>{group === 'Skill Faculty' && !faculty
                  ? 'Pick your campus community'
                  : group === 'Skill Faculty' && !selectedDepartment
                    ? 'Choose a department to explore'
                    : 'Your next ' + (noun === 'event' ? 'campus moment' : 'important update') + ' is on its way'}</Text>
                <Text style={styles.emptyDescription}>{group === 'Skill Faculty' && !faculty
                  ? 'Choose a Skill Faculty above to find events and updates for that community.'
                  : group === 'Skill Faculty' && !selectedDepartment
                    ? facultyDepartments.length ? 'Select a department to see its ' + noun + 's and updates.' : 'This Skill Faculty has no child departments. Choose its name above to see its posts.'
                    : 'There are no ' + noun + 's to show in this space right now. Check back soon for something new.'}</Text>
                {group === 'Skill Faculty' && (!faculty || !selectedDepartment) ? (
                  <TouchableOpacity activeOpacity={0.8} onPress={() => setPicker(faculty ? 'department' : 'faculty')} style={styles.emptyAction}>
                    <Text style={styles.emptyActionText}>{faculty ? 'Choose a department' : 'Choose a Skill Faculty'}</Text>
                    <Icon name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity activeOpacity={0.8} onPress={refresh} style={styles.emptyRefresh}>
                    <Icon name="refresh-outline" size={15} color={colors.primary} />
                    <Text style={styles.emptyRefreshText}>Check again</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </>
      )}

      <BottomSheet visible={picker === 'faculty'} onClose={() => setPicker(null)}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Choose a Skill Faculty</Text>
          <Text style={styles.pickerSubtitle}>{facultyDepartments.length ? 'Choose a department under this faculty.' : 'This faculty has no departments, so its own name is shown as the department option.'}</Text>
        </View>
        {skillFaculties.map(item => {
          const selected = faculty?.id === item.id;
          return (
            <TouchableOpacity key={item.id} activeOpacity={0.75} onPress={() => {
              const hasDepartments = departments.some(department => department.skill_faculty_id === item.id);
              setSubs(prev => ({...prev, faculty: item.code, department: hasDepartments ? null : item.code}));
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
        }) : departmentlessFacultyOption ? (
          <TouchableOpacity activeOpacity={0.75} onPress={() => {
            setSubs(prev => ({...prev, department: faculty.code}));
            setPicker(null);
          }} style={[styles.pickerRow, selectedDepartment && styles.pickerRowSelected]}>
            <View style={[styles.departmentPickerIcon, selectedDepartment && styles.pickerCodeSelected]}><Icon name="school-outline" size={17} color={selectedDepartment ? colors.primary : colors.mute} /></View>
            <Text numberOfLines={2} style={styles.pickerRowName}>{faculty.name}</Text>
            {selectedDepartment && <Icon name="checkmark-circle" size={19} color={colors.primary} />}
          </TouchableOpacity>
        ) : <Text style={styles.emptyFilters}>Choose a Skill Faculty first.</Text>}
      </BottomSheet>

      <BottomSheet visible={picker === 'date'} onClose={() => setPicker(null)}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Choose a date</Text>
          <Text style={styles.pickerSubtitle}>Show {noun}s for a specific day.</Text>
        </View>
        <MiniCalendar
          year={dateCursor.year}
          month={dateCursor.month}
          marked={dateMarked}
          selected={selectedDate && selectedDate.startsWith(datePrefix) ? Number(selectedDate.slice(8, 10)) : null}
          today={dateCursor.year === new Date().getFullYear() && dateCursor.month === new Date().getMonth() ? new Date().getDate() : null}
          onSelect={day => {
            setSelectedDate(`${datePrefix}${String(day).padStart(2, '0')}`);
            setPicker(null);
          }}
          onPrev={() => moveDateMonth(-1)}
          onNext={() => moveDateMonth(1)}
        />
        {selectedDate ? (
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} onPress={() => {
            setSelectedDate(null);
            setPicker(null);
          }} style={styles.clearDateButton}>
            <Text style={styles.clearDateText}>Clear date filter</Text>
          </TouchableOpacity>
        ) : null}
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
  selectedDateChip: {alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: -7, marginBottom: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#EFEDFF'},
  selectedDateText: {fontSize: 9, fontWeight: '900', letterSpacing: 0.35, color: colors.primary},
  clearDateButton: {alignSelf: 'center', marginTop: 3, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.soft},
  clearDateText: {fontSize: 11, fontWeight: '800', color: colors.primary},
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
  emptyWrap: {paddingTop: 8, paddingBottom: 28},
  emptyPanel: {alignItems: 'center', overflow: 'hidden', borderRadius: 24, borderWidth: 1, borderColor: '#fff', backgroundColor: '#fff', paddingHorizontal: 22, paddingTop: 24, paddingBottom: 26, shadowColor: '#3C3296', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: {width: 0, height: 8}, elevation: 3},
  emptyArt: {width: 124, height: 112, alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  emptyOrbit: {position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: '#E4E2FF', backgroundColor: '#F8F7FF'},
  emptyOrbitOuter: {width: 106, height: 106},
  emptyOrbitInner: {width: 78, height: 78, borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.7)'},
  emptyIconHalo: {width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: '#fff', backgroundColor: colors.soft, shadowColor: colors.primary, shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: {width: 0, height: 5}, elevation: 3},
  emptySparkle: {position: 'absolute', top: 7, right: 11, width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#fff', shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2},
  emptyDot: {position: 'absolute', bottom: 15, left: 13, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent},
  emptyEyebrow: {marginBottom: 8, color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.7},
  emptyTitle: {maxWidth: 280, color: colors.ink, fontSize: 18, lineHeight: 25, fontWeight: '800', textAlign: 'center'},
  emptyDescription: {maxWidth: 300, marginTop: 8, color: colors.mute, fontSize: 12, lineHeight: 19, fontWeight: '500', textAlign: 'center'},
  emptyAction: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 17, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 13, backgroundColor: colors.primary},
  emptyActionText: {color: '#fff', fontSize: 11, fontWeight: '800'},
  emptyRefresh: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.soft},
  emptyRefreshText: {color: colors.primary, fontSize: 11, fontWeight: '800'},
  box: {alignItems: 'center', paddingVertical: 36},
  msg: {textAlign: 'center', color: colors.mute, fontWeight: '600', lineHeight: 24},
  retry: {marginTop: 12, color: colors.primary, fontWeight: '800'},
});
