import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../Components/Screen';
import ScreenHeader from '../Components/ScreenHeader';
import PrimaryButton from '../Components/PrimaryButton';
import {colors, gradients, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';
import {rollNumberFromEmail} from '../Services/emailRules';

const EMPTY_FORM = {user_name: '', user_type: '', department_id: '', course: '', batch: '', semester: '', password: '', confirm: ''};
const SEMESTER_OPTIONS = Array.from({length: 8}, (_, index) => String(index + 1));
const BATCH_OPTIONS = Array.from({length: 20}, (_, index) => {
  const startYear = 2018 + index;
  return `${startYear}–${startYear + 4}`;
});

export default function ProfileSetup() {
  const {session, profile, departments, profileStatus, error, refresh, completeProfile, setPassword, signOut} = useApp();
  const roll = rollNumberFromEmail(session?.user?.email);
  const suggestedUserType = roll ? 'student' : 'faculty';
  const needsPassword = !session?.user?.user_metadata?.password_set;
  const [form, setForm] = useState(EMPTY_FORM);
  const isStudent = form.user_type === 'student';
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const update = (key, value) => setForm(prev => ({...prev, [key]: value}));
  const selectedDepartment = departments.find(item => item.id === form.department_id);
  const filteredDepartments = useMemo(() => {
    const query = departmentSearch.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter(item => `${item.name} ${item.code}`.toLowerCase().includes(query));
  }, [departments, departmentSearch]);

  useEffect(() => {
    if (profileStatus !== 'missing' || !profile) return;
    setForm({
      ...EMPTY_FORM,
      user_type: suggestedUserType,
      user_name: profile.user_name || '',
      user_type: profile.user_type || suggestedUserType,
      department_id: profile.department_id || '',
      course: profile.course || '',
      batch: profile.batch || '',
      semester: profile.semester ? String(profile.semester) : '',
    });
  }, [profile, profileStatus, suggestedUserType]);

  const submit = async () => {
    const name = form.user_name.trim();
    if (!name) return Alert.alert('Name required', 'Enter your full name to continue.');
    if (!form.department_id) return Alert.alert('Department required', 'Choose your department to continue.');
    if (isStudent && !roll) {
      return Alert.alert('Student email required', 'Student profiles need a roll number email.');
    }
    if (isStudent && (!form.course.trim() || !form.batch || !form.semester)) {
      return Alert.alert('Complete student details', 'Enrollment number, course, batch, and semester are all required.');
    }
    if (isStudent && !SEMESTER_OPTIONS.includes(form.semester)) {
      return Alert.alert('Choose a semester', 'Select a semester from 1 to 8.');
    }
    if (needsPassword) {
      if (form.password.length < 8) return Alert.alert('Password too short', 'Use at least 8 characters.');
      if (form.password !== form.confirm) return Alert.alert('Passwords do not match', 'Type the same password twice.');
    }

    setSaving(true);
    setSaveError('');
    try {
      const details = {
        user_name: name,
        user_type: form.user_type,
        department_id: form.department_id,
        ...(isStudent && {
          enroll_no: roll,
          course: form.course.trim(),
          batch: form.batch,
          semester: Number(form.semester),
        }),
      };
      if (needsPassword) await setPassword(form.password);
      await completeProfile(details);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openDepartments = () => {
    if (!departments.length && error) {
      refresh();
      return;
    }
    setDepartmentSearch('');
    setDepartmentOpen(true);
  };

  if (profileStatus === 'error') {
    return (
      <Screen>
        <ScreenHeader title="Student profile" subtitle="We couldn't load your account" />
        <View style={styles.errorCard}>
          <View style={styles.errorIcon}><Icon name="alert-circle-outline" size={25} color={colors.danger} /></View>
          <Text style={styles.errorTitle}>Couldn’t load profile details</Text>
          <Text style={styles.errorText}>{error || 'Please check your connection and try again.'}</Text>
          <PrimaryButton label="Try again" onPress={refresh} style={styles.errorButton} />
          <TouchableOpacity onPress={signOut} style={styles.signOutLink}>
            <Text style={styles.linkText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Complete your profile" subtitle="A few details to get started" />

      <LinearGradient colors={gradients.brand} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}><Icon name="sparkles-outline" size={22} color={colors.primary} /></View>
          <View style={styles.stepPill}><Text style={styles.stepText}>FINAL STEP</Text></View>
        </View>
        <Text style={styles.heroTitle}>Make UniVents yours</Text>
        <Text style={styles.heroText}>Add your details so we can show events and notices for your campus life.</Text>
        <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
      </LinearGradient>

      <View style={styles.card}>
        <SectionTitle icon="person-outline" title="About you" subtitle="Your verified account details" />
        <Field label="Full name" value={form.user_name} onChangeText={v => update('user_name', v)} placeholder="Enter your full name" />
        <ReadOnlyField icon="mail-outline" label="Verified university email" value={session?.user?.email || ''} verified />
      </View>

      <View style={styles.card}>
        <SectionTitle icon="school-outline" title="Profile details" subtitle="Choose your account type" />
        <Text style={styles.label}>User type</Text>
        <View style={styles.userTypeRow}>
          {['student', 'faculty'].map(type => {
            const selected = form.user_type === type;
            return (
              <TouchableOpacity key={type} accessibilityRole="radio" accessibilityState={{selected}} onPress={() => update('user_type', type)} style={[styles.userTypeOption, selected && styles.userTypeOptionSelected]}>
                <Icon name={type === 'student' ? 'school-outline' : 'person-outline'} size={18} color={selected ? colors.primary : colors.mute} />
                <Text style={[styles.userTypeText, selected && styles.userTypeTextSelected]}>{type === 'student' ? 'Student' : 'Faculty'}</Text>
                {selected && <Icon name="checkmark-circle" size={17} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Department</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={openDepartments} style={styles.departmentTrigger}>
          <View style={styles.departmentIcon}><Icon name="business-outline" size={18} color={colors.primary} /></View>
          <View style={styles.departmentSelected}>
            <Text numberOfLines={1} style={[styles.departmentSelectedName, !selectedDepartment && styles.placeholder]}>
              {selectedDepartment?.name || (departments.length ? 'Choose your department' : error ? 'Tap to retry loading' : 'Loading departments…')}
            </Text>
            {!!selectedDepartment && <Text style={styles.departmentSelectedCode}>{selectedDepartment.code}</Text>}
          </View>
          <Icon name={departments.length ? 'chevron-down' : 'refresh-outline'} size={19} color={colors.mute} />
        </TouchableOpacity>

        {isStudent && <>
          <ReadOnlyField icon="barcode-outline" label="Roll number" value={roll || 'Could not read roll number'} />
          <Field label="Course" value={form.course} onChangeText={v => update('course', v)} placeholder="e.g. B.Tech Computer Science" />
          <View style={styles.studentOptionsRow}>
            <View style={styles.studentOptionColumn}>
              <Text style={styles.label}>Batch</Text>
              <BatchOptions value={form.batch} onChange={value => update('batch', value)} />
            </View>
            <View style={styles.studentOptionColumn}>
              <Text style={styles.label}>Semester</Text>
              <SemesterOptions value={form.semester} onChange={value => update('semester', value)} />
            </View>
          </View>
        </>}
      </View>

      {needsPassword && (
        <View style={styles.card}>
          <SectionTitle icon="lock-closed-outline" title="Create a password" subtitle="At least 8 characters, for future sign-ins" />
          <Field label="Password" value={form.password} onChangeText={v => update('password', v)} placeholder="At least 8 characters" secureTextEntry />
          <Field label="Confirm password" value={form.confirm} onChangeText={v => update('confirm', v)} placeholder="Enter it again" secureTextEntry />
        </View>
      )}

      {!!saveError && <View style={styles.saveErrorBox}><Icon name="alert-circle-outline" size={18} color={colors.danger} /><Text style={styles.saveError}>{saveError}</Text></View>}
      <PrimaryButton label={saving ? 'Saving your profile…' : 'Save and continue'} onPress={saving ? () => {} : submit} style={styles.submitButton} />
      <TouchableOpacity onPress={signOut} style={styles.signOutLink}>
        <Text style={styles.linkText}>Sign out</Text>
      </TouchableOpacity>

      <Modal visible={departmentOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setDepartmentOpen(false)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={() => setDepartmentOpen(false)} />
          <View style={styles.departmentSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Choose department</Text>
                <Text style={styles.sheetSubtitle}>{departments.length} departments available</Text>
              </View>
              <TouchableOpacity onPress={() => setDepartmentOpen(false)} style={styles.closeButton}>
                <Icon name="close" size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Icon name="search-outline" size={19} color={colors.mute} />
              <TextInput
                style={styles.searchInput}
                value={departmentSearch}
                onChangeText={setDepartmentSearch}
                placeholder="Search departments"
                placeholderTextColor="#9298B1"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!!departmentSearch && <TouchableOpacity onPress={() => setDepartmentSearch('')}><Icon name="close-circle" size={18} color={colors.mute} /></TouchableOpacity>}
            </View>
            <ScrollView style={styles.departmentResults} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {filteredDepartments.map(department => {
                const active = form.department_id === department.id;
                return (
                  <TouchableOpacity
                    key={department.id}
                    activeOpacity={0.75}
                    onPress={() => {
                      update('department_id', department.id);
                      setDepartmentOpen(false);
                    }}
                    style={[styles.departmentOption, active && styles.departmentOptionActive]}>
                    <View style={[styles.departmentOptionIcon, active && styles.departmentOptionIconActive]}>
                      <Icon name="business-outline" size={17} color={active ? colors.primary : colors.mute} />
                    </View>
                    <View style={styles.departmentOptionCopy}>
                      <Text style={styles.departmentOptionName}>{department.name}</Text>
                      <Text style={styles.departmentOptionCode}>{department.code}</Text>
                    </View>
                    {active && <Icon name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
              {!filteredDepartments.length && <Text style={styles.noResults}>No departments match “{departmentSearch}”.</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function SectionTitle({icon, title, subtitle}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}><Icon name={icon} size={18} color={colors.primary} /></View>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ReadOnlyField({icon, label, value, verified = false}) {
  return (
    <View style={styles.readOnlyBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.readOnlyField}>
        <Icon name={icon} size={17} color={colors.mute} />
        <Text numberOfLines={1} style={styles.readOnlyText}>{value}</Text>
        {verified && <Icon name="checkmark-circle" size={18} color={colors.success} />}
      </View>
    </View>
  );
}

function Field({label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, containerStyle}) {
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9298B1"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={secureTextEntry || keyboardType === 'email-address' ? 'none' : 'words'}
      />
    </View>
  );
}

function SemesterOptions({value, onChange}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded: open}} onPress={() => setOpen(true)} style={styles.studentOptionTrigger}>
        <Text style={[styles.semesterTriggerText, !value && styles.placeholder]}>{value || 'Choose semester'}</Text>
        <Icon name="chevron-down" size={18} color={colors.mute} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={() => setOpen(false)} />
          <View style={styles.departmentSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View><Text style={styles.sheetTitle}>Choose semester</Text><Text style={styles.sheetSubtitle}>Select from 1 to 8</Text></View>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeButton}><Icon name="close" size={20} color={colors.ink} /></TouchableOpacity>
            </View>
            {SEMESTER_OPTIONS.map(option => {
              const active = value === option;
              return (
                <TouchableOpacity key={option} accessibilityRole="radio" accessibilityState={{selected: active}} onPress={() => { onChange(option); setOpen(false); }} style={[styles.departmentOption, active && styles.departmentOptionActive]}>
                  <View style={[styles.departmentOptionIcon, active && styles.departmentOptionIconActive]}><Icon name="school-outline" size={17} color={active ? colors.primary : colors.mute} /></View>
                  <View style={styles.departmentOptionCopy}><Text style={styles.departmentOptionName}>Semester {option}</Text></View>
                  {active && <Icon name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

function BatchOptions({value, onChange}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded: open}} onPress={() => setOpen(current => !current)} style={styles.studentOptionTrigger}>
        <Text numberOfLines={1} style={[styles.studentOptionTriggerText, !value && styles.placeholder]}>{value || 'Select batch'}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={17} color={colors.mute} />
      </TouchableOpacity>
      {open && <ScrollView style={styles.batchOptions} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {BATCH_OPTIONS.map(option => (
          <TouchableOpacity key={option} accessibilityRole="radio" accessibilityState={{selected: value === option}} onPress={() => { onChange(option); setOpen(false); }} style={[styles.batchOption, value === option && styles.semesterOptionSelected]}>
            <Text style={[styles.semesterOptionText, value === option && styles.semesterOptionTextSelected]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {borderRadius: 24, padding: 20, marginBottom: 14, overflow: 'hidden', ...shadow},
  heroTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14},
  heroIcon: {width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  stepPill: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)'},
  stepText: {fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1},
  heroTitle: {fontSize: 21, fontWeight: '800', color: '#fff', letterSpacing: -0.3},
  heroText: {fontSize: 12.5, lineHeight: 18, color: 'rgba(255,255,255,0.88)', marginTop: 5},
  progressTrack: {height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.28)', marginTop: 17},
  progressFill: {width: '78%', height: 4, borderRadius: 4, backgroundColor: '#fff'},
  card: {backgroundColor: '#fff', borderRadius: 22, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EAECF6', ...shadow},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 7},
  sectionIcon: {width: 36, height: 36, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', marginRight: 10},
  sectionCopy: {flex: 1},
  sectionTitle: {fontSize: 15, fontWeight: '800', color: colors.ink},
  sectionSubtitle: {fontSize: 11, color: colors.mute, marginTop: 2},
  field: {marginTop: 11},
  label: {fontSize: 11.5, fontWeight: '700', color: colors.mute, marginBottom: 6},
  input: {minHeight: 46, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FAFAFE', borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontWeight: '600', color: colors.ink},
  readOnlyBlock: {marginTop: 11},
  readOnlyField: {minHeight: 44, borderWidth: 1, borderColor: colors.line, backgroundColor: '#F7F8FD', borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9},
  readOnlyText: {flex: 1, color: colors.ink, fontSize: 12.5, fontWeight: '600'},
  departmentTrigger: {minHeight: 54, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FAFAFE', borderRadius: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10},
  departmentIcon: {width: 34, height: 34, borderRadius: 11, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  departmentSelected: {flex: 1},
  departmentSelectedName: {fontSize: 12.5, fontWeight: '700', color: colors.ink},
  departmentSelectedCode: {fontSize: 10.5, fontWeight: '700', color: colors.mute, marginTop: 2},
  placeholder: {color: '#9298B1'},
  userTypeRow: {flexDirection: 'row', gap: 10, marginBottom: 6},
  userTypeOption: {flex: 1, minHeight: 46, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7},
  userTypeOptionSelected: {borderColor: colors.primary, backgroundColor: colors.soft},
  userTypeText: {fontSize: 12, fontWeight: '700', color: colors.mute},
  userTypeTextSelected: {color: colors.primary},
  studentOptionsRow: {flexDirection: 'row', gap: 10, marginTop: 11},
  studentOptionColumn: {flex: 1, minWidth: 0},
  studentOptionTrigger: {minHeight: 46, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FAFAFE', borderRadius: 13, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4},
  studentOptionTriggerText: {flex: 1, fontSize: 12, fontWeight: '600', color: colors.ink},
  batchOptions: {maxHeight: 180, borderWidth: 1, borderColor: colors.line, borderRadius: 12, marginTop: 6, backgroundColor: '#fff'},
  batchOption: {minHeight: 38, justifyContent: 'center', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.line},
  semesterTrigger: {minHeight: 46, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FAFAFE', borderRadius: 13, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4},
  semesterTriggerText: {flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink},
  semesterOptions: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginTop: 8},
  semesterOption: {width: '23%', height: 40, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: '#FAFAFE', alignItems: 'center', justifyContent: 'center'},
  semesterOptionSelected: {borderColor: colors.primary, backgroundColor: colors.soft},
  semesterOptionText: {fontSize: 13, fontWeight: '700', color: colors.ink},
  semesterOptionTextSelected: {color: colors.primary},
  submitButton: {marginTop: 3},
  saveErrorBox: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 13, backgroundColor: '#FFF1EE', marginBottom: 10},
  saveError: {flex: 1, fontSize: 12, lineHeight: 18, color: colors.danger},
  signOutLink: {alignItems: 'center', paddingVertical: 16},
  linkText: {fontSize: 12, fontWeight: '700', color: colors.primary},
  errorCard: {backgroundColor: '#fff', borderRadius: 22, padding: 20, alignItems: 'center', ...shadow},
  errorIcon: {width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF1EE', alignItems: 'center', justifyContent: 'center'},
  errorTitle: {fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 12},
  errorText: {fontSize: 12.5, lineHeight: 19, color: colors.mute, textAlign: 'center', marginTop: 7},
  errorButton: {width: '100%', marginTop: 16},
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  modalBackdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,20,43,0.48)'},
  departmentSheet: {backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 28, maxHeight: '82%'},
  sheetHandle: {width: 38, height: 4, borderRadius: 2, backgroundColor: '#D7DAE8', alignSelf: 'center', marginBottom: 15},
  sheetHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14},
  sheetTitle: {fontSize: 18, fontWeight: '800', color: colors.ink},
  sheetSubtitle: {fontSize: 11.5, color: colors.mute, marginTop: 3},
  closeButton: {width: 36, height: 36, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  searchBox: {height: 46, borderRadius: 13, backgroundColor: '#F3F4FA', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10},
  searchInput: {flex: 1, paddingVertical: 8, fontSize: 13, color: colors.ink},
  departmentResults: {flexGrow: 0},
  departmentOption: {minHeight: 57, borderRadius: 13, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4},
  departmentOptionActive: {backgroundColor: colors.soft},
  departmentOptionIcon: {width: 34, height: 34, borderRadius: 11, backgroundColor: '#F3F4F8', alignItems: 'center', justifyContent: 'center'},
  departmentOptionIconActive: {backgroundColor: '#fff'},
  departmentOptionCopy: {flex: 1},
  departmentOptionName: {fontSize: 12, lineHeight: 17, fontWeight: '700', color: colors.ink},
  departmentOptionCode: {fontSize: 10.5, fontWeight: '600', color: colors.mute, marginTop: 2},
  noResults: {fontSize: 12, color: colors.mute, textAlign: 'center', paddingVertical: 24},
});
