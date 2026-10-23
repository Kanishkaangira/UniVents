import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, shadow} from '../Constants/theme';
import {supabase} from '../Services/supabase';
import VoiceToText, {VoiceToTextEvents} from '@appcitor/react-native-voice-to-text';

const suggestions = [
  'What events are coming up?',
  'What events are happening this week?',
  'Show me events at my department',
];

const formatInlineText = (text, baseStyle, strongStyle) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const isStrong = part.startsWith('**') && part.endsWith('**');
    return (
      <Text key={`${index}-${part}`} style={[baseStyle, isStrong && strongStyle]}>
        {isStrong ? part.slice(2, -2) : part}
      </Text>
    );
  });

function FormattedAnswer({text}) {
  const blocks = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const heading = line.match(/^#{1,3}\s+(.+)$/) || line.match(/^\*\*(.+)\*\*$/);
      const bullet = line.match(/^(?:[-*•])\s+(.+)$/);
      const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
      if (heading) return {kind: 'heading', text: heading[1], key: index};
      if (bullet) return {kind: 'bullet', text: bullet[1], key: index};
      if (numbered) return {kind: 'numbered', prefix: `${numbered[1]}.`, text: numbered[2], key: index};
      return {kind: 'paragraph', text: line, key: index};
    });

  return (
    <View style={styles.answerContent}>
      {blocks.map(block => {
        if (block.kind === 'heading') {
          return (
            <Text key={block.key} style={styles.answerHeading}>
              {formatInlineText(block.text, styles.answerHeading, styles.answerStrong)}
            </Text>
          );
        }
        if (block.kind === 'bullet' || block.kind === 'numbered') {
          return (
            <View key={block.key} style={styles.answerListRow}>
              {block.kind === 'bullet' ? (
                <View style={styles.answerBullet} />
              ) : (
                <Text style={styles.answerNumber}>{block.prefix}</Text>
              )}
              <Text style={styles.answerParagraph}>
                {formatInlineText(block.text, styles.answerParagraph, styles.answerStrong)}
              </Text>
            </View>
          );
        }
        return (
          <Text key={block.key} style={styles.answerParagraph}>
            {formatInlineText(block.text, styles.answerParagraph, styles.answerStrong)}
          </Text>
        );
      })}
    </View>
  );
}

export default function AIChat({navigation}) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const messagesRef = useRef(null);
  const voiceBaseText = useRef('');

  const applyTranscript = transcript => {
    const spokenText = transcript?.trim();
    if (!spokenText) return;
    const prefix = voiceBaseText.current;
    setQuestion(prefix ? `${prefix} ${spokenText}` : spokenText);
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const subscriptions = [
      VoiceToText.addEventListener(VoiceToTextEvents.START, () => setVoiceListening(true)),
      VoiceToText.addEventListener(VoiceToTextEvents.END, () => setVoiceListening(false)),
      VoiceToText.addEventListener(VoiceToTextEvents.RESULTS, event => applyTranscript(event.value)),
      VoiceToText.addEventListener(VoiceToTextEvents.PARTIAL_RESULTS, event => applyTranscript(event.value)),
      VoiceToText.addEventListener(VoiceToTextEvents.ERROR, event => {
        setVoiceListening(false);
        if (event.code !== 6 && event.code !== 7) {
          Alert.alert('Voice input unavailable', event.message || 'Please try speaking again.');
        }
      }),
    ];
    return () => {
      subscriptions.forEach(subscription => subscription.remove());
      VoiceToText.destroy().catch(() => {});
    };
  }, []);

  const scrollToLatest = () => messagesRef.current?.scrollToEnd({animated: true});

  const sendQuestion = async () => {
    const text = question.trim();
    if (!text || sending) return;

    const history = [];
    for (let index = 0; index < messages.length - 1; index += 1) {
      const userMessage = messages[index];
      const assistantMessage = messages[index + 1];
      if (
        userMessage.role === 'user' &&
        assistantMessage.role === 'assistant' &&
        !assistantMessage.error
      ) {
        history.push(
          {role: 'user', text: userMessage.text},
          {role: 'model', text: assistantMessage.text},
        );
        index += 1;
      }
    }

    setMessages(previous => [...previous, {role: 'user', text}]);
    setQuestion('');
    setSending(true);

    try {
      const now = new Date();
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-');
      const {data, error} = await supabase.functions.invoke('campus-assistant', {
        body: {question: text, history, today},
      });

      if (error) {
        let message = error.message;
        try {
          const response = await error.context?.json();
          if (typeof response?.error === 'string') message = response.error;
        } catch {
          // Keep the Functions client error when the response has no JSON body.
        }
        throw new Error(message);
      }
      if (typeof data?.answer !== 'string' || !data.answer.trim()) {
        throw new Error('The campus assistant returned an empty answer. Please try again.');
      }
      setMessages(previous => [
        ...previous,
        {role: 'assistant', text: data.answer.trim()},
      ]);
    } catch (error) {
      setMessages(previous => [
        ...previous,
        {
          role: 'assistant',
          text: error.message || 'Could not contact the campus assistant. Please try again.',
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const toggleVoiceInput = async () => {
    if (voiceListening) {
      await VoiceToText.stopListening().catch(() => setVoiceListening(false));
      return;
    }
    if (sending) return;

    try {
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Allow voice input',
            message: 'UniVents needs microphone access to transcribe your chatbot question.',
            buttonPositive: 'Allow',
            buttonNegative: 'Cancel',
          },
        );
        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Microphone permission needed', 'Allow microphone access to dictate a chatbot question.');
          return;
        }
      }

      const available = await VoiceToText.isRecognitionAvailable();
      if (!available) {
        Alert.alert('Voice input unavailable', 'Speech recognition is not available on this device.');
        return;
      }

      voiceBaseText.current = question.trim();
      Keyboard.dismiss();
      await VoiceToText.startListening();
    } catch (error) {
      setVoiceListening(false);
      Alert.alert('Could not start voice input', error.message || 'Please try again.');
    }
  };

  const showWelcome = messages.length === 0 && !keyboardVisible;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#E8E5FF', '#F4F5FC', colors.bg]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.backgroundGlow} />
        <View style={styles.backgroundOrb} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardFrame}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.screen, {paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 10)}]}>
          <View style={styles.header}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
              style={styles.back}>
              <Icon name="chevron-back" size={21} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerAvatar}>
              <LinearGradient colors={['#6155E8', '#8B7CF8']} style={styles.headerAvatarGradient}>
                <Icon name="sparkles" size={17} color="#fff" />
              </LinearGradient>
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>UniVents AI</Text>
              <Text style={styles.subtitle}>Your campus assistant</Text>
            </View>
            <View style={styles.headerStar} accessibilityLabel="AI assistant">
              <Icon name="sparkles" size={18} color={colors.primary} />
            </View>
          </View>

          <ScrollView
            ref={messagesRef}
            style={styles.conversation}
            contentContainerStyle={styles.conversationContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            onContentSizeChange={scrollToLatest}>
            {showWelcome ? (
              <View style={styles.emptyState}>
                <LinearGradient colors={['#F2F0FF', '#FFFFFF', '#FFF8F3']} style={styles.welcomeCard}>
                  <View style={styles.welcomeTopline}>
                    <View style={styles.welcomeIcon}>
                      <Icon name="sparkles" size={16} color={colors.primary} />
                    </View>
                    <Text style={styles.welcomeEyebrow}>CAMPUS SIDEKICK</Text>
                  </View>
                  <Text style={styles.welcomeTitle}>What is happening on campus?</Text>
                  <Text style={styles.welcomeText}>
                    Ask about upcoming events, venues, dates, or what an event is about.
                  </Text>
                  <View style={styles.welcomeTag}>
                    <Icon name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.welcomeTagText}>Answers use approved campus events</Text>
                  </View>
                </LinearGradient>

                <View style={styles.suggestionsHeading}>
                  <Text style={styles.sectionLabel}>TRY ASKING</Text>
                  <Icon name="arrow-down" size={15} color={colors.mute} />
                </View>
                <View style={styles.suggestions}>
                  {suggestions.map(prompt => (
                    <TouchableOpacity
                      key={prompt}
                      activeOpacity={0.78}
                      style={styles.suggestion}
                      onPress={() => {
                        setQuestion(prompt);
                        inputRef.current?.focus();
                      }}>
                      <Text style={styles.suggestionText}>{prompt}</Text>
                      <View style={styles.suggestionArrow}>
                        <Icon name="arrow-up" size={14} color={colors.primary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : messages.length === 0 ? (
              <Text style={styles.keyboardHint}>
                Ask about events, dates, venues, or an event topic.
              </Text>
            ) : (
              <View style={styles.messages}>
                {messages.map((message, index) => (
                  <View
                    key={`${index}-${message.role}`}
                    style={[styles.messageRow, message.role === 'user' && styles.userMessageRow]}>
                    {message.role === 'assistant' && (
                      <View style={[styles.messageAvatar, message.error && styles.errorAvatar]}>
                        <Icon
                          name={message.error ? 'alert-circle' : 'sparkles'}
                          size={13}
                          color={message.error ? colors.danger : colors.primary}
                        />
                      </View>
                    )}
                    <View
                      style={[
                        styles.message,
                        message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                        message.error && styles.errorMessage,
                      ]}>
                      {message.role === 'assistant' && !message.error ? (
                        <FormattedAnswer text={message.text} />
                      ) : (
                        <Text
                          style={[
                            styles.messageText,
                            message.role === 'user' && styles.userMessageText,
                            message.error && styles.errorText,
                          ]}>
                          {message.text}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
                {sending && (
                  <View style={styles.messageRow}>
                    <View style={styles.messageAvatar}>
                      <Icon name="sparkles" size={13} color={colors.primary} />
                    </View>
                    <View style={[styles.message, styles.assistantMessage, styles.loadingMessage]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Checking campus events...</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.composerWrap}>
            <View style={[styles.composer, question.length > 0 && styles.composerActive]}>
              <TextInput
                ref={inputRef}
                value={question}
                onChangeText={setQuestion}
                onFocus={() => setKeyboardVisible(true)}
                placeholder={voiceListening ? 'Listening... speak your question' : 'Ask about campus...'}
                placeholderTextColor="#9298B0"
                style={styles.input}
                multiline
                maxLength={1000}
                returnKeyType="send"
                submitBehavior="submit"
                onSubmitEditing={sendQuestion}
                editable={!sending}
                accessibilityLabel="Ask UniVents AI a question"
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={voiceListening ? 'Stop voice input' : 'Speak your question'}
                onPress={toggleVoiceInput}
                disabled={sending}
                style={[styles.mic, voiceListening && styles.micActive]}>
                <Icon name={voiceListening ? 'stop' : 'mic-outline'} size={19} color={voiceListening ? '#fff' : colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Send question"
                onPress={sendQuestion}
                disabled={sending || !question.trim()}
                style={[styles.send, (sending || !question.trim()) && styles.sendDisabled]}>
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="arrow-up" size={21} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.note}>UniVents AI - Campus events and helpful context</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  keyboardFrame: {flex: 1},
  screen: {flex: 1, paddingHorizontal: 16},
  backgroundGlow: {position: 'absolute', top: 90, right: -100, width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(195,188,255,0.24)'},
  backgroundOrb: {position: 'absolute', bottom: 110, left: -125, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(180,239,229,0.19)'},
  header: {flexDirection: 'row', alignItems: 'center', gap: 11, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(91,82,166,0.09)'},
  back: {width: 42, height: 42, borderRadius: 15, backgroundColor: '#F0EEFF', borderWidth: 1, borderColor: '#E2DEFF', alignItems: 'center', justifyContent: 'center'},
  headerAvatar: {width: 42, height: 42, borderRadius: 15, overflow: 'hidden', ...shadow, shadowOpacity: 0.12, elevation: 3},
  headerAvatarGradient: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  headerCopy: {flex: 1},
  title: {fontSize: 18, fontWeight: '900', color: colors.ink, letterSpacing: -0.35},
  subtitle: {fontSize: 11, fontWeight: '600', color: colors.mute, marginTop: 2},
  headerStar: {width: 38, height: 38, borderRadius: 14, backgroundColor: '#F0EEFF', borderWidth: 1, borderColor: '#E2DEFF', alignItems: 'center', justifyContent: 'center'},
  conversation: {flex: 1},
  conversationContent: {flexGrow: 1, paddingTop: 18, paddingBottom: 16},
  emptyState: {flex: 1},
  welcomeCard: {borderRadius: 25, padding: 19, borderWidth: 1, borderColor: '#E4E0FF', overflow: 'hidden', ...shadow, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3},
  welcomeTopline: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14},
  welcomeIcon: {width: 29, height: 29, borderRadius: 10, backgroundColor: '#EAE7FF', alignItems: 'center', justifyContent: 'center'},
  welcomeEyebrow: {fontSize: 10, fontWeight: '900', letterSpacing: 1.15, color: colors.primary},
  welcomeTitle: {fontSize: 21, lineHeight: 27, fontWeight: '900', color: colors.ink, letterSpacing: -0.5},
  welcomeText: {fontSize: 13, lineHeight: 19, color: colors.mute, marginTop: 7},
  welcomeTag: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16},
  welcomeTagText: {fontSize: 10, fontWeight: '700', color: colors.mute},
  suggestionsHeading: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 10, paddingHorizontal: 2},
  sectionLabel: {fontSize: 10, fontWeight: '900', letterSpacing: 1.15, color: colors.mute},
  suggestions: {gap: 9},
  suggestion: {minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: 'rgba(104,94,185,0.12)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10},
  suggestionText: {flex: 1, color: colors.ink, fontSize: 13, fontWeight: '700'},
  suggestionArrow: {width: 29, height: 29, borderRadius: 10, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center'},
  keyboardHint: {fontSize: 12, color: colors.mute, textAlign: 'center', marginTop: 10},
  messages: {gap: 15, paddingBottom: 8},
  messageRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 7},
  userMessageRow: {justifyContent: 'flex-end'},
  messageAvatar: {width: 25, height: 25, borderRadius: 9, backgroundColor: '#EAE7FF', alignItems: 'center', justifyContent: 'center', marginBottom: 2},
  errorAvatar: {backgroundColor: '#FFF0ED'},
  message: {maxWidth: '84%', borderRadius: 19, paddingHorizontal: 14, paddingVertical: 11},
  userMessage: {backgroundColor: colors.primary, borderBottomRightRadius: 6},
  assistantMessage: {backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(103,93,177,0.12)', borderBottomLeftRadius: 6, ...shadow, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1},
  messageText: {flexShrink: 1, color: colors.ink, fontSize: 14, lineHeight: 21},
  answerContent: {gap: 9},
  answerHeading: {fontSize: 14, lineHeight: 20, fontWeight: '800', color: colors.ink},
  answerParagraph: {flexShrink: 1, fontSize: 13, lineHeight: 20, color: colors.ink},
  answerStrong: {fontWeight: '800', color: colors.ink},
  answerListRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8},
  answerBullet: {width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7},
  answerNumber: {minWidth: 18, fontSize: 13, lineHeight: 20, fontWeight: '800', color: colors.primary},
  userMessageText: {color: '#fff'},
  errorMessage: {borderColor: '#F4C7C0', backgroundColor: '#FFF7F5'},
  errorText: {color: colors.danger},
  loadingMessage: {flexDirection: 'row', alignItems: 'center', gap: 9},
  loadingText: {fontSize: 12, color: colors.mute},
  composerWrap: {paddingTop: 10},
  composer: {minHeight: 58, flexDirection: 'row', alignItems: 'flex-end', gap: 9, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0DDF3', borderRadius: 21, padding: 8, ...shadow, shadowOpacity: 0.09, shadowRadius: 12, elevation: 4},
  composerActive: {borderColor: '#A9A1F6'},
  input: {flex: 1, minHeight: 40, maxHeight: 108, paddingHorizontal: 9, paddingTop: 10, paddingBottom: 9, fontSize: 14, lineHeight: 20, color: colors.ink},
  send: {width: 42, height: 42, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  mic: {width: 42, height: 42, borderRadius: 15, backgroundColor: '#F0EEFF', borderWidth: 1, borderColor: '#E2DEFF', alignItems: 'center', justifyContent: 'center'},
  micActive: {backgroundColor: colors.danger, borderColor: colors.danger},
  sendDisabled: {opacity: 0.43},
  note: {fontSize: 10, lineHeight: 14, color: colors.mute, textAlign: 'center', marginTop: 8},
});
