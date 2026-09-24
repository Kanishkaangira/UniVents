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
import {FACULTIES} from '../Data/data';
import {colors, gradients, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

const FACULTY_CHIPS = Object.keys(FACULTIES).map(k => ({key: k, label: k}));

export default function Profile() {
  const {profile, setProfile, registered, saved, unreadCount, count} = useApp();
  const [sheet, setSheet] = useState(null); // 'edit' | 'about' | 'logout' | null
  const [draft, setDraft] = useState(profile);

  const openEdit = () => { setDraft(profile); setSheet('edit'); };
  const save = () => {
    setProfile({...draft, name: draft.name.trim() || profile.name});
    setSheet(null);
  };
  const logout = () => {
    setSheet(null);
    // TODO: clear your auth token here, then navigation.replace('Login')
    Alert.alert('Logged out', 'Connect this to your login flow.');
  };

  return (
    <>
      <Screen>
        <ScreenHeader title="Profile" subtitle="Your account" />

        <LinearGradient colors={gradients.brand} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.card}>
          <TouchableOpacity style={styles.edit} onPress={openEdit}>
            <Icon name="create-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <LinearGradient colors={['#fff', '#FFB36B']} style={styles.ring}>
            <View style={styles.avatar}><Text style={styles.initial}>{profile.name[0].toUpperCase()}</Text></View>
          </LinearGradient>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <Text style={styles.pill}>{profile.faculty} · {profile.course}</Text>
        </LinearGradient>

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

      {/* Edit profile */}
      <BottomSheet visible={sheet === 'edit'} onClose={() => setSheet(null)}>
        <Text style={styles.sheetTitle}>Edit profile</Text>
        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} value={draft.name} onChangeText={name => setDraft({...draft, name})} />
        <Text style={styles.label}>Faculty</Text>
        <ChipRow items={FACULTY_CHIPS} value={draft.faculty} onChange={faculty => setDraft({...draft, faculty})} />
        <Text style={styles.label}>Course</Text>
        <TextInput style={styles.input} value={draft.course} onChangeText={course => setDraft({...draft, course})} />
        <Text style={styles.label}>Batch</Text>
        <TextInput style={styles.input} value={draft.batch} onChangeText={batch => setDraft({...draft, batch})} />
        <PrimaryButton label="Save changes" onPress={save} style={{marginTop: 18}} />
      </BottomSheet>

      {/* About */}
      <BottomSheet visible={sheet === 'about'} onClose={() => setSheet(null)}>
        <View style={{alignItems: 'center'}}>
          <AppLogo size={72} />
          <Text style={[styles.sheetTitle, {marginTop: 12}]}>UniVents</Text>
          <Text style={styles.pillSoft}>Version 1.0</Text>
          <Text style={styles.about}>
            One place for every event and notice across your university – by faculty, club or campus-wide.
            Register, get reminders and never miss what matters.
          </Text>
        </View>
        <PrimaryButton label="Close" variant="soft" onPress={() => setSheet(null)} />
      </BottomSheet>

      {/* Logout confirm */}
      <BottomSheet visible={sheet === 'logout'} onClose={() => setSheet(null)}>
        <Text style={styles.sheetTitle}>Log out?</Text>
        <Text style={styles.about}>You will need your university email to sign in again.</Text>
        <PrimaryButton label="Yes, log out" variant="danger" onPress={logout} />
        <PrimaryButton label="Cancel" variant="soft" onPress={() => setSheet(null)} style={{marginTop: 8}} />
      </BottomSheet>
    </>
  );
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
  stats: {flexDirection: 'row', gap: 10, marginBottom: 14},
  menu: {backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', ...shadow, shadowOpacity: 0.08},
  sheetTitle: {fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 6},
  label: {fontSize: 12, fontWeight: '700', color: colors.mute, marginTop: 12, marginBottom: 6},
  input: {borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#F8F9FF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: colors.ink},
  about: {fontSize: 13, lineHeight: 20, color: colors.mute, textAlign: 'center', marginVertical: 14},
  pillSoft: {fontSize: 10.5, fontWeight: '700', color: colors.primary, backgroundColor: colors.soft, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, overflow: 'hidden', marginTop: 4},
});
