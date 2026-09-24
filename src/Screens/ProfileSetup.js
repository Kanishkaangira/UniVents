import React, {useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../Components/Screen';
import ScreenHeader from '../Components/ScreenHeader';
import PrimaryButton from '../Components/PrimaryButton';
import {colors, gradients, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

const EMPTY_FORM = {user_name: '', user_type: 'student', department_id: '', enroll_no: '', course: '', batch: '', semester: ''};

export default function ProfileSetup() {
  const {session, profile, departments, profileStatus, error, refresh, completeProfile, signOut} = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const update = (key, value) => setForm(prev => ({...prev, [key]: value}));

  useEffect(() => {
    if (profileStatus !== 'missing' || !profile) return;
    setForm({
      ...EMPTY_FORM,
      user_name: profile.user_name || '',
      user_type: profile.user_type || 'student',
      department_id: profile.department_id || '',
      enroll_no: profile.enroll_no || '',
      course: profile.course || '',
      batch: profile.batch || '',
      semester: profile.semester ? String(profile.semester) : '',
    });
  }, [profile, profileStatus]);

  const submit = async () => {
    const name = form.user_name.trim();
    if (!name) return Alert.alert('Name required', 'Enter your full name to continue.');
    if (!form.department_id) return Alert.alert('Department required', 'Choose your department to continue.');
    if (form.user_type === 'student') {
      if (!form.enroll_no.trim() || !form.course.trim() || !form.batch.trim() || !form.semester.trim()) {
        return Alert.alert('Complete student details', 'Enrollment number, course, batch, and semester are all required.');
      }
      if (!/^\d+$/.test(form.semester.trim()) || Number(form.semester) < 1) {
        return Alert.alert('Invalid semester', 'Enter a semester number greater than zero.');
      }
    }

    setSaving(true);
    setSaveError('');
    try {
      const details = {
        user_name: name,
        user_type: form.user_type,
        department_id: form.department_id,
        ...(form.user_type === 'student' ? {
          enroll_no: form.enroll_no.trim(),
          course: form.course.trim(),
          batch: form.batch.trim(),
          semester: Number(form.semester),
        } : {}),
      };
      await completeProfile(details);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (profileStatus === 'error') {
    return (
      <Screen>
        <ScreenHeader title="Profile setup" subtitle="We couldn't check your profile" />
        <View style={styles.errorCard}>
          <Icon name="alert-circle-outline" size={28} color={colors.danger} />
          <Text style={styles.errorText}>{error || 'Please try again.'}</Text>
          <PrimaryButton label="Try again" onPress={refresh} style={{marginTop: 12}} />
          <TouchableOpacity onPress={signOut} style={styles.signOutLink}>
            <Text style={styles.linkText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Complete your profile" subtitle="Required once before you continue" />

      <LinearGradient colors={gradients.brand} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.hero}>
        <View style={styles.heroIcon}><Icon name="person-add-outline" size={24} color={colors.primary} /></View>
        <Text style={styles.heroTitle}>Welcome to UniVents</Text>
        <Text style={styles.heroText}>Add your details so we can show the right events and notices for you.</Text>
      </LinearGradient>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Account details</Text>
        <Field label="Full name *" value={form.user_name} onChangeText={v => update('user_name', v)} placeholder="Your full name" />
        <Text style={styles.label}>Verified university email</Text>
        <View style={styles.readOnlyField}>
          <Icon name="mail-outline" size={18} color={colors.mute} />
          <Text style={styles.readOnlyText}>{session?.user?.email || ''}</Text>
          <Icon name="checkmark-circle" size={18} color={colors.success} />
        </View>

        <Text style={styles.label}>I am a *</Text>
        <View style={styles.roleRow}>
          {['student', 'faculty'].map(type => {
            const active = form.user_type === type;
            return (
              <TouchableOpacity key={type} activeOpacity={0.85} onPress={() => update('user_type', type)} style={[styles.roleOption, active && styles.roleOptionActive]}>
                <Icon name={type === 'student' ? 'school-outline' : 'person-outline'} size={19} color={active ? colors.primary : colors.mute} />
                <Text style={[styles.roleText, active && styles.roleTextActive]}>{type === 'student' ? 'Student' : 'Faculty'}</Text>
                {active && <Icon name="checkmark-circle" size={17} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Department *</Text>
        {departments.length ? (
          <ScrollView nestedScrollEnabled style={styles.departmentList}>
            {departments.map(department => {
              const active = form.department_id === department.id;
              return (
                <TouchableOpacity key={department.id} activeOpacity={0.85} onPress={() => update('department_id', department.id)} style={[styles.departmentOption, active && styles.departmentOptionActive]}>
                  <View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioDot} />}</View>
                  <View style={styles.departmentCopy}>
                    <Text style={styles.departmentName}>{department.name}</Text>
                    <Text style={styles.departmentCode}>{department.code}</Text>
                  </View>
                  {active && <Icon name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyDepartments}>
            <Text style={styles.emptyText}>{error || 'Loading departments…'}</Text>
            {!!error && <TouchableOpacity onPress={refresh}><Text style={styles.linkText}>Retry</Text></TouchableOpacity>}
          </View>
        )}

        {form.user_type === 'student' && (
          <>
            <Text style={[styles.sectionTitle, {marginTop: 22}]}>Student details</Text>
            <Field label="Enrollment number *" value={form.enroll_no} onChangeText={v => update('enroll_no', v)} placeholder="Your enrollment number" />
            <Field label="Course *" value={form.course} onChangeText={v => update('course', v)} placeholder="e.g. B.Tech Computer Science" />
            <Field label="Batch *" value={form.batch} onChangeText={v => update('batch', v)} placeholder="e.g. 2023–2027" />
            <Field label="Semester *" value={form.semester} onChangeText={v => update('semester', v)} placeholder="e.g. 7" keyboardType="number-pad" />
          </>
        )}

        {!!saveError && <Text style={styles.saveError}>{saveError}</Text>}
        <PrimaryButton label={saving ? 'Saving profile…' : 'Save and continue'} onPress={saving ? () => {} : submit} style={{marginTop: 22}} />
      </View>

      <TouchableOpacity onPress={signOut} style={styles.signOutLink}>
        <Text style={styles.linkText}>Sign out</Text>
      </TouchableOpacity>
    </Screen>
  );
}

function Field({label, value, onChangeText, placeholder, keyboardType = 'default'}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A3A8C3"
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {borderRadius: 24, padding: 20, marginBottom: 16, overflow: 'hidden', ...shadow},
  heroIcon: {width: 44, height: 44, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  heroTitle: {fontSize: 20, fontWeight: '800', color: '#fff'},
  heroText: {fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.92)', marginTop: 5},
  formCard: {backgroundColor: '#fff', borderRadius: 24, padding: 18, ...shadow},
  sectionTitle: {fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: 4},
  field: {marginTop: 12},
  label: {fontSize: 12, fontWeight: '700', color: colors.mute, marginBottom: 6},
  input: {borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#F8F9FF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: colors.ink},
  readOnlyField: {minHeight: 48, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.soft, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9},
  readOnlyText: {flex: 1, color: colors.ink, fontSize: 13, fontWeight: '600'},
  roleRow: {flexDirection: 'row', gap: 10},
  roleOption: {flex: 1, minHeight: 48, borderWidth: 1.5, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7},
  roleOptionActive: {borderColor: colors.primary, backgroundColor: colors.soft},
  roleText: {fontSize: 13, fontWeight: '700', color: colors.mute},
  roleTextActive: {color: colors.primary},
  departmentList: {maxHeight: 228, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: 'hidden'},
  departmentOption: {minHeight: 58, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 10},
  departmentOptionActive: {backgroundColor: colors.soft},
  departmentCopy: {flex: 1},
  departmentName: {fontSize: 12.5, lineHeight: 17, fontWeight: '700', color: colors.ink},
  departmentCode: {fontSize: 11, fontWeight: '600', color: colors.mute, marginTop: 2},
  radio: {width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#A3A8C3', alignItems: 'center', justifyContent: 'center'},
  radioActive: {borderColor: colors.primary},
  radioDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary},
  emptyDepartments: {borderRadius: 14, padding: 14, backgroundColor: colors.soft, alignItems: 'center'},
  emptyText: {color: colors.mute, fontSize: 12, textAlign: 'center'},
  saveError: {fontSize: 12, lineHeight: 18, color: colors.danger, marginTop: 14},
  errorCard: {backgroundColor: '#fff', borderRadius: 22, padding: 20, alignItems: 'center', ...shadow},
  errorText: {fontSize: 13, lineHeight: 20, color: colors.mute, textAlign: 'center', marginTop: 10},
  signOutLink: {alignItems: 'center', paddingVertical: 18},
  linkText: {fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: 8},
});
