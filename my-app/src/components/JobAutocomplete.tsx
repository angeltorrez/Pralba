import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getTrabajoCatalogoStorage } from '../storage/storageFactory';
import { TrabajoCatalogo } from '../types';

interface JobAutocompleteProps {
  value: string;
  onSelect: (job: TrabajoCatalogo) => void;
  onChangeText: (text: string) => void;
  onAddNew?: (jobName: string) => void;
  placeholder?: string;
}

export const JobAutocomplete: React.FC<JobAutocompleteProps> = ({
  value,
  onSelect,
  onChangeText,
  onAddNew,
  placeholder = 'Buscar o agregar trabajo...',
}) => {
  const { colors, fontScaling } = useTheme();
  const [suggestions, setSuggestions] = useState<TrabajoCatalogo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const jobCatalogoStorage = getTrabajoCatalogoStorage();

  useEffect(() => {
    if (value.trim().length > 0) {
      searchJobs();
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value]);

  const searchJobs = async () => {
    try {
      const allJobs = await jobCatalogoStorage.getAllTrabajos();
      const results = allJobs.filter(job =>
        job.nombre.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(results);
      setIsOpen(true);
    } catch (error) {
      console.error('Error searching jobs:', error);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (job: TrabajoCatalogo) => {
    onSelect(job);
    onChangeText('');
    setIsOpen(false);
  };

  const handleAddNew = () => {
    if (value.trim().length > 0 && onAddNew) {
      onAddNew(value);
      onChangeText('');
      setIsOpen(false);
    }
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
        onFocus={() => value.length > 0 && setIsOpen(true)}
      />

      {isOpen && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {suggestions.length > 0 ? (
            <>
              <FlatList
                data={suggestions}
                keyExtractor={item => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestion}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <Text style={[styles.suggestionText, { color: colors.text }]}>
                      {item.nombre}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <View style={[styles.divider, { borderTopColor: colors.border }]} />
            </>
          ) : null}

          {value.trim().length > 0 && (
            <TouchableOpacity style={styles.addNew} onPress={handleAddNew}>
              <Text style={[styles.addNewText, { color: colors.primary }]}>
                + Agregar "{value}" como nuevo trabajo
              </Text>
            </TouchableOpacity>
          )}
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
    maxHeight: 200,
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
  divider: {
    borderTopWidth: 1,
  },
  addNew: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  addNewText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
