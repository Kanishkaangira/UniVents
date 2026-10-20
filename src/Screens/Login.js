import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import Screen from '../Components/Screen';
import AppLogo from '../Components/AppLogo';
import PrimaryButton from '../Components/PrimaryButton';
import {UNIVERSITY_EMAIL_DOMAIN} from '../Constants/env';
import {isUniversityEmail} from '../Services/emailRules';
import {colors, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';
import {isEmailRegistered, requestPasswordResetOtp, signOut, updatePassword, verifyPasswordResetOtp} from '../Services/api';

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
  const [emailError, setEmailError] = useState('');
  const [signInError, setSignInError] = useState('');
  const [resetStep, setResetStep] = useState(null);
  const [resetSentTo, setResetSentTo] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    const status = error?.status ? `HTTP ${error.status}` : '';
    const diagnostics = [code, status].filter(Boolean).join(', ');
    return diagnostics ? `${error.message} (${diagnostics})` : (error?.message || 'Unknown authentication error.');
  };

  const showSignupError = error => {
    const code = String(error?.code || '').toLowerCase();
    const detail = String(error?.message || '');
    const normalizedDetail = detail.toLowerCase();

    if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || /rate.?limit|too many requests/.test(normalizedDetail)) {
      Alert.alert('Please wait before trying again', 'Too many verification emails were requested. Wait a minute, then request another code.');
      return;
    }

    if (
      error?.name === 'AuthRetryableFetchError' ||
      Number(error?.status) >= 500 ||
      /sending confirmation email|confirmation email/.test(normalizedDetail)
    ) {
      const status = error?.status ? ` (HTTP ${error.status})` : '';
      Alert.alert(
        'Supabase could not send the email',
        `The SVSU address passed validation, but Supabase Auth failed while sending its verification email${status}. Check the Supabase Dashboard under Authentication > SMTP Settings and Auth Logs. The project email service may need custom SMTP configured. ${describeAuthError(error)}`,
      );
      return;
    }

    if (/svsu email|@svsu\.ac\.in|hook_restrict_signup_to_roll_emails/.test(normalizedDetail)) {
      Alert.alert('SVSU email required', 'Use your university email ending in @svsu.ac.in. Students and faculty can use their assigned email username.');
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
    if (!resetStep && mode === 'signin' && !password) return Alert.alert('Password required', 'Enter your password to continue.');
    setBusy(true);
    setMessage('');
    try {
      if (resetStep === 'email') {
        const {error} = await requestPasswordResetOtp(mail);
        if (error) throw error;
        setResetSentTo(mail);
        setResetStep('otp');
        setMessage('If an account exists for this email, a 6-digit reset code has been sent. Check your spam folder too.');
      } else if (resetStep === 'otp') {
        if (mail !== resetSentTo) {
          setResetStep('email');
          setOtp('');
          setMessage('Email changed. Send a new reset code to this address.');
          return;
        }
        const code = otp.trim();
        if (!/^\d{6}$/.test(code)) {
          setEmailError('Enter the 6-digit code from your email.');
          return;
        }
        const {error} = await verifyPasswordResetOtp(mail, code);
        if (error) throw error;
        setResetStep('password');
        setOtp('');
        setEmailError('');
        setMessage('Choose a new password for your account.');
      } else if (resetStep === 'password') {
        if (password.length < 8) {
          setEmailError('Use at least 8 characters for your new password.');
          return;
        }
        if (password !== confirmPassword) {
          setEmailError('The passwords do not match.');
          return;
        }
        const {error} = await updatePassword(password);
        if (error) throw error;
        await signOut();
        setResetStep(null);
        setResetSentTo('');
        setPassword('');
        setConfirmPassword('');
        setMessage('Password reset. Sign in with your new password.');
      } else if (mode === 'signup') {
        const {data: registered, error: lookupError} = await isEmailRegistered(mail);
        if (lookupError) {
          setEmailError('We could not check this email right now. Please try again.');
          return;
        }
        if (registered) {
          setEmailError('An account with this email is already registered. Switch to Sign in to continue.');
          return;
        }
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
          if (/invalid login credentials/i.test(err)) {
            setSignInError('Invalid email or password. Please check your details and try again.');
          } else {
            Alert.alert('Sign in failed', unverified ? 'Verify your email first, then try signing in again.' : err);
          }
        }
      }
    } catch (e) {
      if (resetStep) setEmailError(e?.message || 'Could not reset your password. Please try again.');
      else if (mode === 'signup') showSignupError(e);
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
    setEmailError('');
    setSignInError('');
    setResetStep(null);
    setResetSentTo('');
    setPassword('');
    setConfirmPassword('');
  };

  const startPasswordReset = () => {
    setResetStep('email');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setMessage('Enter your university email to receive a 6-digit password reset code.');
    setEmailError('');
  };

  const cancelPasswordReset = () => {
    setResetStep(null);
    setResetSentTo('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setMessage('');
    setEmailError('');
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
            if (emailError) setEmailError('');
            if (signInError) setSignInError('');
            if (resetStep === 'otp' && value.trim().toLowerCase() !== resetSentTo) {
              setResetStep('email');
              setOtp('');
              setMessage('Email changed. Send a new reset code to this address.');
            }
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
        {!!emailError && <Text accessibilityRole="alert" style={styles.emailError}>{emailError}</Text>}

        {!resetStep && mode === 'signin' ? <>
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={value => {setPassword(value); if (signInError) setSignInError('');}} secureTextEntry autoCapitalize="none" placeholder="Your password" placeholderTextColor="#A3A8C3" editable={!busy} />
          {!!signInError && <Text accessibilityRole="alert" style={styles.emailError}>{signInError}</Text>}
        </> : resetStep === 'password' ? <>
          <Text style={styles.label}>New password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder="At least 8 characters" placeholderTextColor="#A3A8C3" editable={!busy} />
          <Text style={styles.label}>Confirm new password</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" placeholder="Enter the new password again" placeholderTextColor="#A3A8C3" editable={!busy} />
        </> : resetStep === 'otp' || (mode === 'signup' && otpSent) ? <>
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

        {!resetStep && mode === 'signin' && <TouchableOpacity onPress={startPasswordReset} disabled={busy} style={styles.forgotLink}>
          <Text style={styles.resend}>Forgot password?</Text>
        </TouchableOpacity>}

        {!!resetStep && <TouchableOpacity onPress={cancelPasswordReset} disabled={busy} style={styles.forgotLink}>
          <Text style={styles.resend}>Back to sign in</Text>
        </TouchableOpacity>}

        {mode === 'signup' && otpSent && (
          <TouchableOpacity disabled={busy || cooldown > 0} onPress={submit}>
            <Text style={[styles.resend, (busy || cooldown > 0) && {color: colors.mute}]}>
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
        )}

        {!!message && <Text style={styles.message}>{message}</Text>}
        <Text style={styles.hint}>
          {resetStep
            ? resetStep === 'otp' ? 'Enter the 6-digit code sent to your email. Check your spam folder if it is missing.' : resetStep === 'password' ? 'Choose a new password with at least 8 characters.' : 'Use your official university email to receive a password reset code.'
            : mode === 'signup'
            ? `Use your official university email. We’ll send a 6-digit OTP; check your spam folder if it doesn’t arrive.`
            : 'Sign in with your email and password.'}
        </Text>
        <PrimaryButton
          label={busy ? 'Please wait…' : resetStep === 'email' ? 'Send reset code' : resetStep === 'otp' ? 'Verify code' : resetStep === 'password' ? 'Reset password' : mode === 'signup' ? (otpSent ? 'Verify code' : 'Send verification code') : 'Sign in'}
          onPress={busy ? () => {} : !resetStep && mode === 'signup' && otpSent ? verifyCode : submit}
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
  emailError: {fontSize: 12, lineHeight: 17, color: '#C62828', fontWeight: '600', marginTop: 7},
  hint: {fontSize: 11.5, lineHeight: 17, color: colors.mute, marginTop: 12},
  message: {fontSize: 12, lineHeight: 17, color: colors.mute, marginTop: 10},
  resend: {fontSize: 12.5, fontWeight: '700', color: colors.primary, marginTop: 12},
  forgotLink: {alignSelf: 'flex-end', marginTop: 8},
});
