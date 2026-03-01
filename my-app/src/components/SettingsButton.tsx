import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SettingsMenu } from './SettingsMenu';

export const SettingsButton: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { colors, fontScaling } = useTheme();

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsMenuOpen(true)}
        style={{ paddingHorizontal: 12 }}
      >
        <Text style={{ fontSize: fontScaling.heading3, color: colors.text }}>☰</Text>
      </TouchableOpacity>
      <SettingsMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};
