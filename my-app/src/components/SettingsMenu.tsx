import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { useTheme, FontSize, ThemeMode } from '../context/ThemeContext';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose }) => {
  const { fontSize, theme, setFontSize, setTheme, colors, fontScaling } = useTheme();

  const fontSizeOptions: { label: string; value: FontSize }[] = [
    { label: 'Pequeño', value: 'small' },
    { label: 'Medio', value: 'medium' },
    { label: 'Grande', value: 'large' },
  ];

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontScaling.heading2 }]}>
            Configuración
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeBtn, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
              Tamaño de Fuente
            </Text>
            <View style={styles.optionsContainer}>
              {fontSizeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        fontSize === option.value ? colors.primary : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleFontSizeChange(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: fontSize === option.value ? '#fff' : colors.text,
                        fontSize: fontScaling.body,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
              Tema
            </Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.option,
                  {
                    backgroundColor: theme === 'light' ? colors.primary : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleThemeChange('light')}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: theme === 'light' ? '#fff' : colors.text,
                      fontSize: fontScaling.body,
                    },
                  ]}
                >
                  ☀️ Claro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.option,
                  {
                    backgroundColor: theme === 'dark' ? colors.primary : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleThemeChange('dark')}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: theme === 'dark' ? '#fff' : colors.text,
                      fontSize: fontScaling.body,
                    },
                  ]}
                >
                  🌙 Oscuro
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  closeBtn: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
