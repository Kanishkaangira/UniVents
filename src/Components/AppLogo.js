import React from 'react';
import {Image} from 'react-native';

const logoSource = require('../assets/logo.png');

export default function AppLogo({size = 44, style}) {
  return (
    <Image
      source={logoSource}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="UniVents Logo"
    />
  );
}

