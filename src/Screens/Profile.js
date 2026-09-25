import React, {useState} from 'react';
import {Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../Components/Screen';
import ScreenHeader from '../Components/ScreenHeader';
import MenuItem from '../Components/MenuItem';
import BottomSheet from '../Components/BottomSheet';
import PrimaryButton from '../Components/PrimaryButton';
import AppLogo from '../Components/AppLogo';
import {colors, gradients, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

const SEMESTER_OPTIONS = Array.from({length: 8}, (_, index) => String(index + 1));

export default function Profile() {
  const {session, profile, myDepartment, saveProfile, signOut, loading, refresh} = useApp();
  const [sheet, setSheet] = useState(null); // 'edit' | 'about' | 'logout' | null
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const logOut = async () => {
    const {error} = await signOut();
    if (error) Alert.alert('Could not sign out', error.message);
    else setSheet(null);
  };

  if (!profile) {
    return (
      <Screen refreshing={loading} onRefresh={refresh}>
        <ScreenHeader title="Profile" subtitle={session ? 'Your account' : 'Signed out'} />
        <Text style={styles.about}>
          {session
            ? `No profile found for ${session.user.email || 'this account'}. Ask the university admin to create one.`
            : 'You are signed out. You can keep browsing the app.'}
        </Text>
        {session && <PrimaryButton label="Log out" variant="danger" onPress={logOut} />}
      </Screen>
    );
  }

  const isStudent = profile.user_type === 'student';

  const openEdit = () => {
    setDraft({
      user_name: profile.user_name,
      course: profile.course || '',
      semester: profile.semester == null ? '' : String(profile.semester),
    });
    setSheet('edit');
  };

  const save = async () => {
    const userName = draft.user_name?.trim();
    if (!userName) return Alert.alert('Name required', 'Enter your full name before saving.');
    if (isStudent && !draft.course?.trim()) return Alert.alert('Course required', 'Enter your course before saving.');

    const semester = Number(draft.semester);
    if (isStudent && !SEMESTER_OPTIONS.includes(draft.semester)) {
      return Alert.alert('Choose a semester', 'Select a semester from 1 to 8.');
    }
    setSaving(true);
    try {
      const updatedFields = {user_name: userName};
      if (isStudent) {
        updatedFields.course = draft.course.trim();
        updatedFields.semester = semester;
      }
      await saveProfile(updatedFields);
      setSheet(null);
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Screen refreshing={loading} onRefresh={refresh}>
        <ScreenHeader title="Profile" subtitle="Your account" />

        <LinearGradient colors={gradients.brand} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.profileHeader}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Edit profile" style={styles.edit} onPress={openEdit}>
            <Icon name="create-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <LinearGradient colors={['#fff', '#FFB36B']} style={styles.ring}>
            <View style={styles.avatar}><Text style={styles.initial}>{profile.user_name?.[0]?.toUpperCase() || '?'}</Text></View>
          </LinearGradient>
          <Text style={styles.name}>{profile.user_name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <Text style={styles.pill}>{isStudent ? 'Student' : 'Faculty'}</Text>
        </LinearGradient>

        <View style={styles.menu}>
          <MenuItem icon="create-outline" label="Edit profile" onPress={openEdit} />
          <MenuItem icon="information-circle-outline" label="About the app" onPress={() => setSheet('about')} />
          <MenuItem icon="log-out-outline" label="Log out" danger onPress={() => setSheet('logout')} />
        </View>
      </Screen>

      {/* Edit profile */}
      <BottomSheet visible={sheet === 'edit'} onClose={() => setSheet(null)}>
        <View style={styles.editHeading}>
          <View style={styles.editHeadingIcon}><Icon name="person-outline" size={20} color={colors.primary} /></View>
          <View style={styles.editHeadingCopy}>
            <Text style={styles.sheetTitle}>Edit profile</Text>
            <Text style={styles.sheetSubtitle}>Update your account details</Text>
          </View>
        </View>
        <EditSection title="Account details" icon="person-circle-outline">
          <Text style={styles.label}>Full name</Text>
          <TextInput style={styles.input} value={draft.user_name} onChangeText={user_name => setDraft({...draft, user_name})} placeholder="Your full name" placeholderTextColor={colors.mute} autoCapitalize="words" />
          <View style={styles.detailRow}>
            <View style={styles.detailColumn}><Text style={styles.label}>User type</Text><ReadOnlyValue value={profile.user_type} /></View>
          </View>
          <Text style={styles.label}>University email</Text>
          <ReadOnlyValue value={profile.email} />
        </EditSection>
        {isStudent && (
          <EditSection title="Academic details" icon="school-outline">
            <Text style={styles.label}>Department</Text>
            <ReadOnlyValue value={myDepartment ? `${myDepartment.name} (${myDepartment.code})` : profile.department_id} />
            <View style={styles.detailRow}>
              <View style={styles.detailColumn}><Text style={styles.label}>Enrollment number</Text><ReadOnlyValue value={profile.enroll_no} /></View>
              <View style={styles.detailColumn}><Text style={styles.label}>Batch</Text><ReadOnlyValue value={profile.batch} /></View>
            </View>
            <Text style={styles.label}>Course</Text>
            <TextInput style={styles.input} value={draft.course} onChangeText={course => setDraft({...draft, course})} placeholder="Your course" placeholderTextColor={colors.mute} autoCapitalize="words" />
            <Text style={styles.label}>Semester</Text>
            <SemesterOptions value={draft.semester} onChange={semester => setDraft({...draft, semester})} />
          </EditSection>
        )}
        <PrimaryButton label={saving ? 'Saving...' : 'Save changes'} onPress={saving ? () => {} : save} style={styles.saveButton} />
      </BottomSheet>
      {/* About */}
      <BottomSheet visible={sheet === 'about'} onClose={() => setSheet(null)}>
        <View style={{alignItems: 'center'}}>
          <AppLogo size={72} />
          <Text style={[styles.sheetTitle, {marginTop: 12}]}>UniVents</Text>
          <Text style={styles.pillSoft}>Version 1.0</Text>
          <Text style={styles.about}>
            Campus events and notices, all in one place.
          </Text>
        </View>
        <PrimaryButton label="Close" variant="soft" onPress={() => setSheet(null)} />
      </BottomSheet>

      {/* Logout confirm */}
      <BottomSheet visible={sheet === 'logout'} onClose={() => setSheet(null)}>
        <Text style={styles.sheetTitle}>Log out?</Text>
        <Text style={styles.about}>You can sign in again anytime.</Text>
        <PrimaryButton label="Yes, log out" variant="danger" onPress={logOut} />
        <PrimaryButton label="Cancel" variant="soft" onPress={() => setSheet(null)} style={{marginTop: 8}} />
      </BottomSheet>
    </>
  );
}

function ReadOnlyValue({value}) {
  return (
    <View style={styles.readOnlyField}>
      <Text style={styles.readOnlyValue}>{value || '—'}</Text>
    </View>
  );
}

function EditSection({title, icon, children}) {
  return (
    <View style={styles.editSection}>
      <View style={styles.sectionHeading}><Icon name={icon} size={17} color={colors.primary} /><Text style={styles.sectionTitle}>{title}</Text></View>
      {children}
    </View>
  );
}
function SemesterOptions({value, onChange}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded: open}} onPress={() => setOpen(true)} style={styles.semesterTrigger}>
        <Text style={[styles.semesterTriggerText, !value && styles.semesterPlaceholder]}>{value || 'Choose semester'}</Text>
        <Icon name="chevron-down" size={18} color={colors.mute} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={() => setOpen(false)} />
          <View style={styles.semesterSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View><Text style={styles.semesterSheetTitle}>Choose semester</Text><Text style={styles.sheetSubtitle}>Select from 1 to 8</Text></View>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeButton}><Icon name="close" size={20} color={colors.ink} /></TouchableOpacity>
            </View>
            {SEMESTER_OPTIONS.map(option => {
              const active = value === option;
              return (
                <TouchableOpacity key={option} accessibilityRole="radio" accessibilityState={{selected: active}} onPress={() => { onChange(option); setOpen(false); }} style={[styles.semesterListOption, active && styles.semesterListOptionActive]}>
                  <View style={[styles.semesterListIcon, active && styles.semesterListIconActive]}><Icon name="school-outline" size={17} color={active ? colors.primary : colors.mute} /></View>
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

const styles = StyleSheet.create({
  profileHeader: {borderRadius: 26, padding: 20, alignItems: 'center', marginBottom: 16, overflow: 'hidden', ...shadow, shadowColor: colors.primary, shadowOpacity: 0.26},
  edit: {position: 'absolute', top: 13, right: 13, width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center'},
  ring: {width: 76, height: 76, borderRadius: 38, padding: 4, marginBottom: 10},
  avatar: {flex: 1, borderRadius: 38, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  initial: {fontSize: 29, fontWeight: '800', color: colors.primary},
  name: {fontSize: 19, fontWeight: '800', color: '#fff'},
  email: {fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 3, marginBottom: 9},
  pill: {fontSize: 10, fontWeight: '800', color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, overflow: 'hidden'},
  menu: {backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', ...shadow, shadowOpacity: 0.08},
  sheetTitle: {fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 6},
  editHeading: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  editHeadingIcon: {width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  editHeadingCopy: {flex: 1},
  editSection: {backgroundColor: '#FBFBFE', borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 14, marginTop: 12},
  sectionHeading: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line},
  sectionTitle: {fontSize: 13, fontWeight: '800', color: colors.ink},
  detailRow: {flexDirection: 'row', gap: 10},
  detailColumn: {flex: 1, minWidth: 0},
  label: {fontSize: 11, fontWeight: '700', color: colors.mute, marginTop: 12, marginBottom: 6},
  input: {borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#F8F9FF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: colors.ink},
  saveButton: {marginTop: 16},
  semesterTrigger: {minHeight: 46, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#F8F9FF', borderRadius: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4},
  semesterTriggerText: {flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink},
  semesterPlaceholder: {color: colors.mute},
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,20,43,0.48)' },
  semesterSheet: {backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 28, maxHeight: '82%'},
  sheetHandle: {width: 38, height: 4, borderRadius: 2, backgroundColor: '#D7DAE8', alignSelf: 'center', marginBottom: 15},
  sheetHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14},
  semesterSheetTitle: {fontSize: 18, fontWeight: '800', color: colors.ink},
  sheetSubtitle: {fontSize: 11.5, color: colors.mute, marginTop: 3},
  closeButton: {width: 36, height: 36, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  semesterListOption: {minHeight: 57, borderRadius: 13, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4},
  semesterListOptionActive: {backgroundColor: colors.soft},
  semesterListIcon: {width: 34, height: 34, borderRadius: 11, backgroundColor: '#F3F4F8', alignItems: 'center', justifyContent: 'center'},
  semesterListIconActive: {backgroundColor: '#fff'},
  semesterOptions: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginTop: 8},
  semesterOption: {width: '23%', height: 42, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: '#F8F9FF', alignItems: 'center', justifyContent: 'center'},
  semesterOptionSelected: {borderColor: colors.primary, backgroundColor: colors.soft},
  semesterOptionText: {fontSize: 13, fontWeight: '700', color: colors.ink},
  semesterOptionTextSelected: {color: colors.primary},
  readOnlyField: {minHeight: 44, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.soft, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 12},
  readOnlyValue: {fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'capitalize'},
  about: {fontSize: 13, lineHeight: 20, color: colors.mute, textAlign: 'center', marginVertical: 14},
  pillSoft: {fontSize: 10.5, fontWeight: '700', color: colors.primary, backgroundColor: colors.soft, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, overflow: 'hidden', marginTop: 4},
});
