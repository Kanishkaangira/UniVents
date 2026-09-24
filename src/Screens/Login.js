import React, {useState} from 'react';
import {Alert, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import Screen from '../Components/Screen';
import AppLogo from '../Components/AppLogo';
import PrimaryButton from '../Components/PrimaryButton';
import {UNIVERSITY_EMAIL_DOMAIN} from '../Constants/env';
import {colors, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

export default function Login() {
  const {signIn, requestEmailOnlyOtp, verifyEmailOtp} = useApp();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const validateEmail = () => {
    const mail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(mail)) {
      Alert.alert('Check your email', 'Enter a valid university email address.');
      return null;
    }
    if (UNIVERSITY_EMAIL_DOMAIN && !mail.endsWith(UNIVERSITY_EMAIL_DOMAIN)) {
      Alert.alert('University email required', `Use an email ending in ${UNIVERSITY_EMAIL_DOMAIN}.`);
      return null;
    }
    return mail;
  };

  const describeAuthError = error => {
    const code = error?.code || error?.name;
    return code ? `${error.message} (${code})` : (error?.message || 'Unknown authentication error.');
  };

  const submit = async () => {
    const mail = validateEmail();
    if (!mail) return;
    if (mode === 'signin' && !password) return Alert.alert('Password required', 'Enter your password to continue.');
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        const {error} = await requestEmailOnlyOtp(mail);
        if (error) {
          const limited = /rate.?limit|too many requests|email.*limit/i.test(error.message || '');
          Alert.alert(
            limited ? 'Email sending limit reached' : 'Could not send verification code',
            limited
              ? 'The email provider has temporarily limited messages for this project. Please try later or check your SMTP provider limits.'
              : describeAuthError(error),
          );
        } else {
          setOtpSent(true);
          setSentTo(mail);
          setMessage(`Enter the verification code sent to ${mail}.`);
        }
      } else {
        const err = await signIn(mail, password);
        if (err) {
          const unverified = /email not confirmed/i.test(err);
          Alert.alert('Sign in failed', unverified ? 'Verify your email first, then try signing in again.' : err);
        }
      }
    } catch (e) {
      Alert.alert(mode === 'signup' ? 'Could not send verification code' : 'Sign in failed', describeAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    const mail = validateEmail();
    if (!mail) return;
    if (mail !== sentTo) {
      setOtpSent(false);
      setOtp('');
      setMessage('Email changed. Send a new verification code to this address.');
      return;
    }
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) return Alert.alert('Check the code', 'Enter the 6-digit code from your email.');
    setBusy(true);
    try {
      const {error} = await verifyEmailOtp(mail, code);
      if (error) Alert.alert('Verification failed', describeAuthError(error));
      // Successful verification creates the Supabase session and routes to profile setup.
    } catch (e) {
      Alert.alert('Verification failed', describeAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = next => {
    setMode(next);
    setOtpSent(false);
    setSentTo('');
    setOtp('');
    setMessage('');
  };

  const placeholder = UNIVERSITY_EMAIL_DOMAIN ? `rollno+${UNIVERSITY_EMAIL_DOMAIN}` : 'name@university.edu';

  return (
    <Screen>
      <View style={styles.hero}>
        <AppLogo size={84} />
        <Text style={styles.title}>UniVents</Text>
        <Text style={styles.sub}>Use your verified university email</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.modeRow}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => switchMode('signin')} style={[styles.modeButton, mode === 'signin' && styles.modeActive]}>
            <Text style={[styles.modeText, mode === 'signin' && styles.modeTextActive]}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} onPress={() => switchMode('signup')} style={[styles.modeButton, mode === 'signup' && styles.modeActive]}>
            <Text style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>Create account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>University email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={value => {
            setEmail(value);
            if (otpSent && value.trim().toLowerCase() !== sentTo) {
              setOtpSent(false);
              setOtp('');
              setMessage('Email changed. Send a new verification code to this address.');
            }
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder={placeholder}
          placeholderTextColor="#A3A8C3"
          editable={!busy}
        />

        {mode === 'signin' ? <>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Your password"
            placeholderTextColor="#A3A8C3"
            editable={!busy}
          />
        </> : otpSent ? <>
          <Text style={styles.label}>Email verification code</Text>
          <TextInput
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="6-digit code"
            placeholderTextColor="#A3A8C3"
            editable={!busy}
          />
        </> : null}

        {!!message && <Text style={styles.message}>{message}</Text>}
        <Text style={styles.hint}>
          {mode === 'signup'
            ? otpSent
              ? 'The code verifies your university email and signs you in. Then complete your profile.'
              : 'Enter your university email. We will send a 6-digit code; no password is needed to create an account.'
            : 'Sign in with your email and password.'}
        </Text>
        <PrimaryButton
          label={busy ? 'Please wait…' : mode === 'signup' ? (otpSent ? 'Verify code' : 'Send verification code') : 'Sign in'}
          onPress={busy ? () => {} : mode === 'signup' && otpSent ? verifyCode : submit}
          style={{marginTop: 20}}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {alignItems: 'center', marginTop: 50, marginBottom: 28},
  title: {fontSize: 32, fontWeight: '800', color: colors.ink, marginTop: 14, letterSpacing: -0.5},
  sub: {fontSize: 14, color: colors.mute, marginTop: 4},
  card: {backgroundColor: '#fff', borderRadius: 26, padding: 20, ...shadow},
  modeRow: {flexDirection: 'row', backgroundColor: colors.soft, borderRadius: 14, padding: 4, marginBottom: 6},
  modeButton: {flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11},
  modeActive: {backgroundColor: '#fff'},
  modeText: {color: colors.mute, fontSize: 12, fontWeight: '700'},
  modeTextActive: {color: colors.primary},
  label: {fontSize: 12, fontWeight: '700', color: colors.mute, marginTop: 12, marginBottom: 6},
  input: {borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#F8F9FF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: colors.ink},
  hint: {fontSize: 11.5, lineHeight: 17, color: colors.mute, marginTop: 12},
  message: {fontSize: 12, lineHeight: 18, color: colors.success, marginTop: 12},
});
