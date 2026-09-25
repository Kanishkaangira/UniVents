import React, {useMemo} from 'react';
import {KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View} from 'react-native';

// Generic slide-up modal used for event details, notices, edit profile, about, logout
export default function BottomSheet({visible, onClose, children, maxHeight = '90%', handleColor, prominentHandle = false, interactiveHandle = false}) {
  const handlePanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => interactiveHandle && gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 24) onClose();
    },
  }), [interactiveHandle, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, {maxHeight}]}>
          <View {...handlePanResponder.panHandlers}>
            <Pressable
              accessibilityRole={interactiveHandle ? 'button' : undefined}
              accessibilityLabel={interactiveHandle ? 'Close event details. Swipe down to dismiss.' : undefined}
              onPress={interactiveHandle ? onClose : undefined}
              style={styles.handleTouchArea}>
              <View style={[styles.grab, prominentHandle && styles.prominentGrab, handleColor && {backgroundColor: handleColor}]} />
            </Pressable>
          </View>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, justifyContent: 'flex-end'},
  backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,22,50,0.5)'},
  sheet: {backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 26, maxHeight: '90%'},
  handleTouchArea: {minHeight: 28, alignItems: 'center', justifyContent: 'flex-start'},
  grab: {alignSelf: 'center', width: 40, height: 4, borderRadius: 9, backgroundColor: '#DDE0EE', marginBottom: 14},
  prominentGrab: {width: 48, height: 5},
});
