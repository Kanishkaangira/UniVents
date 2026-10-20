import React, {useEffect, useRef, useState} from 'react';
import {Alert, Animated, Easing, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../Components/Screen';
import {colors, shadow} from '../Constants/theme';

const suggestions = [
  'What events are coming up?',
  'Show me recent notices',
  'Find department events',
];

export default function AIChat({navigation}) {
  const [question, setQuestion] = useState('');
  const mascotFloat = useRef(new Animated.Value(0)).current;
  const mascotWink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(Animated.sequence([
      Animated.timing(mascotFloat, {toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      Animated.timing(mascotFloat, {toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
    ]));
    floatLoop.start();
    const winkLoop = Animated.loop(Animated.sequence([
      Animated.delay(2300),
      Animated.timing(mascotWink, {toValue: 0.12, duration: 90, useNativeDriver: true}),
      Animated.delay(100),
      Animated.timing(mascotWink, {toValue: 1, duration: 120, useNativeDriver: true}),
      Animated.delay(2800),
    ]));
    winkLoop.start();
    return () => {
      floatLoop.stop();
      winkLoop.stop();
      mascotFloat.stopAnimation();
      mascotWink.stopAnimation();
    };
  }, [mascotFloat, mascotWink]);

  const mascotTranslate = mascotFloat.interpolate({inputRange: [0, 1], outputRange: [3, -5]});

  const sendQuestion = () => {
    if (!question.trim()) return;
    Alert.alert('AI chat not connected', 'The chat screen is ready, but an AI response service has not been configured yet.');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.back}>
          <Icon name="arrow-back" size={21} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.subtitle}>YOUR CAMPUS ASSISTANT</Text>
          <Text style={styles.title}>UniVents AI</Text>
        </View>
        <View style={styles.sparkle}><Icon name="sparkles" size={20} color={colors.primary} /></View>
      </View>

      <View style={styles.welcomeWrap}>
        <LinearGradient colors={['#F0EEFF', '#FBF9FF', '#FFF4EA']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.welcome}>
          <View pointerEvents="none" style={styles.welcomeOrb} />
          <View style={styles.welcomeCopy}>
            <Text style={styles.welcomeTitle}>Your campus sidekick</Text>
            <Text style={styles.welcomeText}>Events, notices, and campus plans? I’m all ears.</Text>
          </View>
          <View style={styles.welcomeTag}><View style={styles.onlineDot} /><Text style={styles.welcomeTagText}>Ready when you are</Text></View>
        </LinearGradient>
        <Animated.View style={[styles.mascot, {transform: [{translateY: mascotTranslate}]}]}>
          <LinearGradient colors={['#6759E8', '#8E7AF3']} style={styles.mascotBody}>
            <View style={styles.mascotAntenna}><View style={styles.antennaDot} /></View>
            <View style={styles.mascotFace}>
              <Animated.View style={[styles.mascotEye, {opacity: mascotWink, transform: [{scaleY: mascotWink}]}]} />
              <View style={styles.mascotEye} />
              <View style={styles.mascotSmile} />
            </View>
            <View style={styles.mascotCheekLeft} />
            <View style={styles.mascotCheekRight} />
            <View style={styles.mascotBadge}><Icon name="sparkles" size={12} color="#FFD477" /></View>
          </LinearGradient>
        </Animated.View>
        <View style={styles.chatBubble}>
          <Icon name="sparkles" size={13} color={colors.primary} />
          <Text style={styles.chatBubbleText}>Ask AI</Text>
          <View style={styles.chatBubbleTail} />
        </View>
      </View>

      <Text style={styles.sectionLabel}>TRY ASKING</Text>
      <View style={styles.suggestions}>
        {suggestions.map(prompt => (
          <TouchableOpacity key={prompt} activeOpacity={0.8} style={styles.suggestion} onPress={() => setQuestion(prompt)}>
            <Text style={styles.suggestionText}>{prompt}</Text>
            <Icon name="arrow-up-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.composer}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Type your question…"
          placeholderTextColor="#989DB4"
          style={styles.input}
          multiline
          returnKeyType="send"
          onSubmitEditing={sendQuestion}
        />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Send question" onPress={sendQuestion} style={styles.send}>
          <Icon name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.note}>AI responses will be available when the chat service is connected.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20},
  back: {width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.08},
  headerCopy: {flex: 1},
  subtitle: {fontSize: 10, fontWeight: '800', letterSpacing: 1, color: colors.mute},
  title: {fontSize: 24, fontWeight: '900', color: colors.ink, letterSpacing: -0.5},
  sparkle: {width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  welcomeWrap: {position: 'relative', marginBottom: 24, paddingTop: 16, ...shadow, shadowOpacity: 0.09},
  welcome: {borderRadius: 26, paddingHorizontal: 16, paddingTop: 62, paddingBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E7E2FF'},
  welcomeOrb: {position: 'absolute', width: 180, height: 180, borderRadius: 90, right: -75, top: -100, backgroundColor: 'rgba(110,94,245,0.09)'},
  welcomeCopy: {backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: '#EEEBFB', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 11},
  mascot: {position: 'absolute', left: 22, top: 0, zIndex: 2},
  mascotBody: {width: 76, height: 76, borderRadius: 27, alignItems: 'center', justifyContent: 'center', shadowColor: '#5147D9', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: {width: 0, height: 7}, elevation: 7},
  mascotAntenna: {position: 'absolute', width: 2, height: 11, backgroundColor: '#BDB5FF', top: -7, alignItems: 'center'},
  antennaDot: {position: 'absolute', top: -5, width: 9, height: 9, borderRadius: 5, backgroundColor: '#FFB86B', borderWidth: 2, borderColor: '#fff'},
  mascotFace: {flexDirection: 'row', alignItems: 'center', gap: 17, marginTop: 2},
  mascotEye: {width: 6, height: 8, borderRadius: 5, backgroundColor: '#fff'},
  mascotSmile: {position: 'absolute', width: 11, height: 6, borderBottomWidth: 2, borderColor: '#fff', borderRadius: 8, left: 20, top: 14},
  mascotCheekLeft: {position: 'absolute', left: 14, top: 44, width: 8, height: 5, borderRadius: 4, backgroundColor: 'rgba(255,177,190,0.7)'},
  mascotCheekRight: {position: 'absolute', right: 14, top: 44, width: 8, height: 5, borderRadius: 4, backgroundColor: 'rgba(255,177,190,0.7)'},
  mascotBadge: {position: 'absolute', right: -5, top: -5, width: 27, height: 27, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.1},
  chatBubble: {position: 'absolute', top: 9, left: 91, zIndex: 3, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: '#EFECFA', ...shadow, shadowOpacity: 0.08},
  chatBubbleTail: {position: 'absolute', left: 10, bottom: -4, width: 8, height: 8, backgroundColor: '#fff', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#EFECFA', transform: [{rotate: '45deg'}]},
  chatBubbleText: {fontSize: 12, fontWeight: '900', color: colors.primary},
  welcomeTitle: {fontSize: 17, fontWeight: '900', color: colors.ink},
  welcomeText: {fontSize: 12, lineHeight: 18, color: colors.mute, marginTop: 3},
  welcomeTag: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9, marginLeft: 3},
  onlineDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#13B981'},
  welcomeTagText: {fontSize: 10, fontWeight: '700', color: colors.mute},
  sectionLabel: {fontSize: 11, fontWeight: '900', letterSpacing: 1, color: colors.mute, marginBottom: 10},
  suggestions: {gap: 9},
  suggestion: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 15, paddingHorizontal: 14, paddingVertical: 13},
  suggestionText: {flex: 1, color: colors.ink, fontSize: 13, fontWeight: '700'},
  composer: {flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DED9FF', borderRadius: 19, padding: 9, marginTop: 24, ...shadow, shadowOpacity: 0.08},
  input: {flex: 1, minHeight: 42, maxHeight: 110, paddingHorizontal: 8, paddingTop: 11, paddingBottom: 9, fontSize: 14, color: colors.ink},
  send: {width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  note: {fontSize: 11, lineHeight: 16, color: colors.mute, textAlign: 'center', marginTop: 10},
});
