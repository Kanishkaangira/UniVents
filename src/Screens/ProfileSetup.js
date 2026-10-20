import React, {useEffect, useMemo, useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../Components/Screen';
import ScreenHeader from '../Components/ScreenHeader';
import PrimaryButton from '../Components/PrimaryButton';
import {colors, gradients, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';
import {rollNumberFromEmail} from '../Services/emailRules';

const EMPTY_FORM = {user_name: '', user_type: '', skill_faculty_id: '', department_id: '', enroll_no: '', course: '', batch: '', semester: '', password: '', confirm: ''};
const USER_TYPES = [
  {type: 'student', label: 'Student', icon: 'school-outline'},
  {type: 'faculty', label: 'Faculty', icon: 'person-outline'},
  {type: 'administration', label: 'Administration', icon: 'business-outline'},
];
const SEMESTER_OPTIONS = Array.from({length: 8}, (_, index) => String(index + 1));
const YEAR_OPTIONS = Array.from({length: 25}, (_, index) => String(2018 + index));

export default function ProfileSetup() {
  const {session, profile, skillFaculties, departments, profileStatus, error, refresh, completeProfile, setPassword, signOut} = useApp();
  const roll = rollNumberFromEmail(session?.user?.email);
  const suggestedUserType = roll ? 'student' : 'faculty';
  // Require password setup while creating the profile, even if auth metadata
  // already contains a stale password_set flag from an earlier attempt.
  const needsPassword = !profile?.id;
  const [form, setForm] = useState(EMPTY_FORM);
  const isStudent = form.user_type === 'student';
  const isAdministration = form.user_type === 'administration';
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [pickerMode, setPickerMode] = useState(null);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const changeForm = updater => {
    setForm(prev => typeof updater === 'function' ? updater(prev) : {...prev, ...updater});
    setValidationError('');
  };
  const update = (key, value) => changeForm(prev => ({...prev, [key]: value}));
  const selectedFaculty = skillFaculties.find(item => item.id === form.skill_faculty_id);
  const facultyDepartments = selectedFaculty
    ? [...new Map(departments.filter(item => item.skill_faculty_id === selectedFaculty.id)
      .map(item => [String(item.name || '').trim().toLowerCase(), item])).values()]
    : [];
  const departmentlessFacultySelected = Boolean(selectedFaculty && facultyDepartments.length === 0 && !form.department_id);
  const selectedDepartment = facultyDepartments.find(item => item.id === form.department_id)
    || (departmentlessFacultySelected ? selectedFaculty : null);
  const filteredFaculties = useMemo(() => {
    const query = departmentSearch.trim().toLowerCase();
    if (!query) return skillFaculties;
    return skillFaculties.filter(item => `${item.name} ${item.code}`.toLowerCase().includes(query));
  }, [skillFaculties, departmentSearch]);
  const filteredDepartments = useMemo(() => {
    const query = departmentSearch.trim().toLowerCase();
    if (!query) return facultyDepartments;
    return facultyDepartments.filter(item => `${item.name} ${item.code}`.toLowerCase().includes(query));
  }, [facultyDepartments, departmentSearch]);

  useEffect(() => {
    if (profileStatus !== 'missing') return;
    setForm({
      ...EMPTY_FORM,
      user_type: profile?.user_type || suggestedUserType,
      user_name: profile?.user_name || '',
      skill_faculty_id: profile?.skill_faculty_id
        || departments.find(item => item.id === profile?.department_id)?.skill_faculty_id
        || skillFaculties.find(item => item.id === profile?.department_id)?.id
        || '',
      department_id: departments.some(item => item.id === profile?.department_id)
        ? profile.department_id
        : '',
      enroll_no: profile?.enroll_no || roll || '',
      course: profile?.course || '',
      batch: profile?.batch || '',
      batchStart: profile?.batch?.match(/^(\d{4})\s*[-–]\s*(\d{4})$/)?.[1] || '',
      batchEnd: profile?.batch?.match(/^(\d{4})\s*[-–]\s*(\d{4})$/)?.[2] || '',
      semester: profile?.semester ? String(profile.semester) : '',
    });
  }, [profile, profileStatus, suggestedUserType, departments, skillFaculties]);

  const submit = async () => {
    const name = form.user_name.trim();
    const missingDetails = [];
    if (!name) missingDetails.push('name');
    if (!USER_TYPES.some(option => option.type === form.user_type)) missingDetails.push('account type');
    if (!isAdministration) {
      const faculty = skillFaculties.find(item => item.id === form.skill_faculty_id);
      const childDepartments = faculty ? departments.filter(item => item.skill_faculty_id === faculty.id) : [];
      const selectedChildDepartment = childDepartments.find(item => item.id === form.department_id);
      const departmentChoiceMissing = childDepartments.length > 0 && !selectedChildDepartment;
      if (!faculty) missingDetails.push('Skill Faculty');
      if (departmentChoiceMissing) missingDetails.push('Department');
    }
    if (isStudent) {
      if (!form.enroll_no.trim()) missingDetails.push('enrollment number');
      if (!form.course.trim()) missingDetails.push('course');
      if (!form.batchStart) missingDetails.push('batch start year');
      if (!form.batchEnd) missingDetails.push('batch end year');
      if (!form.semester) missingDetails.push('semester');
    }
    if (needsPassword) {
      if (!form.password) missingDetails.push('password');
      if (!form.confirm) missingDetails.push('password confirmation');
    }
    if (missingDetails.length) {
      setValidationError('Please fill in all required details before continuing.');
      return;
    }
    if (isStudent && Number(form.batchEnd) < Number(form.batchStart)) {
      setValidationError('The batch end year must be the same as or later than the start year.');
      return;
    }
    if (isStudent && !SEMESTER_OPTIONS.includes(form.semester)) {
      setValidationError('Choose a semester from 1 to 8.');
      return;
    }
    if (needsPassword && form.password.length < 8) {
      setValidationError('Use a password with at least 8 characters.');
      return;
    }
    if (needsPassword && form.password !== form.confirm) {
      setValidationError('The passwords do not match. Please check them and try again.');
      return;
    }

    setSaving(true);
    setValidationError('');
    setSaveError('');
    try {
      const details = {
        user_name: name,
        user_type: form.user_type,
        department_id: isAdministration ? null : (facultyDepartments.find(item => item.id === form.department_id)?.id || null),
        skill_faculty_id: isAdministration ? null : form.skill_faculty_id,
        ...(isStudent && {
          enroll_no: form.enroll_no.trim(),
          course: form.course.trim(),
          batch: `${form.batchStart}-${form.batchEnd}`,
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

  const openPicker = mode => {
    if ((!skillFaculties.length || (mode === 'department' && !facultyDepartments.length)) && error) {
      refresh();
      return;
    }
    setDepartmentSearch('');
    setPickerMode(mode);
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
          {USER_TYPES.map(({type, label, icon}) => {
            const selected = form.user_type === type;
            return (
              <TouchableOpacity key={type} accessibilityRole="radio" accessibilityState={{selected}} onPress={() => changeForm(prev => ({...prev, user_type: type, ...(type === 'administration' ? {skill_faculty_id: '', department_id: ''} : {})}))} style={[styles.userTypeOption, type === 'administration' && styles.userTypeOptionWide, selected && styles.userTypeOptionSelected]}>
                <Icon name={icon} size={18} color={selected ? colors.primary : colors.mute} />
                <Text style={[styles.userTypeText, selected && styles.userTypeTextSelected]}>{label}</Text>
                {selected && <Icon name="checkmark-circle" size={17} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {!isAdministration && <>
          <Text style={styles.label}>Skill Faculty</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => openPicker('faculty')} style={styles.departmentTrigger}>
            <View style={styles.departmentIcon}><Icon name="school-outline" size={18} color={colors.primary} /></View>
            <View style={styles.departmentSelected}>
              <Text numberOfLines={1} style={[styles.departmentSelectedName, !selectedFaculty && styles.placeholder]}>{selectedFaculty?.name || (skillFaculties.length ? 'Choose your Skill Faculty' : error ? 'Tap to retry loading' : 'Loading Skill Faculties…')}</Text>
              {!!selectedFaculty && <Text style={styles.departmentSelectedCode}>{selectedFaculty.code}</Text>}
            </View>
            <Icon name={skillFaculties.length ? 'chevron-down' : 'refresh-outline'} size={19} color={colors.mute} />
          </TouchableOpacity>
          <Text style={[styles.label, {marginTop: 12}]}>Department (if applicable)</Text>
          <TouchableOpacity activeOpacity={selectedFaculty ? 0.8 : 1} disabled={!selectedFaculty} onPress={() => openPicker('department')} style={[styles.departmentTrigger, !selectedFaculty && styles.departmentTriggerDisabled]}>
            <View style={styles.departmentIcon}><Icon name="business-outline" size={18} color={selectedFaculty ? colors.primary : colors.mute} /></View>
            <View style={styles.departmentSelected}>
              <Text numberOfLines={1} style={[styles.departmentSelectedName, !selectedDepartment && styles.placeholder]}>{selectedDepartment?.name || (selectedFaculty ? 'Choose a department' : 'Choose a Skill Faculty first')}</Text>
              {departmentlessFacultySelected && <Text style={styles.departmentSelectedCode}>No separate department</Text>}
            </View>
            {selectedFaculty && <Icon name="chevron-down" size={19} color={colors.mute} />}
          </TouchableOpacity>
        </>}

        {isStudent && <>
          <Field label="Enrollment number" value={form.enroll_no} onChangeText={v => update('enroll_no', v)} placeholder="Enter your enrollment number" />
          <Field label="Course" value={form.course} onChangeText={v => update('course', v)} placeholder="e.g. B.Tech Computer Science" />
          <View style={styles.batchField}>
            <Text style={styles.label}>Batch period</Text>
            <BatchOptions
              startYear={form.batchStart}
              endYear={form.batchEnd}
              onChangeStart={value => changeForm(prev => ({...prev, batchStart: value, batchEnd: prev.batchEnd && Number(prev.batchEnd) < Number(value) ? '' : prev.batchEnd}))}
              onChangeEnd={value => changeForm(prev => ({...prev, batchEnd: value}))}
            />
          </View>
          <View style={styles.semesterField}>
            <Text style={styles.label}>Semester</Text>
            <SemesterOptions value={form.semester} onChange={value => update('semester', value)} />
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

      {!!validationError && <View accessibilityRole="alert" style={styles.validationErrorBox}><Icon name="alert-circle" size={18} color={colors.danger} /><Text style={styles.validationErrorText}>{validationError}</Text></View>}
      {!!saveError && <View style={styles.saveErrorBox}><Icon name="alert-circle-outline" size={18} color={colors.danger} /><Text style={styles.saveError}>{saveError}</Text></View>}
      <PrimaryButton label={saving ? 'Saving your profile…' : 'Save and continue'} onPress={saving ? () => {} : submit} style={styles.submitButton} />
      <TouchableOpacity onPress={signOut} style={styles.signOutLink}>
        <Text style={styles.linkText}>Sign out</Text>
      </TouchableOpacity>

      <Modal visible={Boolean(pickerMode)} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setPickerMode(null)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={() => setPickerMode(null)} />
          <View style={styles.departmentSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>{pickerMode === 'faculty' ? 'Choose Skill Faculty' : 'Choose Department'}</Text>
                <Text style={styles.sheetSubtitle}>{pickerMode === 'faculty' ? `${skillFaculties.length} Skill Faculties available` : facultyDepartments.length === 0 ? 'No departments listed; choose the faculty name.' : `${facultyDepartments.length} departments in ${selectedFaculty?.name || 'this faculty'}`}</Text>
              </View>
              <TouchableOpacity onPress={() => setPickerMode(null)} style={styles.closeButton}>
                <Icon name="close" size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Icon name="search-outline" size={19} color={colors.mute} />
              <TextInput
                style={styles.searchInput}
                value={departmentSearch}
                onChangeText={setDepartmentSearch}
                placeholder={pickerMode === 'faculty' ? 'Search Skill Faculties' : 'Search departments'}
                placeholderTextColor="#9298B1"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!!departmentSearch && <TouchableOpacity onPress={() => setDepartmentSearch('')}><Icon name="close-circle" size={18} color={colors.mute} /></TouchableOpacity>}
            </View>
            <ScrollView style={styles.departmentResults} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {pickerMode === 'faculty' ? filteredFaculties.map(faculty => {
                const active = form.skill_faculty_id === faculty.id;
                const hasDepartments = departments.some(department => department.skill_faculty_id === faculty.id);
                return (
                  <TouchableOpacity key={faculty.id} activeOpacity={0.75} onPress={() => {
                    changeForm(prev => ({...prev, skill_faculty_id: faculty.id, department_id: ''}));
                    setPickerMode(null);
                  }} style={[styles.departmentOption, active && styles.departmentOptionActive]}>
                    <View style={[styles.departmentOptionIcon, active && styles.departmentOptionIconActive]}><Icon name="school-outline" size={17} color={active ? colors.primary : colors.mute} /></View>
                    <View style={styles.departmentOptionCopy}><Text style={styles.departmentOptionName}>{faculty.name}</Text><Text style={styles.departmentOptionCode}>{faculty.code}{hasDepartments ? '' : ' · No departments'}</Text></View>
                    {active && <Icon name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }) : facultyDepartments.length ? filteredDepartments.map(department => {
                const active = form.department_id === department.id;
                return (
                  <TouchableOpacity key={department.id} activeOpacity={0.75} onPress={() => {
                    changeForm(prev => ({...prev, department_id: department.id}));
                    setPickerMode(null);
                  }} style={[styles.departmentOption, active && styles.departmentOptionActive]}>
                    <View style={[styles.departmentOptionIcon, active && styles.departmentOptionIconActive]}><Icon name="business-outline" size={17} color={active ? colors.primary : colors.mute} /></View>
                    <View style={styles.departmentOptionCopy}><Text style={styles.departmentOptionName}>{department.name}</Text></View>
                    {active && <Icon name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }) : selectedFaculty ? (
                <TouchableOpacity activeOpacity={0.75} onPress={() => {
                  changeForm(prev => ({...prev, department_id: ''}));
                  setPickerMode(null);
                }} style={[styles.departmentOption, departmentlessFacultySelected && styles.departmentOptionActive]}>
                  <View style={[styles.departmentOptionIcon, departmentlessFacultySelected && styles.departmentOptionIconActive]}><Icon name="school-outline" size={17} color={colors.primary} /></View>
                  <View style={styles.departmentOptionCopy}><Text style={styles.departmentOptionName}>No separate department</Text><Text style={styles.departmentOptionCode}>{selectedFaculty.name}</Text></View>
                  {departmentlessFacultySelected && <Icon name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ) : <Text style={styles.noResults}>Choose a Skill Faculty first.</Text>}
              {pickerMode === 'faculty' && !filteredFaculties.length && <Text style={styles.noResults}>No Skill Faculties match “{departmentSearch}”.</Text>}
              {pickerMode === 'department' && facultyDepartments.length > 0 && !filteredDepartments.length && <Text style={styles.noResults}>No departments match “{departmentSearch}”.</Text>}
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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const input = (
    <TextInput
      style={secureTextEntry ? styles.passwordInput : styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9298B1"
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry && !passwordVisible}
      autoCapitalize={secureTextEntry || keyboardType === 'email-address' ? 'none' : 'words'}
    />
  );
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      {secureTextEntry ? (
        <View style={styles.passwordInputWrap}>
          {input}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            onPress={() => setPasswordVisible(visible => !visible)}
            style={styles.passwordVisibilityButton}
            hitSlop={8}>
            <Icon name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mute} />
          </TouchableOpacity>
        </View>
      ) : input}
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

function BatchOptions({startYear, endYear, onChangeStart, onChangeEnd}) {
  const [picker, setPicker] = useState(null);
  const options = picker === 'end' && startYear ? YEAR_OPTIONS.filter(year => Number(year) >= Number(startYear)) : YEAR_OPTIONS;
  return (
    <>
      <View style={styles.batchPeriodCard}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Choose batch start year${startYear ? `, ${startYear}` : ''}`} onPress={() => setPicker('start')} style={styles.batchYearTrigger}>
          <Text style={styles.batchYearLabel}>START YEAR</Text>
          <View style={styles.batchYearValueRow}>
            <Text style={[styles.batchYearValue, !startYear && styles.batchYearPlaceholder]}>{startYear || 'Choose year'}</Text>
            <Icon name="chevron-down" size={17} color={colors.primary} />
          </View>
        </TouchableOpacity>
        <View style={styles.batchRangeDivider}>
          <View style={styles.batchRangeLine} />
          <Icon name="arrow-forward" size={15} color={colors.primary} />
          <View style={styles.batchRangeLine} />
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Choose batch end year${endYear ? `, ${endYear}` : ''}`} disabled={!startYear} onPress={() => setPicker('end')} style={[styles.batchYearTrigger, !startYear && styles.batchYearTriggerDisabled]}>
          <Text style={styles.batchYearLabel}>END YEAR</Text>
          <View style={styles.batchYearValueRow}>
            <Text style={[styles.batchYearValue, !endYear && styles.batchYearPlaceholder]}>{endYear || 'Choose year'}</Text>
            <Icon name="chevron-down" size={17} color={startYear ? colors.primary : colors.mute} />
          </View>
        </TouchableOpacity>
      </View>
      <Modal visible={Boolean(picker)} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setPicker(null)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={() => setPicker(null)} />
          <View style={styles.departmentSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View><Text style={styles.sheetTitle}>Choose {picker} year</Text><Text style={styles.sheetSubtitle}>Select the {picker} of your batch</Text></View>
              <TouchableOpacity onPress={() => setPicker(null)} style={styles.closeButton}><Icon name="close" size={20} color={colors.ink} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.departmentResults} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {options.map(year => {
                const active = (picker === 'start' ? startYear : endYear) === year;
                return <TouchableOpacity key={year} accessibilityRole="radio" accessibilityState={{selected: active}} onPress={() => { picker === 'start' ? onChangeStart(year) : onChangeEnd(year); setPicker(null); }} style={[styles.departmentOption, active && styles.departmentOptionActive]}>
                  <View style={[styles.departmentOptionIcon, active && styles.departmentOptionIconActive]}><Icon name="calendar-outline" size={17} color={active ? colors.primary : colors.mute} /></View>
                  <View style={styles.departmentOptionCopy}><Text style={styles.departmentOptionName}>{year}</Text></View>
                  {active && <Icon name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>;
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
  passwordInputWrap: {minHeight: 46, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FAFAFE', borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingRight: 9},
  passwordInput: {flex: 1, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontWeight: '600', color: colors.ink},
  passwordVisibilityButton: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  readOnlyBlock: {marginTop: 11},
  readOnlyField: {minHeight: 44, borderWidth: 1, borderColor: colors.line, backgroundColor: '#F7F8FD', borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9},
  readOnlyText: {flex: 1, color: colors.ink, fontSize: 12.5, fontWeight: '600'},
  departmentTrigger: {minHeight: 54, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FAFAFE', borderRadius: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10},
  departmentTriggerDisabled: {backgroundColor: '#F4F5F9', borderColor: '#E8EAF1'},
  departmentIcon: {width: 34, height: 34, borderRadius: 11, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  departmentSelected: {flex: 1},
  departmentSelectedName: {fontSize: 12.5, fontWeight: '700', color: colors.ink},
  departmentSelectedCode: {fontSize: 10.5, fontWeight: '700', color: colors.mute, marginTop: 2},
  placeholder: {color: '#9298B1'},
  userTypeRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6},
  userTypeOption: {width: '48%', minHeight: 46, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7},
  userTypeOptionWide: {width: '100%'},
  userTypeOptionSelected: {borderColor: colors.primary, backgroundColor: colors.soft},
  userTypeText: {fontSize: 12, fontWeight: '700', color: colors.mute},
  userTypeTextSelected: {color: colors.primary},
  batchField: {marginTop: 13},
  semesterField: {marginTop: 13},
  studentOptionTrigger: {minHeight: 46, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FAFAFE', borderRadius: 13, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4},
  studentOptionTriggerText: {flex: 1, fontSize: 12, fontWeight: '600', color: colors.ink},
  batchPeriodCard: {borderWidth: 1, borderColor: '#E4E6F2', borderRadius: 16, backgroundColor: '#F8F8FD', padding: 10},
  batchYearTrigger: {minHeight: 57, borderWidth: 1, borderColor: '#E7E8F2', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center'},
  batchYearTriggerDisabled: {backgroundColor: '#F3F4F8', borderColor: '#E7E8F2'},
  batchYearLabel: {fontSize: 9, fontWeight: '800', color: colors.mute, letterSpacing: 0.9, marginBottom: 4},
  batchYearValueRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  batchYearValue: {fontSize: 15, fontWeight: '800', color: colors.ink},
  batchYearPlaceholder: {fontSize: 13, fontWeight: '600', color: '#9298B1'},
  batchRangeDivider: {height: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7},
  batchRangeLine: {height: 1, width: 35, backgroundColor: '#DADCF0'},
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
  validationErrorBox: {flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, borderRadius: 14, backgroundColor: '#FFF1F0', borderWidth: 1, borderColor: '#FFD7D2', marginBottom: 10},
  validationErrorText: {flex: 1, fontSize: 12.5, lineHeight: 18, fontWeight: '700', color: colors.danger},
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
