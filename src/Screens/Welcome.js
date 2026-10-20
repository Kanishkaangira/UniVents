import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AppLogo from '../Components/AppLogo';
import {colors, gradients, shadow} from '../Constants/theme';
import {useApp} from '../Context/AppContext';

const WORDS = ['Discover', 'campus', 'events,', 'notices,', 'and', 'moments', 'made', 'for', 'you.'];

export default function Welcome({navigation}) {
  const {profile} = useApp();
  const studentName = profile?.user_name?.trim() || 'there';
  const greeting = `Hey, ${studentName}!`;
  const greetingWords = useMemo(() => greeting.split(/\s+/), [greeting]);
  const greetingAnimations = useMemo(() => greetingWords.map(() => new Animated.Value(0)), [greetingWords]);
  const wordAnimations = useMemo(() => WORDS.map(() => new Animated.Value(0)), []);
  const featureAnimations = useMemo(() => Array.from({length: 3}, () => new Animated.Value(0)), []);
  const buttonAnimation = useRef(new Animated.Value(0)).current;
  const exitAnimation = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const orbitLoop = Animated.loop(Animated.timing(orbit, {
      toValue: 1,
      duration: 18000,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    orbitLoop.start();
    const pulseLoop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, {toValue: 1, duration: 950, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      Animated.timing(pulse, {toValue: 0, duration: 950, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
    ]));
    pulseLoop.start();

    Animated.stagger(55, greetingAnimations.map(value => Animated.spring(value, {
      toValue: 1,
      tension: 68,
      friction: 8,
      useNativeDriver: true,
    }))).start(({finished}) => {
      if (!finished || !isMounted) return;
      Animated.stagger(36, wordAnimations.map(value => Animated.timing(value, {
        toValue: 1,
        duration: 230,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }))).start(({finished: wordsFinished}) => {
        if (!wordsFinished || !isMounted) return;
        Animated.stagger(70, featureAnimations.map(value => Animated.spring(value, {
          toValue: 1,
          tension: 72,
          friction: 9,
          useNativeDriver: true,
        }))).start(({finished: featuresFinished}) => {
          if (!featuresFinished || !isMounted) return;
          Animated.timing(buttonAnimation, {toValue: 1, duration: 180, useNativeDriver: true}).start(({finished: footerFinished}) => {
            if (!footerFinished || !isMounted) return;
            setReady(true);
            Animated.timing(progress, {toValue: 1, duration: 220, easing: Easing.inOut(Easing.cubic), useNativeDriver: false}).start(({finished: progressFinished}) => {
              if (!progressFinished || !isMounted) return;
              Animated.timing(exitAnimation, {toValue: 1, duration: 170, easing: Easing.in(Easing.cubic), useNativeDriver: true}).start(({finished: exitFinished}) => {
                if (exitFinished && isMounted) navigation.replace('Main');
              });
            });
          });
        });
      });
    });
    return () => {
      isMounted = false;
      orbitLoop.stop();
      pulseLoop.stop();
      [...greetingAnimations, ...wordAnimations, ...featureAnimations, buttonAnimation, progress, exitAnimation].forEach(value => value.stopAnimation());
    };
  }, [greetingAnimations, wordAnimations, featureAnimations, buttonAnimation, exitAnimation, orbit, pulse, progress, navigation]);

  const orbitRotation = orbit.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
  const heroScale = pulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.055]});
  const floatLeft = pulse.interpolate({inputRange: [0, 1], outputRange: [0, -8]});
  const floatRight = pulse.interpolate({inputRange: [0, 1], outputRange: [0, 7]});
  const progressWidth = progress.interpolate({inputRange: [0, 1], outputRange: ['4%', '100%']});
  const rootOpacity = exitAnimation.interpolate({inputRange: [0, 1], outputRange: [1, 0.72]});
  const rootTranslate = exitAnimation.interpolate({inputRange: [0, 1], outputRange: [0, -18]});
  const rootScale = exitAnimation.interpolate({inputRange: [0, 1], outputRange: [1, 0.97]});

  return (
    <Animated.View style={[styles.root, {opacity: rootOpacity, transform: [{translateY: rootTranslate}, {scale: rootScale}]}]}>
      <LinearGradient colors={['#F8F8FF', '#F0F1FF', '#FFFFFF']} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.brandRow}>
          <AppLogo size={42} />
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>UniVents</Text>
            <Text style={styles.brandCaption}>YOUR CAMPUS, CONNECTED</Text>
          </View>
          <View style={styles.sparkleBadge}><Icon name="sparkles" size={17} color={colors.primary} /></View>
        </View>

        <View style={styles.content}>
          <View style={styles.heroArtwork}>
            <Animated.View style={[styles.heroHalo, {transform: [{rotate: orbitRotation}]}]}>
              <View style={styles.haloDot} />
            </Animated.View>
            <Animated.View style={[styles.heroIconOuter, {transform: [{scale: heroScale}]}]}>
              <LinearGradient colors={gradients.brand} style={styles.heroIcon}>
                <Icon name="calendar" size={38} color="#fff" />
                <View style={styles.heroIconSparkle}><Icon name="sparkles" size={16} color="#FFD58A" /></View>
              </LinearGradient>
            </Animated.View>
            <Animated.View style={[styles.floatIcon, styles.floatIconLeft, {transform: [{translateY: floatLeft}, {rotate: '-9deg'}]}]}><Icon name="musical-notes" size={18} color="#F27FA7" /></Animated.View>
            <Animated.View style={[styles.floatIcon, styles.floatIconRight, {transform: [{translateY: floatRight}, {rotate: '8deg'}]}]}><Icon name="people" size={18} color="#15AFA0" /></Animated.View>
            <Animated.View style={[styles.floatIcon, styles.floatIconBottom, {transform: [{translateY: floatLeft}, {rotate: '7deg'}]}]}><Icon name="notifications" size={17} color="#F6A640" /></Animated.View>
          </View>

          <View style={styles.greetingWrap} accessibilityLiveRegion="polite">
            <View style={styles.greetingLine}>
              {greetingWords.map((word, index) => (
                <Animated.Text key={`${word}-${index}`} style={[styles.greetingWord, {
                  opacity: greetingAnimations[index],
                  transform: [{translateY: greetingAnimations[index].interpolate({inputRange: [0, 1], outputRange: [18, 0]})}],
                }]}>{word}{index < greetingWords.length - 1 ? ' ' : ''}</Animated.Text>
              ))}
            </View>
            <View style={styles.welcomeLabelRow}>
              <View style={styles.welcomeLabelLine} />
              <Text style={styles.welcomeLabel}>WELCOME TO YOUR CAMPUS</Text>
              <View style={styles.welcomeLabelLine} />
            </View>
            <View style={styles.messageLine}>
              {WORDS.map((word, index) => (
                <Animated.Text key={`${word}-${index}`} style={[styles.messageWord, {
                  opacity: wordAnimations[index],
                  transform: [{translateY: wordAnimations[index].interpolate({inputRange: [0, 1], outputRange: [12, 0]})}],
                }]}>{word}{index < WORDS.length - 1 ? ' ' : ''}</Animated.Text>
              ))}
            </View>
          </View>

          <View style={styles.featureRow}>
            <Feature animation={featureAnimations[0]} icon="calendar-outline" label="Events" tint="#5B52E8" background="#EFEEFF" />
            <Feature animation={featureAnimations[1]} icon="notifications-outline" label="Notices" tint="#E78338" background="#FFF4E8" />
            <Feature animation={featureAnimations[2]} icon="people-outline" label="Community" tint="#159A8A" background="#E8F8F5" />
          </View>
        </View>

        <Animated.View style={[styles.footer, {
          opacity: buttonAnimation,
          transform: [{translateY: buttonAnimation.interpolate({inputRange: [0, 1], outputRange: [12, 0]})}],
        }]}>
          <Text style={styles.footerTitle}>{ready ? 'Your campus is ready' : 'Getting your campus ready'}</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, {width: progressWidth}]} />
          </View>
          <Text style={styles.footerNote}>Taking you to your events and notices…</Text>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

function Feature({animation, icon, label, tint, background}) {
  return (
    <Animated.View style={[styles.featureSlot, {transform: [
      {translateY: animation.interpolate({inputRange: [0, 1], outputRange: [20, 0]})},
      {scale: animation.interpolate({inputRange: [0, 1], outputRange: [0.88, 1]})},
    ]}]}>
      <View style={styles.featureCard}>
        <View style={[styles.featureIcon, {backgroundColor: background}]}><Icon name={icon} size={18} color={tint} /></View>
        <Text style={styles.featureLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F5FF', overflow: 'hidden'},
  safeArea: {flex: 1, paddingHorizontal: 25, justifyContent: 'space-between'},
  glowTop: {position: 'absolute', width: 310, height: 310, borderRadius: 155, backgroundColor: '#DCD9FF', opacity: 0.36, top: -205, right: -120},
  glowBottom: {position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#FFE8D7', opacity: 0.5, bottom: -168, left: -150},
  brandRow: {flexDirection: 'row', alignItems: 'center', paddingTop: 8},
  brandCopy: {marginLeft: 11, flex: 1},
  brandName: {fontSize: 16, fontWeight: '900', letterSpacing: -0.4, color: colors.ink},
  brandCaption: {fontSize: 8, fontWeight: '800', color: colors.mute, letterSpacing: 1.15, marginTop: 3},
  sparkleBadge: {width: 36, height: 36, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow},
  content: {alignItems: 'center', justifyContent: 'center', flexGrow: 1, paddingVertical: 14},
  heroArtwork: {width: 205, height: 188, alignItems: 'center', justifyContent: 'center', marginBottom: 9},
  heroHalo: {position: 'absolute', width: 172, height: 172, borderRadius: 86, borderWidth: 1, borderColor: 'rgba(109,94,245,0.19)'},
  haloDot: {position: 'absolute', top: 20, left: 31, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F27FA7'},
  heroIconOuter: {width: 114, height: 114, borderRadius: 38, padding: 7, backgroundColor: 'rgba(255,255,255,0.8)', ...shadow},
  heroIcon: {flex: 1, borderRadius: 32, alignItems: 'center', justifyContent: 'center'},
  heroIconSparkle: {position: 'absolute', top: 16, right: 17},
  floatIcon: {position: 'absolute', width: 39, height: 39, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow},
  floatIconLeft: {left: 8, top: 49},
  floatIconRight: {right: 3, top: 47},
  floatIconBottom: {right: 32, bottom: 0},
  greetingWrap: {alignItems: 'center', width: '100%'},
  greetingLine: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 4},
  greetingWord: {fontSize: 31, lineHeight: 39, fontWeight: '900', color: colors.ink, letterSpacing: -1},
  welcomeLabelRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11, marginBottom: 10},
  welcomeLabelLine: {width: 20, height: 1, backgroundColor: '#C9C8E8'},
  welcomeLabel: {fontSize: 9, fontWeight: '900', color: colors.primary, letterSpacing: 1.55},
  messageLine: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320, paddingHorizontal: 8},
  messageWord: {fontSize: 17, lineHeight: 25, fontWeight: '600', color: colors.mute, textAlign: 'center'},
  featureRow: {flexDirection: 'row', gap: 9, marginTop: 23, width: '100%'},
  featureSlot: {flex: 1},
  featureCard: {flex: 1, minHeight: 82, borderRadius: 17, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECECF5', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, shadowColor: '#3C3296', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: {width: 0, height: 3}, elevation: 2},
  featureIcon: {width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6},
  featureLabel: {fontSize: 10, fontWeight: '800', color: colors.ink},
  footer: {paddingBottom: 12},
  footerTitle: {fontSize: 13, fontWeight: '800', color: colors.ink, textAlign: 'center'},
  progressTrack: {height: 5, borderRadius: 3, backgroundColor: '#E4E5F4', overflow: 'hidden', marginTop: 12},
  progressFill: {height: '100%', borderRadius: 3, backgroundColor: colors.primary},
  footerNote: {fontSize: 10.5, fontWeight: '600', color: colors.mute, textAlign: 'center', marginTop: 9},
});
