import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import Screen from '../Components/Screen';
import AppLogo from '../Components/AppLogo';
import PrimaryButton from '../Components/PrimaryButton';
import {UNIVERSITY_EMAIL_DOMAIN} from '../Constants/env';
import {isUniversityEmail} from '../Services/emailRules';
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
  const [cooldown, setCooldown] = useState(0); // seconds before a new code can be requested

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Students and faculty use their own local part with the shared SVSU domain.
  const validateEmail = () => {
    const mail = email.trim().toLowerCase();
    if (!isUniversityEmail(mail)) {
      Alert.alert('University email required', `Use an email ending in ${UNIVERSITY_EMAIL_DOMAIN}.`);
      return null;
    }
    return mail;
  };

  const describeAuthError = error => {
    const code = error?.code || error?.name;
    return code ? `${error.message} (${code})` : (error?.message || 'Unknown authentication error.');
  };

  const showSignupError = error => {
    const code = String(error?.code || '').toLowerCase();
    const detail = String(error?.message || '');
    const normalizedDetail = detail.toLowerCase();

    if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || /rate.?limit|too many requests/.test(normalizedDetail)) {
      Alert.alert('Please wait before trying again', 'Too many verification emails were requested. Wait a minute, then request another code.');
      return;
    }

    if (/svsu email|@svsu\.ac\.in|hook_restrict_signup_to_roll_emails/.test(normalizedDetail)) {
      Alert.alert('SVSU email required', 'Use your university email ending in @svsu.ac.in. Students should use their roll number; faculty should use their username.');
      return;
    }

    Alert.alert(
      'Could not send verification code',
      `Check that the email address is correct and try again. If it continues, ask the app administrator to check Supabase Auth email settings. ${describeAuthError(error)}`,
    );
  };

  const submit = async () => {
    if (mode === 'signup' && otpSent && cooldown > 0) return;
    const mail = validateEmail();
    if (!mail) return;
    if (mode === 'signin' && !password) return Alert.alert('Password required', 'Enter your password to continue.');
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        const {error} = await requestEmailOnlyOtp(mail);
        if (error) {
          showSignupError(error);
        } else {
          setOtpSent(true);
          setCooldown(60);
          setSentTo(mail);
          setMessage('Check your inbox or spam folder for the 6-digit code.');
        }
      } else {
        const err = await signIn(mail, password);
        if (err) {
          const unverified = /email not confirmed/i.test(err);
          Alert.alert('Sign in failed', unverified ? 'Verify your email first, then try signing in again.' : err);
        }
      }
    } catch (e) {
      if (mode === 'signup') showSignupError(e);
      else Alert.alert('Sign in failed', describeAuthError(e));
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

  const placeholder = mode === 'signup' ? `username${UNIVERSITY_EMAIL_DOMAIN}` : `email${UNIVERSITY_EMAIL_DOMAIN}`;

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

        {mode === 'signup' && otpSent && (
          <TouchableOpacity disabled={busy || cooldown > 0} onPress={submit}>
            <Text style={[styles.resend, (busy || cooldown > 0) && {color: colors.mute}]}>
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
        )}

        {!!message && <Text style={styles.message}>{message}</Text>}
        <Text style={styles.hint}>
          {mode === 'signup'
            ? otpSent
              ? 'The code verifies your university email and signs you in. Then complete your profile.'
              : `Use your SVSU email ending in ${UNIVERSITY_EMAIL_DOMAIN}. Students use their roll number; faculty use their username. We will send a 6-digit code to verify it.`
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
  message: {fontSize: 12, lineHeight: 17, color: colors.mute, marginTop: 10},
  resend: {fontSize: 12.5, fontWeight: '700', color: colors.primary, marginTop: 12},
});
