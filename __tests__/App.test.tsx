/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
    clear: jest.fn(async () => undefined),
    getAllKeys: jest.fn(async () => []),
    multiGet: jest.fn(async () => []),
    multiSet: jest.fn(async () => undefined),
    multiRemove: jest.fn(async () => undefined),
  };
  return {__esModule: true, default: storage, ...storage};
});

jest.mock('../src/Services/pushNotifications', () => ({
  listenForForegroundEventPushNotifications: jest.fn(() => () => {}),
  registerForEventPushNotifications: jest.fn(async () => () => {}),
  removeRegisteredDeviceToken: jest.fn(async () => undefined),
}));

jest.mock('react-native-pdf', () => 'Pdf');
jest.mock('@appcitor/react-native-voice-to-text', () => ({
  __esModule: true,
  default: {},
  VoiceToTextEvents: {},
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
