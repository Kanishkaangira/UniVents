import React, {useState} from 'react';
import {Alert, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
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

      <View style={styles.welcome}>
        <View style={styles.welcomeIcon}><Icon name="chatbubbles" size={25} color="#fff" /></View>
        <Text style={styles.welcomeTitle}>Hi, how can I help?</Text>
        <Text style={styles.welcomeText}>Ask about campus events, clubs, departments, or notices.</Text>
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
  header: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28},
  back: {width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.08},
  headerCopy: {flex: 1},
  subtitle: {fontSize: 10, fontWeight: '800', letterSpacing: 1, color: colors.mute},
  title: {fontSize: 24, fontWeight: '900', color: colors.ink, letterSpacing: -0.5},
  sparkle: {width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  welcome: {backgroundColor: '#fff', borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 28, ...shadow, shadowOpacity: 0.08},
  welcomeIcon: {width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14},
  welcomeTitle: {fontSize: 20, fontWeight: '900', color: colors.ink},
  welcomeText: {fontSize: 13, lineHeight: 19, color: colors.mute, textAlign: 'center', marginTop: 7},
  sectionLabel: {fontSize: 11, fontWeight: '900', letterSpacing: 1, color: colors.mute, marginBottom: 10},
  suggestions: {gap: 9},
  suggestion: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 15, paddingHorizontal: 14, paddingVertical: 13},
  suggestionText: {flex: 1, color: colors.ink, fontSize: 13, fontWeight: '700'},
  composer: {flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DED9FF', borderRadius: 19, padding: 9, marginTop: 24, ...shadow, shadowOpacity: 0.08},
  input: {flex: 1, minHeight: 42, maxHeight: 110, paddingHorizontal: 8, paddingTop: 11, paddingBottom: 9, fontSize: 14, color: colors.ink},
  send: {width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  note: {fontSize: 11, lineHeight: 16, color: colors.mute, textAlign: 'center', marginTop: 10},
});
