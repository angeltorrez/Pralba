import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Budget } from '../types';
import { budgetStorage } from '../storage/budgetStorage';
import { formatDateShort } from '../utils/dateFormatter';

interface BudgetCardProps {
  budget: Budget;
  onDelete: (id: string) => void;
  onPress: (budget: Budget) => void;
  onEdit?: (budget: Budget) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onDelete, onPress, onEdit }) => {
  const { colors, fontScaling } = useTheme();

  const handleDelete = () => {
    Alert.alert(
      'Eliminar presupuesto',
      '¿Está seguro de que desea eliminar este presupuesto?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Eliminar',
          onPress: async () => {
            await budgetStorage.deleteBudget(budget.id);
            onDelete(budget.id);
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => onPress(budget)}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontScaling.heading3 }]}>
          {budget.clientOrProject}
        </Text>
        <TouchableOpacity onPress={handleDelete} style={[styles.deleteBtn, { backgroundColor: colors.danger }]}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.itemCount, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
          {budget.works.length} trabajos
        </Text>
        <Text style={[styles.amount, { color: colors.success, fontSize: fontScaling.heading3 }]}>
          ${budget.totalAmount.toFixed(2)}
        </Text>
      </View>
      
      <Text style={[styles.date, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
        {formatDateShort(budget.createdAt)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  itemCount: {},
  amount: {
    fontWeight: 'bold',
  },
  date: {},
});
