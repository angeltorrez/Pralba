import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { TrabajoCatalogo } from '../types';
import { getTrabajoCatalogoStorage } from '../storage/storageFactory';

interface TrabajoAutocompleteProps {
  value: string;
  onSelect: (trabajo: TrabajoCatalogo) => void;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const TrabajoAutocomplete: React.FC<TrabajoAutocompleteProps> = ({
  value,
  onSelect,
  onChangeText,
  placeholder = 'Buscar trabajo...',
}) => {
  const { colors, fontScaling } = useTheme();
  const [sugerencias, setSugerencias] = useState<TrabajoCatalogo[]>([]);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const buscarTrabajos = async () => {
      if (value.trim().length === 0) {
        setSugerencias([]);
        setAbierto(false);
        return;
      }

      const storage = getTrabajoCatalogoStorage();
      const trabajos = await storage.getAllTrabajos();
      const filtro = value.trim().toLowerCase();
      const resultados = trabajos.filter((t) => t.nombre.toLowerCase().includes(filtro));
      setSugerencias(resultados.slice(0, 8));
      setAbierto(true);
    };

    buscarTrabajos();
  }, [value]);

  const seleccionar = (trabajo: TrabajoCatalogo) => {
    onSelect(trabajo);
    onChangeText('');
    setAbierto(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
            fontSize: fontScaling.body,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => value.length > 0 && setAbierto(true)}
      />

      {abierto && sugerencias.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <FlatList
            data={sugerencias}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestion} onPress={() => seleccionar(item)}>
                <Text style={[styles.suggestionText, { color: colors.text }]}>{item.nombre}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: -1,
    maxHeight: 280,
  },
  suggestion: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 14,
  },
});
