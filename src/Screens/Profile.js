import React, {useState} from 'react';
import {Alert, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../Components/Screen';
import ScreenHeader from '../Components/ScreenHeader';
import StatTile from '../Components/StatTile';
import MenuItem from '../Components/MenuItem';
import BottomSheet from '../Components/BottomSheet';
import ChipRow from '../Components/ChipRow';
import PrimaryButton from '../Components/PrimaryButton';
import AppLogo from '../Components/AppLogo';
import {colors, gradients, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

export default function Profile() {
  const {session, profile, myDepartment, departments, saveProfile, signOut, registered, saved, unreadCount, count, loading, refresh} = useApp();
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
  const chips = departments.map(d => ({key: d.id, label: d.code}));

  const openEdit = () => {
    setDraft({
      user_name: profile.user_name, department_id: profile.department_id,
      enroll_no: profile.enroll_no || '',
      course: profile.course || '', batch: profile.batch || '', semester: profile.semester ? String(profile.semester) : '',
    });
    setSheet('edit');
  };

  const save = async () => {
    const semester = draft.semester ? parseInt(draft.semester, 10) : null;
    if (isStudent && draft.semester && Number.isNaN(semester)) return Alert.alert('Semester must be a number');
    setSaving(true);
    try {
      // only columns the database allows users to change
      await saveProfile({
        user_name: draft.user_name.trim() || profile.user_name,
        department_id: draft.department_id,
        ...(isStudent && {enroll_no: draft.enroll_no.trim(), course: draft.course, batch: draft.batch, semester}),
      });
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

        <LinearGradient colors={gradients.brand} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.card}>
          <TouchableOpacity style={styles.edit} onPress={openEdit}>
            <Icon name="create-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <LinearGradient colors={['#fff', '#FFB36B']} style={styles.ring}>
            <View style={styles.avatar}><Text style={styles.initial}>{profile.user_name[0].toUpperCase()}</Text></View>
          </LinearGradient>
          <Text style={styles.name}>{profile.user_name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <Text style={styles.pill}>{isStudent ? 'Student' : 'Faculty'} · {myDepartment?.code || 'Department pending'}</Text>
        </LinearGradient>

        <View style={styles.detailCard}>
          <Text style={styles.detailHeading}>Profile details</Text>
          <ProfileDetail label="Account ID" value={profile.id} selectable />
          <ProfileDetail label="User type" value={isStudent ? 'Student' : 'Faculty'} />
          <ProfileDetail label="Full name" value={profile.user_name} />
          <ProfileDetail label="University email" value={profile.email} />
          <ProfileDetail label="Department" value={myDepartment ? `${myDepartment.name} (${myDepartment.code})` : 'Not set'} />
          {isStudent && <>
            <ProfileDetail label="Enrollment number" value={profile.enroll_no} />
            <ProfileDetail label="Course" value={profile.course} />
            <ProfileDetail label="Batch" value={profile.batch} />
            <ProfileDetail label="Semester" value={profile.semester ? String(profile.semester) : ''} />
          </>}
          <ProfileDetail label="Created" value={formatDate(profile.created_at)} />
          <ProfileDetail label="Last updated" value={formatDate(profile.updated_at)} last />
        </View>

        <View style={styles.stats}>
          <StatTile value={count(registered)} label="Registered" />
          <StatTile value={count(saved)} label="Saved" />
          <StatTile value={unreadCount} label="Unread" />
        </View>

        <View style={styles.menu}>
          <MenuItem icon="create-outline" label="Edit profile details" onPress={openEdit} />
          <MenuItem icon="information-circle-outline" label="About the app" onPress={() => setSheet('about')} />
          <MenuItem icon="log-out-outline" label="Log out" danger onPress={() => setSheet('logout')} />
        </View>
      </Screen>

      {/* Edit profile – only the editable columns */}
      <BottomSheet visible={sheet === 'edit'} onClose={() => setSheet(null)}>
        <Text style={styles.sheetTitle}>Edit profile</Text>
        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} value={draft.user_name} onChangeText={user_name => setDraft({...draft, user_name})} />
        <Text style={styles.label}>Department</Text>
        <ChipRow items={chips} value={draft.department_id} onChange={department_id => setDraft({...draft, department_id})} />
        {isStudent && (
          <>
            <Text style={styles.label}>Enrollment number</Text>
            <TextInput style={styles.input} value={draft.enroll_no} onChangeText={enroll_no => setDraft({...draft, enroll_no})} />
            <Text style={styles.label}>Course</Text>
            <TextInput style={styles.input} value={draft.course} onChangeText={course => setDraft({...draft, course})} />
            <Text style={styles.label}>Batch</Text>
            <TextInput style={styles.input} value={draft.batch} onChangeText={batch => setDraft({...draft, batch})} />
            <Text style={styles.label}>Semester</Text>
            <TextInput style={styles.input} value={draft.semester} keyboardType="number-pad" onChangeText={semester => setDraft({...draft, semester})} />
          </>
        )}
        <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} onPress={saving ? () => {} : save} style={{marginTop: 18}} />
      </BottomSheet>

      {/* About */}
      <BottomSheet visible={sheet === 'about'} onClose={() => setSheet(null)}>
        <View style={{alignItems: 'center'}}>
          <AppLogo size={72} />
          <Text style={[styles.sheetTitle, {marginTop: 12}]}>UniVents</Text>
          <Text style={styles.pillSoft}>Version 1.0</Text>
          <Text style={styles.about}>
            One place for every event and notice across your university – by department, club or campus-wide.
            Register, get reminders and never miss what matters.
          </Text>
        </View>
        <PrimaryButton label="Close" variant="soft" onPress={() => setSheet(null)} />
      </BottomSheet>

      {/* Logout confirm */}
      <BottomSheet visible={sheet === 'logout'} onClose={() => setSheet(null)}>
        <Text style={styles.sheetTitle}>Log out?</Text>
        <Text style={styles.about}>You will need your university email to sign in again.</Text>
        <PrimaryButton label="Yes, log out" variant="danger" onPress={logOut} />
        <PrimaryButton label="Cancel" variant="soft" onPress={() => setSheet(null)} style={{marginTop: 8}} />
      </BottomSheet>
    </>
  );
}

function ProfileDetail({label, value, last, selectable}) {
  return (
    <View style={[styles.detailRow, last && {borderBottomWidth: 0}]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable={selectable} style={[styles.detailValue, selectable && {fontSize: 10}]}>{value || '—'}</Text>
    </View>
  );
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

const styles = StyleSheet.create({
  card: {borderRadius: 28, padding: 20, alignItems: 'center', marginBottom: 14, overflow: 'hidden', ...shadow, shadowColor: colors.primary, shadowOpacity: 0.32},
  edit: {position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center'},
  ring: {width: 80, height: 80, borderRadius: 40, padding: 4, marginBottom: 10},
  avatar: {flex: 1, borderRadius: 40, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  initial: {fontSize: 30, fontWeight: '800', color: colors.primary},
  name: {color: '#fff', fontSize: 20, fontWeight: '800'},
  email: {color: 'rgba(255,255,255,0.92)', fontSize: 12.5, marginTop: 3, marginBottom: 10},
  pill: {color: '#fff', fontSize: 10.5, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, overflow: 'hidden'},
  detailCard: {backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14, ...shadow, shadowOpacity: 0.07},
  detailHeading: {fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: 4},
  detailRow: {paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 3},
  detailLabel: {fontSize: 11, fontWeight: '700', color: colors.mute},
  detailValue: {fontSize: 13, fontWeight: '600', color: colors.ink},
  stats: {flexDirection: 'row', gap: 10, marginBottom: 14},
  menu: {backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', ...shadow, shadowOpacity: 0.08},
  sheetTitle: {fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 6},
  label: {fontSize: 12, fontWeight: '700', color: colors.mute, marginTop: 12, marginBottom: 6},
  input: {borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#F8F9FF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: colors.ink},
  about: {fontSize: 13, lineHeight: 20, color: colors.mute, textAlign: 'center', marginVertical: 14},
  pillSoft: {fontSize: 10.5, fontWeight: '700', color: colors.primary, backgroundColor: colors.soft, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, overflow: 'hidden', marginTop: 4},
});
